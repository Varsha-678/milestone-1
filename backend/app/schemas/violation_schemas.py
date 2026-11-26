from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


class ViolationStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status: Pending, Reviewed, or Resolved")
    updated_by: Optional[str] = Field("HSE Admin", description="User or role executing update")
    notes: Optional[str] = Field(None, description="Audit note explaining the status change")


class ViolationCreate(BaseModel):
    violation_type: str
    raw_class: Optional[str] = None
    department: str = "Fabrication & Assembly"
    location: str = "Zone A - Main Yard"
    source_type: str = "image"
    source_filename: Optional[str] = None
    severity: str = "High"
    confidence: float = 0.85
    bounding_box: Optional[List[float]] = None
    evidence_media_path: Optional[str] = None
    frame_timestamp_sec: Optional[float] = None
    notes: Optional[str] = None


class AuditLogItem(BaseModel):
    id: str
    violation_id: str
    previous_status: str
    new_status: str
    updated_by: str
    notes: Optional[str] = None
    created_at: Optional[str] = None


class ViolationItem(BaseModel):
    id: str
    violation_code: str
    job_id: Optional[str] = None
    violation_type: str
    raw_class: Optional[str] = None
    department: str
    location: str
    source_type: str
    source_filename: str
    severity: str
    status: str
    confidence: float
    bounding_box: Optional[List[float]] = None
    evidence_media_path: Optional[str] = None
    frame_timestamp_sec: Optional[float] = None
    detected_at: Optional[str] = None
    resolved_at: Optional[str] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None
    supervisor: Optional[str] = None
    risk_assessment: Optional[str] = None
    corrective_action: Optional[str] = None
    audit_trail: List[AuditLogItem] = []


class ViolationListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    items: List[ViolationItem]


class ViolationStatsResponse(BaseModel):
    total_inspections: int
    image_inspections: int
    video_inspections: int
    total_violations: int
    resolved_violations: int
    reviewed_violations: int
    pending_violations: int
    compliance_percentage: float
    kpi_deltas: Dict[str, Any]
    category_counts: Dict[str, int]
    severity_counts: Dict[str, int]
    department_counts: Dict[str, int]
    trend_data: List[Dict[str, Any]]
    recent_violations: List[Dict[str, Any]]


class ReportGenerateRequest(BaseModel):
    report_type: str = Field("complete", description="complete, ppe_violation, department, compliance, date_wise")
    title: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    violation_category: Optional[str] = None
    status: Optional[str] = None
    format: Optional[str] = Field("pdf", description="pdf or excel")
