from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class ViolationRecord(Base):
    """
    Milestone 4 Violation Monitoring Record.
    Stores structured information on detected safety violations across
    image and video inspections, tracking workflow status (Pending -> Reviewed -> Resolved),
    severity, department, location, evidence, and audit logs.
    """
    __tablename__ = "violations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    violation_code = Column(String(30), unique=True, index=True, nullable=False)
    job_id = Column(String(36), nullable=True, index=True)  # Reference to Milestone 1 AnalysisJob if applicable
    
    violation_type = Column(String(100), nullable=False)  # e.g. "Missing Helmet", "Missing Safety Vest", "Missing Mask"
    raw_class = Column(String(50), nullable=True)  # e.g. "NO-Hardhat", "NO-Safety Vest", "NO-Mask"
    
    department = Column(String(100), nullable=False, default="Fabrication & Assembly")
    location = Column(String(100), nullable=False, default="Zone A - Main Yard")
    source_type = Column(String(20), nullable=False, default="image")  # "image" or "video"
    source_filename = Column(String(255), nullable=True)
    
    severity = Column(String(20), nullable=False, default="High")  # "Critical", "High", "Medium", "Low"
    status = Column(String(20), nullable=False, default="Pending", index=True)  # "Pending", "Reviewed", "Resolved"
    
    confidence = Column(Float, default=0.85)
    bounding_box = Column(JSON, nullable=True)  # [x1, y1, x2, y2]
    evidence_media_path = Column(String(500), nullable=True)
    frame_timestamp_sec = Column(Float, nullable=True)
    
    detected_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    supervisor = Column(String(100), default="HSE Officer M. Vance")
    risk_assessment = Column(Text, nullable=True)
    corrective_action = Column(Text, nullable=True)

    # Persistent audit trail
    audit_logs = relationship(
        "ViolationAuditRecord", 
        back_populates="violation", 
        cascade="all, delete-orphan",
        order_by="desc(ViolationAuditRecord.created_at)"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "violation_code": self.violation_code,
            "job_id": self.job_id,
            "violation_type": self.violation_type,
            "raw_class": self.raw_class,
            "department": self.department,
            "location": self.location,
            "source_type": self.source_type,
            "source_filename": self.source_filename or "inspection_capture.jpg",
            "severity": self.severity,
            "status": self.status,
            "confidence": round(float(self.confidence or 0.0), 3),
            "bounding_box": self.bounding_box or [],
            "evidence_media_path": self.evidence_media_path,
            "frame_timestamp_sec": self.frame_timestamp_sec,
            "detected_at": self.detected_at.isoformat() if self.detected_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolved_by": self.resolved_by,
            "resolution_notes": self.resolution_notes,
            "supervisor": self.supervisor,
            "risk_assessment": self.risk_assessment,
            "corrective_action": self.corrective_action,
            "audit_trail": [log.to_dict() for log in (self.audit_logs or [])]
        }


class ViolationAuditRecord(Base):
    """
    Persistent audit trail logging every status change and review action
    on a violation record, satisfying Milestone 4 compliance governance.
    """
    __tablename__ = "violation_audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    violation_id = Column(String(36), ForeignKey("violations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    previous_status = Column(String(20), nullable=False)
    new_status = Column(String(20), nullable=False)
    updated_by = Column(String(100), default="HSE Safety Admin")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    violation = relationship("ViolationRecord", back_populates="audit_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "violation_id": self.violation_id,
            "previous_status": self.previous_status,
            "new_status": self.new_status,
            "updated_by": self.updated_by,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
