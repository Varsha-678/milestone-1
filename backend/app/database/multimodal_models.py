from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.session import Base


class MultimodalSessionRecord(Base):
    """
    Persistent record of a Milestone 3 Multimodal RAG session.
    Stores the user query, media reference, visual detection summary,
    retrieved document citations, fused context, final response, and validation.
    """
    __tablename__ = "multimodal_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String(255), nullable=False)
    query_type = Column(String(30), nullable=False, default="multimodal")  # "multimodal", "visual_only", "document_only"
    user_query = Column(Text, nullable=False)
    
    media_filename = Column(String(255), nullable=True)
    media_path = Column(String(500), nullable=True)
    media_type = Column(String(20), nullable=True)  # "image" or "video"
    job_id = Column(String(36), nullable=True, index=True)  # Reference to Milestone 1 job if re-used

    # Structured visual intelligence data
    visual_summary = Column(JSON, nullable=True)
    
    # Retrieved chunks and citations from Milestone 2
    retrieved_chunks = Column(JSON, nullable=True)
    
    # Fused context prepared by Context Fusion Agent
    unified_context = Column(Text, nullable=True)
    
    # Generated response & recommendations
    final_response = Column(Text, nullable=False)
    safety_recommendations = Column(JSON, nullable=True)
    citations = Column(JSON, nullable=True)
    
    # Validation results from Validation Agent
    validation_result = Column(JSON, nullable=True)
    
    # Workflow metadata
    workflow_status = Column(String(30), default="Completed", nullable=False, index=True)
    total_execution_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    agent_logs = relationship("AgentExecutionRecord", back_populates="session", cascade="all, delete-orphan", order_by="AgentExecutionRecord.step_order")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "query_type": self.query_type,
            "user_query": self.user_query,
            "media_filename": self.media_filename,
            "media_path": self.media_path,
            "media_type": self.media_type,
            "job_id": self.job_id,
            "visual_summary": self.visual_summary or {},
            "retrieved_chunks": self.retrieved_chunks or [],
            "unified_context": self.unified_context or "",
            "final_response": self.final_response,
            "safety_recommendations": self.safety_recommendations or [],
            "citations": self.citations or [],
            "validation_result": self.validation_result or {},
            "workflow_status": self.workflow_status,
            "total_execution_ms": self.total_execution_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "agent_logs": [log.to_dict() for log in self.agent_logs] if self.agent_logs else []
        }


class AgentExecutionRecord(Base):
    """
    Detailed audit log of individual LangGraph agent execution stages.
    """
    __tablename__ = "agent_execution_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    session_id = Column(String(36), ForeignKey("multimodal_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    
    agent_name = Column(String(100), nullable=False)
    step_order = Column(Integer, nullable=False)
    status = Column(String(30), nullable=False, default="completed")  # "completed", "skipped", "failed"
    duration_ms = Column(Integer, default=0)
    summary = Column(String(255), nullable=True)
    
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    session = relationship("MultimodalSessionRecord", back_populates="agent_logs")

    def to_dict(self):
        return {
            "id": self.id,
            "session_id": self.session_id,
            "agent_name": self.agent_name,
            "step_order": self.step_order,
            "status": self.status,
            "duration_ms": self.duration_ms,
            "summary": self.summary or "",
            "input_data": self.input_data or {},
            "output_data": self.output_data or {},
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
