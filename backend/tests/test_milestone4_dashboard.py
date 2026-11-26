import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_violation_stats_kpis():
    """
    Tests Milestone 4 KPI Cards & Analytics:
    - Total Inspections (Image & Video)
    - Total Violations
    - Resolved Violations
    - Compliance Percentage
    - Category & Severity Breakdown
    - Timeline Trend Data
    """
    response = client.get("/api/violations/stats")
    assert response.status_code == 200
    data = response.json()

    # KPI 1: Inspections
    assert "total_inspections" in data
    assert data["total_inspections"] >= 0
    assert "image_inspections" in data
    assert "video_inspections" in data

    # KPI 2: Violations
    assert "total_violations" in data
    assert data["total_violations"] >= 0
    assert "category_counts" in data
    assert "Missing Helmet" in data["category_counts"]
    assert "Missing Safety Vest" in data["category_counts"]
    assert "Missing Mask" in data["category_counts"]

    # KPI 3: Resolved Violations
    assert "resolved_violations" in data
    assert "reviewed_violations" in data
    assert "pending_violations" in data

    # KPI 4: Compliance Percentage
    assert "compliance_percentage" in data
    assert 0 <= data["compliance_percentage"] <= 100

    # Safety Analytics Charts Data
    assert "trend_data" in data
    assert isinstance(data["trend_data"], list)
    assert len(data["trend_data"]) > 0

    assert "department_counts" in data
    assert "severity_counts" in data


def test_violation_monitoring_list_and_filters():
    """
    Tests Milestone 4 Violation Monitoring Table:
    - Pagination
    - Filtering by severity and status
    - Multi-column search
    """
    # Fetch all violations
    response = client.get("/api/violations?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert len(data["items"]) > 0

    first_item = data["items"][0]
    assert "violation_code" in first_item
    assert "violation_type" in first_item
    assert "department" in first_item
    assert "location" in first_item
    assert "severity" in first_item
    assert "status" in first_item

    # Test filtering by status
    pending_resp = client.get("/api/violations?status=Pending")
    assert pending_resp.status_code == 200
    for v in pending_resp.json()["items"]:
        assert v["status"] == "Pending"

    # Test search
    search_resp = client.get("/api/violations?search=Helmet")
    assert search_resp.status_code == 200
    for v in search_resp.json()["items"]:
        assert "helmet" in v["violation_type"].lower() or "helmet" in v["violation_code"].lower()


def test_violation_status_update_with_audit_trail():
    """
    Tests Milestone 4 Violation Status Workflow & Persistent Audit Trail:
    - Update to 'Reviewed'
    - Update to 'Resolved'
    - Verify audit log chronological records
    """
    list_resp = client.get("/api/violations?status=Pending")
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) > 0
    target_id = items[0]["id"]

    # 1. Transition Pending -> Reviewed
    patch_resp1 = client.patch(
        f"/api/violations/{target_id}/status",
        json={
            "status": "Reviewed",
            "updated_by": "Safety Officer Jordan",
            "notes": "Reviewed CCTV keyframe; supervisor notified."
        }
    )
    assert patch_resp1.status_code == 200
    updated_data1 = patch_resp1.json()
    assert updated_data1["status"] == "Reviewed"
    assert len(updated_data1["audit_trail"]) >= 2
    latest_audit = updated_data1["audit_trail"][0]
    assert latest_audit["new_status"] == "Reviewed"
    assert latest_audit["updated_by"] == "Safety Officer Jordan"

    # 2. Transition Reviewed -> Resolved
    patch_resp2 = client.patch(
        f"/api/violations/{target_id}/status",
        json={
            "status": "Resolved",
            "updated_by": "Lead Auditor Elena",
            "notes": "Worker equipped with high-visibility vest; site verified."
        }
    )
    assert patch_resp2.status_code == 200
    updated_data2 = patch_resp2.json()
    assert updated_data2["status"] == "Resolved"
    assert updated_data2["resolved_by"] == "Lead Auditor Elena"
    assert updated_data2["resolved_at"] is not None


def test_report_types_endpoint():
    """Tests that all 5 required Milestone 4 report types are available."""
    response = client.get("/api/reports/types")
    assert response.status_code == 200
    types = response.json()
    type_ids = [t["id"] for t in types]
    assert "complete" in type_ids
    assert "ppe_violation" in type_ids
    assert "department" in type_ids
    assert "compliance" in type_ids
    assert "date_wise" in type_ids


def test_report_preview_generation():
    """Tests the report generation workflow: validate filters and render live preview."""
    payload = {
        "report_type": "complete",
        "title": "Quarterly HSE Executive Report",
        "department": "High-Altitude Rigging",
        "format": "pdf"
    }
    response = client.post("/api/reports/preview", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["report_type"] == "complete"
    assert "Quarterly HSE Executive Report" in data["title"]
    assert "stats" in data
    assert "preview_items" in data


def test_pdf_report_export():
    """Tests official PDF generation and download via ReportLab."""
    response = client.get("/api/reports/export/pdf?report_type=complete")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000
    # PDF files start with %PDF
    assert response.content[:4] == b"%PDF"


def test_excel_report_export():
    """Tests formatted Excel (.xlsx) report export via openpyxl."""
    response = client.get("/api/reports/export/excel?report_type=complete")
    assert response.status_code == 200
    assert "spreadsheetml" in response.headers["content-type"]
    assert len(response.content) > 1000
    # XLSX files are zip archives starting with PK
    assert response.content[:2] == b"PK"
