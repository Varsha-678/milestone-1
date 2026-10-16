from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON
from backend.app.database.session import Base


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    media_type = Column(String(20), nullable=False)  # "image" or "video"
    file_size_bytes = Column(Integer, nullable=False)
    
    upload_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    processing_status = Column(String(30), default="Uploaded", nullable=False, index=True)
    # Statuses: "Uploaded", "Processing", "Completed", "Failed"
    
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)

    model_identifier = Column(String(100), nullable=True)
    model_supported_classes = Column(JSON, nullable=True)

    detection_count = Column(Integer, default=0)
    violation_count = Column(Integer, default=0)
    compliance_score = Column(Float, nullable=True)  # Percentage (0 - 100), or None if insufficient data
    
    # Detailed metadata & structured results
    compliance_details = Column(JSON, nullable=True)
    detection_results = Column(JSON, nullable=True)
    video_metadata = Column(JSON, nullable=True)

    # Relative paths for accessible media & reports
    result_media_path = Column(String(500), nullable=True)
    report_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "original_filename": self.original_filename,
            "stored_filename": self.stored_filename,
            "media_type": self.media_type,
            "file_size_bytes": self.file_size_bytes,
            "upload_timestamp": self.upload_timestamp.isoformat() if self.upload_timestamp else None,
            "processing_status": self.processing_status,
            "processing_started_at": self.processing_started_at.isoformat() if self.processing_started_at else None,
            "processing_completed_at": self.processing_completed_at.isoformat() if self.processing_completed_at else None,
            "model_identifier": self.model_identifier,
            "model_supported_classes": self.model_supported_classes or [],
            "detection_count": self.detection_count,
            "violation_count": self.violation_count,
            "compliance_score": self.compliance_score,
            "compliance_details": self.compliance_details,
            "detection_results": self.detection_results,
            "video_metadata": self.video_metadata,
            "result_media_path": self.result_media_path,
            "report_path": self.report_path,
            "error_message": self.error_message,
        }
