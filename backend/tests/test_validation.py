import io
import tempfile
from pathlib import Path
import pytest
from PIL import Image
import cv2
import numpy as np

from backend.app.utils.file_validator import (
    validate_file_metadata,
    validate_image_content,
    validate_video_file,
    FileValidationError
)
from backend.app.utils.security import sanitize_filename, generate_unique_filename, is_safe_path


def create_dummy_image_bytes(format="JPEG", size=(100, 100), color=(255, 0, 0)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()


def test_valid_jpg_metadata():
    mtype, ext = validate_file_metadata("worker_site.jpg", 1024, "image/jpeg")
    assert mtype == "image"
    assert ext == "jpg"


def test_valid_png_metadata():
    mtype, ext = validate_file_metadata("helmet_check.png", 2048, "image/png")
    assert mtype == "image"
    assert ext == "png"


def test_valid_webp_metadata():
    mtype, ext = validate_file_metadata("inspection.webp", 1500, "image/webp")
    assert mtype == "image"
    assert ext == "webp"


def test_valid_video_metadata():
    mtype, ext = validate_file_metadata("site_camera.mp4", 50000, "video/mp4")
    assert mtype == "video"
    assert ext == "mp4"


def test_unsupported_file_format():
    with pytest.raises(FileValidationError) as exc:
        validate_file_metadata("malicious_script.exe", 1024)
    assert "Unsupported file format" in str(exc.value)

    with pytest.raises(FileValidationError) as exc:
        validate_file_metadata("document.pdf", 1024)
    assert "Unsupported file format" in str(exc.value)


def test_empty_file():
    with pytest.raises(FileValidationError) as exc:
        validate_file_metadata("empty.jpg", 0)
    assert "0 bytes" in str(exc.value)


def test_oversized_file():
    oversized = 51 * 1024 * 1024  # 51 MB (limit is 50MB)
    with pytest.raises(FileValidationError) as exc:
        validate_file_metadata("huge.jpg", oversized)
    assert "exceeds" in str(exc.value)


def test_valid_image_content_decoding():
    jpg_bytes = create_dummy_image_bytes("JPEG")
    meta = validate_image_content(jpg_bytes)
    assert meta["format"] == "jpeg"
    assert meta["width"] == 100
    assert meta["height"] == 100

    png_bytes = create_dummy_image_bytes("PNG")
    meta_png = validate_image_content(png_bytes)
    assert meta_png["format"] == "png"

    webp_bytes = create_dummy_image_bytes("WEBP")
    meta_webp = validate_image_content(webp_bytes)
    assert meta_webp["format"] == "webp"


def test_corrupted_image():
    corrupted_bytes = b"NOT_A_REAL_IMAGE_RANDOM_DATA_1234567890"
    with pytest.raises(FileValidationError) as exc:
        validate_image_content(corrupted_bytes)
    assert "corrupted" in str(exc.value)


def test_valid_video_file_check():
    # Create a small valid test video with OpenCV
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
        temp_video_path = Path(tf.name)

    try:
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(temp_video_path), fourcc, 10.0, (120, 120))
        for _ in range(15):
            frame = np.zeros((120, 120, 3), dtype=np.uint8)
            frame[:] = (0, 255, 0)
            out.write(frame)
        out.release()

        v_meta = validate_video_file(temp_video_path)
        assert v_meta["frame_count"] >= 1
        assert v_meta["width"] == 120
        assert v_meta["height"] == 120
    finally:
        if temp_video_path.exists():
            temp_video_path.unlink()


def test_video_no_readable_frames_or_invalid():
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
        tf.write(b"CORRUPTED_VIDEO_HEADER_DATA_12345")
        bad_video_path = Path(tf.name)

    try:
        with pytest.raises(FileValidationError) as exc:
            validate_video_file(bad_video_path)
        assert "video" in str(exc.value).lower()
    finally:
        if bad_video_path.exists():
            bad_video_path.unlink()


def test_safe_filenames_and_paths():
    unsafe_name = "../../etc/passwd"
    clean = sanitize_filename(unsafe_name)
    assert ".." not in clean
    assert "/" not in clean
    assert "\\" not in clean

    unique = generate_unique_filename("worker photo #1.jpg")
    assert "worker_photo__1" in unique
    assert unique.endswith(".jpg")

    base = Path("/workspace/uploads")
    safe_target = Path("/workspace/uploads/file.jpg")
    malicious_target = Path("/workspace/uploads/../../secret.key")
    assert is_safe_path(base, safe_target) is True
    assert is_safe_path(base, malicious_target) is False
