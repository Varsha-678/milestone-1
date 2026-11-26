from typing import Optional, List, Dict, Any
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.violation_schemas import ReportGenerateRequest
from backend.app.services.violation_service import get_violations, get_dashboard_stats
from backend.app.services.report_export_service import generate_pdf_report, generate_excel_report
from backend.app.config import REPORT_DIR

router = APIRouter(prefix="/reports", tags=["Safety Reports"])

REPORT_TYPE_METADATA = {
    "complete": {
        "label": "Complete Safety Performance Report",
        "description": "Comprehensive workplace inspection audit, all PPE categories, department breakdown, and compliance analytics."
    },
    "ppe_violation": {
        "label": "PPE Violation Incident Report",
        "description": "Focused report highlighting helmet, safety vest, and mask non-compliance incidents and active citations."
    },
    "department": {
        "label": "Department-wise Safety Audit",
        "description": "Granular safety performance and violation frequency segmented by operational department and facility zones."
    },
    "compliance": {
        "label": "Safety Compliance & Governance Overview",
        "description": "Executive summary of safety percentage benchmarks, resolution rates, and statutory inspection logs."
    },
    "date_wise": {
        "label": "Date-wise Incident Log",
        "description": "Chronological timeline of detected violations and resolution milestones across the selected period."
    }
}


@router.get("/types")
def get_report_types():
    """Returns available Milestone 4 report types and their definitions."""
    return [
        {"id": k, "label": v["label"], "description": v["description"]}
        for k, v in REPORT_TYPE_METADATA.items()
    ]


@router.post("/preview")
def generate_report_preview(
    payload: ReportGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Validates report parameters, filters violation items, and returns a live preview
    summary with KPI numbers and matching violation records prior to export.
    """
    meta = REPORT_TYPE_METADATA.get(payload.report_type, REPORT_TYPE_METADATA["complete"])
    
    # Query matching violations
    query_res = get_violations(
        db=db,
        violation_type=payload.violation_category,
        department=payload.department,
        location=payload.location,
        status=payload.status,
        date_from=payload.date_from,
        date_to=payload.date_to,
        page=1,
        page_size=100
    )

    stats = get_dashboard_stats(db)

    # Compute preview metrics tailored to filtered subset
    items = query_res["items"]
    filtered_violations_count = len(items)
    resolved_in_filter = sum(1 for v in items if v.get("status") == "Resolved")
    pending_in_filter = sum(1 for v in items if v.get("status") == "Pending")

    preview_stats = {
        "total_inspections": stats["total_inspections"],
        "total_violations": filtered_violations_count,
        "resolved_violations": resolved_in_filter,
        "pending_violations": pending_in_filter,
        "compliance_percentage": stats["compliance_percentage"],
        "category_counts": stats["category_counts"]
    }

    return {
        "report_type": payload.report_type,
        "report_type_label": meta["label"],
        "title": payload.title or meta["label"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_matching_records": filtered_violations_count,
        "filters_applied": {
            "department": payload.department or "All Departments",
            "location": payload.location or "All Locations",
            "category": payload.violation_category or "All Categories",
            "status": payload.status or "All Statuses",
            "date_range": f"{payload.date_from or 'Earliest'} to {payload.date_to or 'Latest'}"
        },
        "stats": preview_stats,
        "preview_items": items[:15]
    }


@router.get("/export/pdf")
def export_pdf(
    report_type: str = Query("complete"),
    title: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Generates and returns an official SafeSight AI PDF report file.
    """
    meta = REPORT_TYPE_METADATA.get(report_type, REPORT_TYPE_METADATA["complete"])
    query_res = get_violations(
        db=db,
        violation_type=category,
        department=department,
        location=location,
        status=status,
        date_from=date_from,
        date_to=date_to,
        page=1,
        page_size=250
    )
    items = query_res["items"]
    stats = get_dashboard_stats(db)

    report_data = {
        "title": title or meta["label"],
        "report_type_label": meta["label"],
        "stats": stats,
        "filters": {
            "department": department,
            "category": category,
            "status": status
        }
    }

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"SafeSight_Report_{report_type}_{timestamp}.pdf"
    pdf_path = generate_pdf_report(report_data, items, filename)

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=filename
    )


@router.get("/export/excel")
def export_excel(
    report_type: str = Query("complete"),
    title: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Generates and returns a multi-sheet formatted Excel (.xlsx) report file.
    """
    meta = REPORT_TYPE_METADATA.get(report_type, REPORT_TYPE_METADATA["complete"])
    query_res = get_violations(
        db=db,
        violation_type=category,
        department=department,
        location=location,
        status=status,
        date_from=date_from,
        date_to=date_to,
        page=1,
        page_size=500
    )
    items = query_res["items"]
    stats = get_dashboard_stats(db)

    report_data = {
        "title": title or meta["label"],
        "report_type_label": meta["label"],
        "stats": stats,
        "filters": {
            "department": department,
            "category": category,
            "status": status
        }
    }

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"SafeSight_Report_{report_type}_{timestamp}.xlsx"
    excel_path = generate_excel_report(report_data, items, filename)

    return FileResponse(
        path=str(excel_path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=filename
    )
