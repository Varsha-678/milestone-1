import io
from pathlib import Path
from typing import Tuple, Dict, Any
from PIL import Image, UnidentifiedImageError
import cv2

from backend.app.config import (
    ALLOWED_IMAGE_EXTENSIONS,
    ALLOWED_VIDEO_EXTENSIONS,
    MAX_UPLOAD_SIZE_BYTES,
    MAX_UPLOAD_SIZE_MB,
)


class FileValidationError(Exception):
    """Custom exception raised when server-side file validation fails."""
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def validate_file_metadata(filename: str, content_length: int, content_type: str = "") -> Tuple[str, str]:
    """
    Validates file extension, length, and content type before deep decoding.
    Returns (media_type, normalized_extension).
    """
    if not filename:
        raise FileValidationError("No filename provided in upload request.", 400)

    if content_length <= 0:
        raise FileValidationError("Uploaded file is empty (0 bytes).", 400)

    if content_length > MAX_UPLOAD_SIZE_BYTES:
        raise FileValidationError(
            f"File size exceeds the configured upload limit of {MAX_UPLOAD_SIZE_MB} MB.",
            413
        )

    ext = Path(filename).suffix.lstrip(".").lower()
    if not ext:
        raise FileValidationError(
            "Unsupported file format. Please upload JPG, PNG, WEBP, MP4, AVI, or MOV.",
            400
        )

    if ext in ALLOWED_IMAGE_EXTENSIONS:
        return "image", ext
    elif ext in ALLOWED_VIDEO_EXTENSIONS:
        return "video", ext
    else:
        raise FileValidationError(
            f"Unsupported file format '{ext.upper()}'. Please upload JPG, PNG, WEBP, MP4, AVI, or MOV.",
            400
        )


def validate_image_content(content_bytes: bytes) -> Dict[str, Any]:
    """
    Deep validation of image content using Pillow.
    Verifies magic bytes, headers, and full decompression.
    """
    try:
        # Step 1: Verify header / structure
        image_stream = io.BytesIO(content_bytes)
        with Image.open(image_stream) as img:
            format_name = img.format.lower() if img.format else ""
            if format_name not in ["jpeg", "png", "webp"]:
                raise FileValidationError(
                    "Unsupported file format. Please upload JPG, PNG, WEBP, MP4, AVI, or MOV.",
                    400
                )
            img.verify()

        # Step 2: Re-open and decode full pixel data to catch truncation or corruption
        image_stream.seek(0)
        with Image.open(image_stream) as img:
            img.load()
            width, height = img.size
            if width <= 0 or height <= 0:
                raise FileValidationError("The uploaded image has invalid zero dimensions.", 400)

            return {
                "format": format_name,
                "width": width,
                "height": height,
                "mode": img.mode
            }

    except UnidentifiedImageError:
        raise FileValidationError("The uploaded image is corrupted or cannot be decoded.", 400)
    except FileValidationError:
        raise
    except Exception as exc:
        raise FileValidationError("The uploaded image is corrupted or cannot be decoded.", 400) from exc


def validate_video_file(file_path: Path) -> Dict[str, Any]:
    """
    Deep validation of saved video file using OpenCV.
    Confirms video can be opened, codec is supported, and frames can be read.
    """
    if not file_path.exists() or file_path.stat().st_size == 0:
        raise FileValidationError("The video file is missing or empty.", 400)

    cap = cv2.VideoCapture(str(file_path))
    try:
        if not cap.isOpened():
            raise FileValidationError("The video could not be opened. Please check the file or codec.", 400)

        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Check if at least the first frame is readable
        ret, frame = cap.read()
        if not ret or frame is None or frame.size == 0:
            raise FileValidationError("The video has no readable frames or cannot be decoded.", 400)

        duration = (frame_count / fps) if fps > 0 else 0.0

        return {
            "width": width,
            "height": height,
            "fps": fps if fps > 0 else 24.0,
            "frame_count": max(frame_count, 1),
            "duration_seconds": round(duration, 2)
        }
    finally:
        cap.release()
