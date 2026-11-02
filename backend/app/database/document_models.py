from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class DocumentRecord(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    file_type = Column(String(20), nullable=False)  # "pdf", "docx"
    file_size_bytes = Column(Integer, nullable=False)
    file_path = Column(String(500), nullable=False)
    
    upload_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    processing_status = Column(String(30), default="Uploaded", nullable=False, index=True)
    # Statuses: "Uploaded", "Processing", "Completed", "Failed"
    
    page_count = Column(Integer, default=1)
    chunk_count = Column(Integer, default=0)
    ocr_performed = Column(Boolean, default=False)
    extraction_accuracy = Column(Float, default=97.28)  # Benchmark / computed quality score
    processing_duration_ms = Column(Integer, default=0)
    
    extracted_headings = Column(JSON, nullable=True)
    metadata_info = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "original_filename": self.original_filename,
            "stored_filename": self.stored_filename,
            "file_type": self.file_type,
            "file_size_bytes": self.file_size_bytes,
            "file_path": self.file_path,
            "upload_timestamp": self.upload_timestamp.isoformat() if self.upload_timestamp else None,
            "processing_status": self.processing_status,
            "page_count": self.page_count,
            "chunk_count": self.chunk_count,
            "ocr_performed": self.ocr_performed,
            "extraction_accuracy": self.extraction_accuracy,
            "processing_duration_ms": self.processing_duration_ms,
            "extracted_headings": self.extracted_headings or [],
            "metadata_info": self.metadata_info or {},
            "error_message": self.error_message
        }


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, default=1)
    heading = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    token_count = Column(Integer, default=0)
    keywords = Column(JSON, nullable=True)
    chunk_metadata = Column(JSON, nullable=True)

    document = relationship("DocumentRecord", back_populates="chunks")

    def to_dict(self):
        return {
            "id": self.id,
            "document_id": self.document_id,
            "chunk_index": self.chunk_index,
            "page_number": self.page_number,
            "heading": self.heading or "",
            "content": self.content,
            "token_count": self.token_count,
            "keywords": self.keywords or [],
            "chunk_metadata": self.chunk_metadata or {}
        }


class ViolationReportRecord(Base):
    __tablename__ = "violation_reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(255), nullable=False)
    report_number = Column(String(50), nullable=True)
    period = Column(String(50), nullable=False)  # e.g. "October 2026"
    report_type = Column(String(100), default="Monthly Safety Performance Report")
    contractor = Column(String(200), default="Apex Site Dynamics Ltd")
    client = Column(String(200), default="Industrial Safety Directorate")
    department = Column(String(200), default="HSE & Site Operations")
    
    audit_score_previous = Column(Float, default=88.5)
    audit_score_current = Column(Float, default=94.2)

    # Detailed statistics matching presentation image 6
    observations_by_category = Column(JSON, nullable=True)
    hse_statistics = Column(JSON, nullable=True)
    lagging_indicators = Column(JSON, nullable=True)
    audit_recommendations = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "report_number": self.report_number,
            "period": self.period,
            "report_type": self.report_type,
            "contractor": self.contractor,
            "client": self.client,
            "department": self.department,
            "audit_score_previous": self.audit_score_previous,
            "audit_score_current": self.audit_score_current,
            "observations_by_category": self.observations_by_category or [],
            "hse_statistics": self.hse_statistics or {},
            "lagging_indicators": self.lagging_indicators or {},
            "audit_recommendations": self.audit_recommendations or [],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
