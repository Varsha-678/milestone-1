import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.document_service import seed_standard_knowledge_base

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_db_and_docs():
    seed_standard_knowledge_base()


def test_sample_scenarios_endpoint():
    """Verify preloaded Milestone 3 test scenarios."""
    response = client.get("/api/multimodal/sample-scenarios")
    assert response.status_code == 200
    scenarios = response.json()
    assert len(scenarios) >= 4
    assert any("helmet" in s["title"].lower() for s in scenarios)


def test_multimodal_stats_endpoint():
    """Verify live statistics endpoint for M3."""
    response = client.get("/api/multimodal/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_sessions" in data
    assert "active_agent_count" in data
    assert data["active_agent_count"] == 6


def test_document_only_query():
    """
    Test scenario: Document-only question routed through LangGraph.
    Should execute Input Analysis -> Document Retrieval -> Context Fusion -> Response Generation -> Validation.
    """
    payload = {
        "query": "What are the mandatory PPE requirements for Zone A?",
        "force_type": "document_only"
    }
    response = client.post("/api/multimodal/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["query_type"] == "document_only"
    assert len(data["retrieved_chunks"]) > 0
    assert len(data["citations"]) > 0
    assert len(data["agent_logs"]) >= 4
    
    # Check that citation has actual document name and page number
    top_citation = data["citations"][0]
    assert "document_name" in top_citation
    assert "page_number" in top_citation
    assert top_citation["page_number"] > 0
    
    # Check validation passed
    assert data["validation_result"]["passed"] is True


def test_multimodal_violation_with_job_reference():
    """
    Test scenario: Multimodal query referencing existing Milestone 1 scan.
    """
    # 1. Fetch existing Milestone 1 jobs
    jobs_res = client.get("/api/jobs")
    job_id = None
    if jobs_res.status_code == 200 and jobs_res.json():
        job_id = jobs_res.json()[0]["id"]

    payload = {
        "query": "Why was this worker marked as a safety violation and what corrective action is needed?",
        "job_id": job_id
    }
    response = client.post("/api/multimodal/chat", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["final_response"] is not None
    assert len(data["final_response"]) > 50
    assert len(data["safety_recommendations"]) > 0
    assert data["workflow_status"] == "Completed"
    
    # Agent logs check (6 agents executed or conditional paths)
    agent_names = [log["agent_name"] for log in data["agent_logs"]]
    assert "Input Analysis Agent" in agent_names
    assert "Context Fusion Agent" in agent_names
    assert "Response Generation Agent" in agent_names
    assert "Validation Agent" in agent_names


def test_multimodal_upload_image_inference():
    """
    Test scenario: Uploading an image file for live YOLOv8 inference + Policy RAG.
    """
    import numpy as np
    import cv2
    
    # Generate a synthetic test image
    img = np.zeros((400, 400, 3), dtype=np.uint8)
    cv2.putText(img, "TEST SITE", (50, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    _, encoded = cv2.imencode(".jpg", img)
    img_bytes = encoded.tobytes()

    files = {"file": ("test_cctv_frame.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    data = {
        "query": "Which company safety policy applies to missing helmets in industrial areas?",
        "force_type": "multimodal"
    }

    response = client.post("/api/multimodal/analyze", data=data, files=files)
    assert response.status_code == 200
    res_data = response.json()

    assert res_data["session_id"] is not None
    assert res_data["media_filename"] == "test_cctv_frame.jpg"
    assert len(res_data["retrieved_chunks"]) > 0
    assert len(res_data["citations"]) > 0
    assert res_data["validation_result"]["passed"] is True


def test_sessions_list_and_detail():
    """Verify session persistence and retrieval."""
    list_res = client.get("/api/multimodal/sessions")
    assert list_res.status_code == 200
    sessions = list_res.json()
    assert len(sessions) > 0

    session_id = sessions[0]["id"]
    detail_res = client.get(f"/api/multimodal/sessions/{session_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["session_id"] == session_id
    assert "agent_logs" in detail
