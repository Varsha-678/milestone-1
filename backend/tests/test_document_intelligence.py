import os
import io
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_document_stats_endpoint():
    response = client.get("/api/documents/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_documents"] >= 2
    assert data["total_chunks"] >= 10
    assert data["benchmark_extraction_accuracy"] == 97.28
    assert "PDF" in data["supported_formats"]


def test_document_list_and_seed():
    response = client.get("/api/documents")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) >= 2
    filenames = [d["original_filename"] for d in docs]
    assert "Safety_Manual_v2.pdf" in filenames
    assert "Incident_Report_Q3.docx" in filenames


def test_document_detail_and_chunks():
    response = client.get("/api/documents")
    docs = response.json()
    doc_id = docs[0]["id"]

    detail_res = client.get(f"/api/documents/{doc_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "chunks" in detail
    assert len(detail["chunks"]) > 0
    assert "page_number" in detail["chunks"][0]
    assert "content" in detail["chunks"][0]


def test_semantic_search_ppe_zone_a():
    payload = {"query": "PPE Zone A", "limit": 5}
    response = client.post("/api/documents/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_matches"] > 0
    top = data["results"][0]
    assert "document_name" in top
    assert "page_number" in top
    assert "similarity_score" in top
    assert top["similarity_score"] > 20.0
    # Verifies that Zone A mentions exist in top result
    assert "Zone A" in top["content"] or "PPE" in top["content"]


def test_semantic_search_helmet_rules():
    payload = {"query": "Hardhat chin strap inspection", "limit": 5}
    response = client.post("/api/documents/search", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_matches"] > 0


def test_upload_unsupported_format():
    files = {"file": ("malicious.exe", b"MZ\x90\x00BinaryContent", "application/octet-stream")}
    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 415


def test_upload_empty_document():
    files = {"file": ("empty.pdf", b"", "application/pdf")}
    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 400


def test_upload_corrupted_pdf_header():
    files = {"file": ("broken.pdf", b"NOT_A_PDF_HEADER", "application/pdf")}
    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 400


def test_violation_reports_endpoint():
    response = client.get("/api/documents/reports/violations")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    report = data[0]
    assert "observations_by_category" in report
    assert "hse_statistics" in report
    assert "audit_recommendations" in report
    assert len(report["audit_recommendations"]) >= 4


def test_add_safety_recommendation():
    payload = {
        "recommendation": "Install supplementary perimeter warning sensors around Bay 7",
        "target_date": "2026-11-20",
        "status": "In Progress",
        "action_taken": "Purchase requisition approved by site engineer."
    }
    response = client.post("/api/documents/reports/violations/recommendations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["recommendation"]["recommendation"] == payload["recommendation"]
