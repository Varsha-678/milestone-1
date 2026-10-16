import os
from pathlib import Path
from typing import List, Set

# Base directory is the repository root
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Application Directories
UPLOAD_DIR = BASE_DIR / "uploads"
RESULT_DIR = BASE_DIR / "results"
REPORT_DIR = BASE_DIR / "reports"
MODELS_DIR = BASE_DIR / "models"

for folder in [UPLOAD_DIR, RESULT_DIR, REPORT_DIR, MODELS_DIR]:
    folder.mkdir(parents=True, exist_ok=True)

# Model Settings
DEFAULT_MODEL_PATH = str(MODELS_DIR / "ppe_best.pt")
PPE_MODEL_PATH = os.getenv("PPE_MODEL_PATH", DEFAULT_MODEL_PATH)
DEFAULT_CONF_THRESHOLD = float(os.getenv("DEFAULT_CONF_THRESHOLD", "0.25"))

# Upload Constraints
MAX_UPLOAD_SIZE_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024

ALLOWED_IMAGE_EXTENSIONS: Set[str] = {"jpg", "jpeg", "png", "webp"}
ALLOWED_VIDEO_EXTENSIONS: Set[str] = {"mp4", "avi", "mov"}

ALLOWED_IMAGE_MIME_TYPES: Set[str] = {
    "image/jpeg",
    "image/png",
    "image/webp"
}

ALLOWED_VIDEO_MIME_TYPES: Set[str] = {
    "video/mp4",
    "video/x-msvideo",
    "video/quicktime",
    "application/octet-stream"  # sometimes returned for raw video streams
}

# Video Sampling
VIDEO_SAMPLE_INTERVAL_SECONDS = float(os.getenv("VIDEO_SAMPLE_INTERVAL_SECONDS", "1.0"))
MAX_VIDEO_FRAMES_TO_ANALYZE = int(os.getenv("MAX_VIDEO_FRAMES_TO_ANALYZE", "60"))

# Database
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/safesight.db")

# CORS Origins
CORS_ORIGINS: List[str] = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]
