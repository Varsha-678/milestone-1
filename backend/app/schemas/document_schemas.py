from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DocumentChunkSchema(BaseModel):
    id: str
    document_id: str
    chunk_index: int
    page_number: int
    heading: str
    content: str
    token_count: int
    keywords: List[str] = []
    chunk_metadata: Optional[Dict[str, Any]] = None


class DocumentSummary(BaseModel):
    id: str
    original_filename: str
    stored_filename: str
    file_type: str
    file_size_bytes: int
    upload_timestamp: Optional[str] = None
    processing_status: str
    page_count: int
    chunk_count: int
    ocr_performed: bool
    extraction_accuracy: float
    processing_duration_ms: int
    extracted_headings: List[str] = []
    metadata_info: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class DocumentDetail(DocumentSummary):
    chunks: List[DocumentChunkSchema] = []


class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    size_bytes: int
    processing_status: str
    message: str


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Natural language or keyword search query")
    document_id: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=50)


class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    document_name: str
    file_type: str
    page_number: int
    heading: str
    content: str
    highlighted_snippet: str
    similarity_score: float
    token_count: int
    keywords: List[str] = []
    file_path: str


class SearchResponse(BaseModel):
    query: str
    total_matches: int
    results: List[SearchResultItem]


class AuditRecommendationItem(BaseModel):
    sr_no: int
    audit_date: str
    recommendation: str
    target_date: str
    status: str
    action_taken: str


class ObservationCategoryItem(BaseModel):
    category: str
    previous_month: int
    this_month: int
    trend: str


class ViolationReportSchema(BaseModel):
    id: str
    title: str
    report_number: Optional[str] = None
    period: str
    report_type: str
    contractor: str
    client: str
    department: str
    audit_score_previous: float
    audit_score_current: float
    observations_by_category: List[ObservationCategoryItem] = []
    hse_statistics: Dict[str, Any] = {}
    lagging_indicators: Dict[str, Any] = {}
    audit_recommendations: List[AuditRecommendationItem] = []
    created_at: Optional[str] = None


class AddRecommendationRequest(BaseModel):
    recommendation: str
    target_date: str
    status: str = "In Progress"
    action_taken: str = ""


class KnowledgeBaseStats(BaseModel):
    total_documents: int
    total_chunks: int
    ocr_processed_docs: int
    total_queries_run: int
    benchmark_extraction_accuracy: float
    storage_size_bytes: int
    supported_formats: List[str]
    system_status: str
