from typing import List, Optional, Any, Dict
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    backend_version: str
    model_loaded: bool
    model_name: Optional[str]
    model_path: str
    supported_classes: List[str]
    message: str


class DetectionItem(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    box: List[float]  # [x1, y1, x2, y2]
    is_ppe: bool
    is_violation: bool
    color: str


class ComplianceCalculation(BaseModel):
    policy_required_items: List[str]
    detected_required_items: List[str]
    missing_items: List[str]
    direct_violations: List[str]
    formula: str
    numerator: int
    denominator: int
    status_label: str  # "Fully Compliant", "Safety Violations Detected", "Insufficient Data"
    compliance_percentage: Optional[float]


class FrameResult(BaseModel):
    frame_index: int
    timestamp_sec: float
    detections: List[DetectionItem]
    detection_count: int
    violation_count: int
    compliance: ComplianceCalculation
    annotated_frame_url: str


class JobSummary(BaseModel):
    id: str
    original_filename: str
    media_type: str
    file_size_bytes: int
    upload_timestamp: Optional[str]
    processing_status: str
    processing_completed_at: Optional[str]
    detection_count: int
    violation_count: int
    compliance_score: Optional[float]
    result_media_path: Optional[str]
    error_message: Optional[str]


class JobDetail(BaseModel):
    id: str
    original_filename: str
    stored_filename: str
    media_type: str
    file_size_bytes: int
    upload_timestamp: Optional[str]
    processing_status: str
    processing_started_at: Optional[str]
    processing_completed_at: Optional[str]
    model_identifier: Optional[str]
    model_supported_classes: List[str]
    detection_count: int
    violation_count: int
    compliance_score: Optional[float]
    compliance_details: Optional[Dict[str, Any]]
    detection_results: Optional[Any]
    video_metadata: Optional[Dict[str, Any]]
    result_media_path: Optional[str]
    report_path: Optional[str]
    error_message: Optional[str]
