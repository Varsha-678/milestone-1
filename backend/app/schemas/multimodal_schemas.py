from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class AgentLogItem(BaseModel):
    agent_name: str
    step_order: int
    status: str
    duration_ms: int
    summary: str
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None


class CitationItem(BaseModel):
    document_name: str
    page_number: int
    heading: str
    excerpt: str
    similarity_score: float
    file_path: Optional[str] = None


class RecommendationItem(BaseModel):
    action: str
    priority: str = "High"  # High, Medium, Low
    category: str
    details: Optional[str] = None


class MultimodalAnalysisResponse(BaseModel):
    session_id: str
    title: str
    query_type: str  # "multimodal", "visual_only", "document_only"
    user_query: str
    media_filename: Optional[str] = None
    media_path: Optional[str] = None
    media_type: Optional[str] = None
    job_id: Optional[str] = None
    
    visual_summary: Dict[str, Any] = Field(default_factory=dict)
    retrieved_chunks: List[Dict[str, Any]] = Field(default_factory=list)
    fused_context: str = ""
    
    final_response: str
    safety_recommendations: List[Dict[str, Any]] = Field(default_factory=list)
    citations: List[Dict[str, Any]] = Field(default_factory=list)
    validation_result: Dict[str, Any] = Field(default_factory=dict)
    
    agent_logs: List[Dict[str, Any]] = Field(default_factory=list)
    workflow_status: str = "Completed"
    total_execution_ms: int = 0
    created_at: Optional[str] = None


class ChatQueryRequest(BaseModel):
    query: str
    session_id: Optional[str] = None
    job_id: Optional[str] = None
    media_path: Optional[str] = None
    force_type: Optional[str] = None  # None, "multimodal", "visual_only", "document_only"


class MultimodalStats(BaseModel):
    total_sessions: int
    multimodal_queries: int
    visual_queries: int
    document_queries: int
    avg_latency_ms: float
    validation_pass_rate: float
    active_agent_count: int = 6
