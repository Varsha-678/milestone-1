import cv2
from pathlib import Path
from typing import Dict, Any, List
import numpy as np

from backend.app.config import (
    RESULT_DIR,
    VIDEO_SAMPLE_INTERVAL_SECONDS,
    MAX_VIDEO_FRAMES_TO_ANALYZE,
)
from backend.app.services.yolo_service import get_yolo_manager
from backend.app.services.compliance_service import evaluate_compliance


def process_video_job(
    video_path: Path,
    job_id: str,
    conf_threshold: float = 0.25,
    policy_required_categories: List[str] = None
) -> Dict[str, Any]:
    """
    Extracts frames from an uploaded video at configured intervals,
    runs YOLO inference on each frame, saves annotated frames,
    and returns comprehensive frame-by-frame and aggregate results.
    """
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError("Could not open video file for processing.")

    yolo_mgr = get_yolo_manager()
    supported_classes = yolo_mgr.get_supported_classes()

    # Create job-specific results directory
    job_result_dir = RESULT_DIR / job_id
    job_result_dir.mkdir(parents=True, exist_ok=True)

    fps = cap.get(cv2.CAP_PROP_FPS) or 24.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    duration_sec = total_frames / fps if fps > 0 else 0.0

    frame_step = max(1, int(fps * VIDEO_SAMPLE_INTERVAL_SECONDS))

    frame_results: List[Dict[str, Any]] = []
    current_frame_idx = 0
    sampled_count = 0
    representative_image_path = None

    total_detections_sum = 0
    total_violations_sum = 0
    compliance_percentages: List[float] = []

    try:
        while cap.isOpened() and sampled_count < MAX_VIDEO_FRAMES_TO_ANALYZE:
            ret, frame = cap.read()
            if not ret or frame is None:
                break

            if current_frame_idx % frame_step == 0:
                timestamp = round(current_frame_idx / fps, 2)
                
                # Perform YOLO inference on the sampled frame
                annotated_frame, detections = yolo_mgr.predict(frame, conf_threshold=conf_threshold)
                
                # Evaluate compliance for this specific frame
                frame_compliance = evaluate_compliance(
                    detections=detections,
                    supported_classes=supported_classes,
                    policy_required_categories=policy_required_categories
                )

                # Save annotated frame image
                frame_filename = f"frame_{sampled_count:04d}_{int(timestamp)}s.jpg"
                frame_save_path = job_result_dir / frame_filename
                cv2.imwrite(str(frame_save_path), annotated_frame)

                frame_rel_url = f"/results/{job_id}/{frame_filename}"
                if representative_image_path is None:
                    representative_image_path = frame_rel_url

                v_count = frame_compliance.get("total_violations_detected", 0)
                d_count = len(detections)

                total_detections_sum += d_count
                total_violations_sum += v_count

                if frame_compliance.get("compliance_percentage") is not None:
                    compliance_percentages.append(frame_compliance["compliance_percentage"])

                frame_results.append({
                    "frame_index": current_frame_idx,
                    "sample_number": sampled_count + 1,
                    "timestamp_sec": timestamp,
                    "annotated_frame_url": frame_rel_url,
                    "detection_count": d_count,
                    "violation_count": v_count,
                    "detections": detections,
                    "compliance": frame_compliance
                })

                sampled_count += 1

            current_frame_idx += 1

    finally:
        cap.release()

    if sampled_count == 0:
        raise RuntimeError("No readable frames could be extracted from video.")

    # Aggregate overall compliance across sampled frames
    avg_compliance = (
        round(float(np.mean(compliance_percentages)), 1)
        if compliance_percentages else None
    )

    overall_status = "Fully Compliant"
    if total_violations_sum > 0:
        overall_status = "Safety Violations Detected"
    elif avg_compliance is None:
        overall_status = "Insufficient Data"

    overall_compliance_details = {
        "status_label": overall_status,
        "compliance_percentage": avg_compliance,
        "formula": f"Average compliance across {sampled_count} sampled frames: {avg_compliance}%" if avg_compliance is not None else "Insufficient data across sampled frames",
        "sampled_frames_count": sampled_count,
        "sample_interval_sec": VIDEO_SAMPLE_INTERVAL_SECONDS,
        "total_detections_all_frames": total_detections_sum,
        "total_violations_all_frames": total_violations_sum,
        "note": "Sampled-frame analysis evaluates periodic keyframes. Events occurring strictly between sampled intervals may not be captured."
    }

    return {
        "video_metadata": {
            "width": width,
            "height": height,
            "fps": round(fps, 2),
            "total_frames": total_frames,
            "duration_seconds": round(duration_sec, 2),
            "analyzed_frames": sampled_count
        },
        "frame_results": frame_results,
        "representative_media_url": representative_image_path,
        "total_detection_count": total_detections_sum,
        "total_violation_count": total_violations_sum,
        "overall_compliance_score": avg_compliance,
        "overall_compliance_details": overall_compliance_details
    }
