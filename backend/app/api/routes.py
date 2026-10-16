from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional
import io
import cv2
import numpy as np

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.config import (
    UPLOAD_DIR,
    RESULT_DIR,
    REPORT_DIR,
    MAX_UPLOAD_SIZE_BYTES,
    MAX_UPLOAD_SIZE_MB,
    DEFAULT_CONF_THRESHOLD,
    PPE_MODEL_PATH
)
from backend.app.database.session import get_db, SessionLocal
from backend.app.database.models import AnalysisJob
from backend.app.schemas.job_schemas import HealthResponse, JobSummary, JobDetail
from backend.app.utils.security import sanitize_filename, generate_unique_filename, safe_delete_file
from backend.app.utils.file_validator import (
    validate_file_metadata,
    validate_image_content,
    validate_video_file,
    FileValidationError
)
from backend.app.services.yolo_service import get_yolo_manager
from backend.app.services.compliance_service import evaluate_compliance
from backend.app.services.video_service import process_video_job
from backend.app.services.report_service import generate_html_report

router = APIRouter(prefix="/api")


@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Checks backend health, database availability, and YOLOv8 model loading status.
    """
    yolo_mgr = get_yolo_manager()
    supported_classes = yolo_mgr.get_supported_classes()
    
    msg = "Backend operational."
    if yolo_mgr.is_loaded:
        msg += f" Model loaded with {len(supported_classes)} classes."
    else:
        msg += f" Model unavailable: {yolo_mgr.error_message}"

    return {
        "status": "healthy",
        "backend_version": "1.0.0",
        "model_loaded": yolo_mgr.is_loaded,
        "model_name": Path(yolo_mgr.model_path).name,
        "model_path": yolo_mgr.model_path,
        "supported_classes": supported_classes,
        "message": msg
    }


def _run_video_background(job_id: str, video_path: Path, conf_threshold: float, policy_items: List[str]):
    """Background task worker for video decoding and YOLO analysis."""
    db = SessionLocal()
    try:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if not job:
            return

        job.processing_status = "Processing"
        job.processing_started_at = datetime.now(timezone.utc)
        db.commit()

        # Execute video frame processing
        result = process_video_job(
            video_path=video_path,
            job_id=job_id,
            conf_threshold=conf_threshold,
            policy_required_categories=policy_items
        )

        job.processing_status = "Completed"
        job.processing_completed_at = datetime.now(timezone.utc)
        job.detection_count = result["total_detection_count"]
        job.violation_count = result["total_violation_count"]
        job.compliance_score = result["overall_compliance_score"]
        job.compliance_details = result["overall_compliance_details"]
        job.detection_results = result["frame_results"]
        job.video_metadata = result["video_metadata"]
        job.result_media_path = result["representative_media_url"]

        # Generate report
        report_path = generate_html_report(job.to_dict())
        job.report_path = f"/reports/{Path(report_path).name}"

        db.commit()

    except Exception as exc:
        job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            job.processing_status = "Failed"
            job.processing_completed_at = datetime.now(timezone.utc)
            job.error_message = f"Video analysis failed: {str(exc)}"
            db.commit()
    finally:
        db.close()


@router.post("/analyze")
async def analyze_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    conf_threshold: float = Form(DEFAULT_CONF_THRESHOLD),
    required_ppe: Optional[str] = Form("helmet,vest"),
    db: Session = Depends(get_db)
):
    """
    Accepts one file (image or video), performs thorough server-side validation,
    executes YOLOv8 inference, evaluates PPE compliance, and records results.
    """
    # Parse required policy categories
    policy_items = [cat.strip() for cat in required_ppe.split(",") if cat.strip()] if required_ppe else ["helmet", "vest"]

    # Read uploaded bytes
    try:
        content_bytes = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Failed to read uploaded file payload.")

    filename = file.filename or "unknown"
    content_length = len(content_bytes)

    # Validate metadata (length, extension, MIME type)
    try:
        media_type, ext = validate_file_metadata(
            filename=filename,
            content_length=content_length,
            content_type=file.content_type or ""
        )
    except FileValidationError as fve:
        raise HTTPException(status_code=fve.status_code, detail=fve.message)

    # Sanitize and assign unique server-side identifier
    stored_name = generate_unique_filename(filename)
    stored_path = UPLOAD_DIR / stored_name

    # Save file to disk
    try:
        with open(stored_path, "wb") as f:
            f.write(content_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Server could not write upload to storage: {str(exc)}")

    # Deep validation of actual file contents
    try:
        if media_type == "image":
            image_meta = validate_image_content(content_bytes)
        else:
            video_meta = validate_video_file(stored_path)
    except FileValidationError as fve:
        # Delete invalid file immediately
        safe_delete_file(stored_path, [UPLOAD_DIR])
        raise HTTPException(status_code=fve.status_code, detail=fve.message)

    # Check model readiness
    yolo_mgr = get_yolo_manager()
    if not yolo_mgr.is_loaded:
        safe_delete_file(stored_path, [UPLOAD_DIR])
        raise HTTPException(
            status_code=503,
            detail=f"The PPE model is unavailable. {yolo_mgr.error_message or 'Please configure valid model weights.'}"
        )

    # Create AnalysisJob DB record
    job = AnalysisJob(
        original_filename=sanitize_filename(filename),
        stored_filename=stored_name,
        media_type=media_type,
        file_size_bytes=content_length,
        processing_status="Uploaded",
        model_identifier=Path(yolo_mgr.model_path).name,
        model_supported_classes=yolo_mgr.get_supported_classes()
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    if media_type == "image":
        # Synchronous Image Processing
        try:
            job.processing_status = "Processing"
            job.processing_started_at = datetime.now(timezone.utc)
            db.commit()

            # Decode image into BGR numpy array
            nparr = np.frombuffer(content_bytes, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img_bgr is None:
                raise RuntimeError("OpenCV failed to decode image array.")

            annotated_bgr, detections = yolo_mgr.predict(img_bgr, conf_threshold=conf_threshold)

            # Evaluate compliance
            compliance_eval = evaluate_compliance(
                detections=detections,
                supported_classes=yolo_mgr.get_supported_classes(),
                policy_required_categories=policy_items
            )

            # Save annotated image
            result_img_name = f"annotated_{job.id}.jpg"
            result_img_path = RESULT_DIR / result_img_name
            cv2.imwrite(str(result_img_path), annotated_bgr)

            # Update Job Record
            job.processing_status = "Completed"
            job.processing_completed_at = datetime.now(timezone.utc)
            job.detection_count = len(detections)
            job.violation_count = compliance_eval.get("total_violations_detected", 0)
            job.compliance_score = compliance_eval.get("compliance_percentage")
            job.compliance_details = compliance_eval
            job.detection_results = detections
            job.result_media_path = f"/results/{result_img_name}"

            # Generate Report
            report_path = generate_html_report(job.to_dict())
            job.report_path = f"/reports/{Path(report_path).name}"

            db.commit()
            db.refresh(job)
            return job.to_dict()

        except Exception as exc:
            job.processing_status = "Failed"
            job.processing_completed_at = datetime.now(timezone.utc)
            job.error_message = f"Inference processing failed: {str(exc)}"
            db.commit()
            raise HTTPException(status_code=500, detail=f"Image processing failed: {str(exc)}")

    else:
        # Asynchronous Video Processing via Background Tasks
        job.processing_status = "Processing"
        job.processing_started_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(job)

        background_tasks.add_task(
            _run_video_background,
            job_id=job.id,
            video_path=stored_path,
            conf_threshold=conf_threshold,
            policy_items=policy_items
        )

        return job.to_dict()


@router.get("/jobs", response_model=List[JobSummary])
def list_jobs(db: Session = Depends(get_db)):
    """Returns all processing history records ordered by upload time descending."""
    jobs = db.query(AnalysisJob).order_by(AnalysisJob.upload_timestamp.desc()).all()
    return [j.to_dict() for j in jobs]


@router.get("/jobs/{job_id}", response_model=JobDetail)
def get_job_detail(job_id: str, db: Session = Depends(get_db)):
    """Retrieves detailed status, bounding boxes, and compliance results for a job."""
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job record not found.")
    return job.to_dict()


@router.get("/jobs/{job_id}/report")
def download_job_report(job_id: str, db: Session = Depends(get_db)):
    """Downloads or serves the safety analysis HTML report for a completed job."""
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found.")

    if job.processing_status != "Completed":
        raise HTTPException(status_code=400, detail="Cannot generate report for incomplete or failed jobs.")

    report_file = REPORT_DIR / f"{job_id}_safety_report.html"
    if not report_file.exists():
        # Regenerate report if missing
        generate_html_report(job.to_dict())

    return FileResponse(
        path=str(report_file),
        media_type="text/html",
        filename=f"SafeSight_Report_{job.original_filename}_{job_id[:8]}.html"
    )


@router.delete("/jobs/{job_id}")
def delete_job(job_id: str, db: Session = Depends(get_db)):
    """Safely deletes an analysis job and removes all associated media and reports."""
    job = db.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job record not found.")

    allowed_roots = [UPLOAD_DIR, RESULT_DIR, REPORT_DIR]

    # Delete uploaded media
    if job.stored_filename:
        safe_delete_file(UPLOAD_DIR / job.stored_filename, allowed_roots)

    # Delete results
    if job.media_type == "image":
        safe_delete_file(RESULT_DIR / f"annotated_{job.id}.jpg", allowed_roots)
    else:
        safe_delete_file(RESULT_DIR / job.id, allowed_roots)

    # Delete report
    safe_delete_file(REPORT_DIR / f"{job.id}_safety_report.html", allowed_roots)

    db.delete(job)
    db.commit()

    return {"status": "success", "message": f"Job {job_id} and associated files deleted safely."}
