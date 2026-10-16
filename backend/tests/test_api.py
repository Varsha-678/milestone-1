import io
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from PIL import Image
import cv2
import numpy as np

from backend.app.main import app
from backend.app.database.session import SessionLocal, init_db
from backend.app.database.models import AnalysisJob
from backend.app.services.yolo_service import YOLOModelManager

client = TestClient(app)


def create_test_image_bytes(fmt="JPEG"):
    buf = io.BytesIO()
    img = Image.new("RGB", (200, 200), color=(100, 150, 200))
    img.save(buf, format=fmt)
    return buf.getvalue()


def create_test_video_bytes():
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
        tpath = Path(tf.name)
    try:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(tpath), fourcc, 10.0, (100, 100))
        for _ in range(10):
            frame = np.zeros((100, 100, 3), dtype=np.uint8)
            frame[:] = (50, 100, 150)
            out.write(frame)
        out.release()
        return tpath.read_bytes()
    finally:
        if tpath.exists():
            tpath.unlink()


@pytest.fixture(autouse=True)
def setup_database():
    init_db()


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "supported_classes" in data
    assert isinstance(data["supported_classes"], list)


def test_analyze_valid_jpg():
    img_bytes = create_test_image_bytes()
    files = {"file": ("worker_sample.jpg", img_bytes, "image/jpeg")}
    response = client.post("/api/analyze", files=files, data={"conf_threshold": 0.25})
    assert response.status_code == 200
    job = response.json()
    assert job["processing_status"] == "Completed"
    assert job["media_type"] == "image"
    assert job["original_filename"] == "worker_sample.jpg"
    assert job["result_media_path"] is not None
    assert job["report_path"] is not None

    # Verify report is accessible
    report_res = client.get(f"/api/jobs/{job['id']}/report")
    assert report_res.status_code == 200
    assert "text/html" in report_res.headers["content-type"]


def test_analyze_unsupported_format():
    files = {"file": ("script.py", b"print('hello')", "text/x-python")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_analyze_empty_file():
    files = {"file": ("empty.jpg", b"", "image/jpeg")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 400
    assert "0 bytes" in response.json()["detail"]


def test_analyze_corrupted_image():
    files = {"file": ("broken.png", b"RANDOM_INVALID_DATA_BYTES", "image/png")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"]


def test_analyze_valid_video():
    vid_bytes = create_test_video_bytes()
    files = {"file": ("safety_feed.mp4", vid_bytes, "video/mp4")}
    response = client.post("/api/analyze", files=files, data={"conf_threshold": 0.25})
    assert response.status_code == 200
    job = response.json()
    assert job["media_type"] == "video"
    assert job["processing_status"] in ["Processing", "Completed"]


def test_jobs_history_and_deletion():
    # First create an image job
    img_bytes = create_test_image_bytes()
    files = {"file": ("to_delete.jpg", img_bytes, "image/jpeg")}
    create_res = client.post("/api/analyze", files=files)
    assert create_res.status_code == 200
    job_id = create_res.json()["id"]

    # Retrieve history
    list_res = client.get("/api/jobs")
    assert list_res.status_code == 200
    job_ids = [j["id"] for j in list_res.json()]
    assert job_id in job_ids

    # Retrieve single job
    get_res = client.get(f"/api/jobs/{job_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == job_id

    # Delete job
    del_res = client.delete(f"/api/jobs/{job_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # Confirm 404 after deletion
    get_after_del = client.get(f"/api/jobs/{job_id}")
    assert get_after_del.status_code == 404


def test_database_persistence_across_sessions():
    db = SessionLocal()
    job = AnalysisJob(
        original_filename="persisted_test.jpg",
        stored_filename="persisted_test_123.jpg",
        media_type="image",
        file_size_bytes=1024,
        processing_status="Completed"
    )
    db.add(job)
    db.commit()
    saved_id = job.id
    db.close()

    # Re-open fresh session to verify persistence
    fresh_db = SessionLocal()
    persisted_job = fresh_db.query(AnalysisJob).filter(AnalysisJob.id == saved_id).first()
    assert persisted_job is not None
    assert persisted_job.original_filename == "persisted_test.jpg"
    fresh_db.delete(persisted_job)
    fresh_db.commit()
    fresh_db.close()


def test_missing_model_weights_handling():
    # Instantiate manager pointing to non-existent weights
    bad_mgr = YOLOModelManager(model_path="models/non_existent_weights.pt")
    assert bad_mgr.is_loaded is False
    assert "not found" in bad_mgr.error_message


def test_analyze_valid_png():
    png_bytes = create_test_image_bytes("PNG")
    files = {"file": ("inspection_helmet.png", png_bytes, "image/png")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 200
    job = response.json()
    assert job["processing_status"] == "Completed"
    assert job["media_type"] == "image"
    assert "inspection_helmet" in job["original_filename"]


def test_analyze_valid_webp():
    webp_bytes = create_test_image_bytes("WEBP")
    files = {"file": ("site_capture.webp", webp_bytes, "image/webp")}
    response = client.post("/api/analyze", files=files)
    assert response.status_code == 200
    job = response.json()
    assert job["processing_status"] == "Completed"
    assert job["media_type"] == "image"


def test_failed_processing_status_handling():
    db = SessionLocal()
    failed_job = AnalysisJob(
        original_filename="corrupted_stream.mp4",
        stored_filename="corrupted_stream_err.mp4",
        media_type="video",
        file_size_bytes=4096,
        processing_status="Failed",
        error_message="Video frame extraction failed: invalid codec"
    )
    db.add(failed_job)
    db.commit()
    job_id = failed_job.id
    db.close()

    # Query API to ensure failed job is clearly distinguished
    res = client.get(f"/api/jobs/{job_id}")
    assert res.status_code == 200
    data = res.json()
    assert data["processing_status"] == "Failed"
    assert "invalid codec" in data["error_message"]

    # Attempting to download report for failed job should return 400
    rep_res = client.get(f"/api/jobs/{job_id}/report")
    assert rep_res.status_code == 400
    assert "Cannot generate report" in rep_res.json()["detail"]

    # Clean up
    del_res = client.delete(f"/api/jobs/{job_id}")
    assert del_res.status_code == 200

