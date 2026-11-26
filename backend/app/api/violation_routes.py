from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.database.session import get_db
from backend.app.schemas.violation_schemas import (
    ViolationStatusUpdate,
    ViolationListResponse,
    ViolationItem,
    ViolationStatsResponse
)
from backend.app.services.violation_service import (
    get_violations,
    get_violation_detail,
    update_violation_status,
    get_dashboard_stats,
    sync_violations_from_jobs,
    seed_default_violations_if_empty
)

router = APIRouter(prefix="/violations", tags=["Violation Monitoring"])


@router.get("/stats", response_model=ViolationStatsResponse)
def get_violation_stats(db: Session = Depends(get_db)):
    """
    Returns aggregated KPI metrics, PPE category breakdown, compliance gauge,
    and historical violation trends for Milestone 4 Dashboard.
    """
    stats = get_dashboard_stats(db)
    return stats


@router.get("", response_model=ViolationListResponse)
def list_violations(
    search: Optional[str] = Query(None, description="Search by ID, type, dept, loc, or supervisor"),
    violation_type: Optional[str] = Query(None, description="Filter by violation type"),
    department: Optional[str] = Query(None, description="Filter by workplace department"),
    location: Optional[str] = Query(None, description="Filter by site location"),
    severity: Optional[str] = Query(None, description="Critical, High, Medium, Low"),
    status: Optional[str] = Query(None, description="Pending, Reviewed, Resolved"),
    source_type: Optional[str] = Query(None, description="image or video"),
    date_from: Optional[str] = Query(None, description="ISO date start"),
    date_to: Optional[str] = Query(None, description="ISO date end"),
    sort_by: str = Query("detected_at", description="Field to sort by"),
    sort_order: str = Query("desc", description="asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Fetches paginated violation monitoring records with multi-facet filtering.
    """
    return get_violations(
        db=db,
        search=search,
        violation_type=violation_type,
        department=department,
        location=location,
        severity=severity,
        status=status,
        source_type=source_type,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )


@router.get("/{violation_id}", response_model=ViolationItem)
def get_violation(violation_id: str, db: Session = Depends(get_db)):
    """
    Retrieves complete violation record with bounding box coordinates, evidence path,
    and chronological audit trail.
    """
    detail = get_violation_detail(db, violation_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Violation record not found.")
    return detail


@router.patch("/{violation_id}/status", response_model=ViolationItem)
def update_status(
    violation_id: str,
    payload: ViolationStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates the violation's status (Pending -> Reviewed -> Resolved) and creates
    an immutable audit trail entry tracking timestamp, user, and resolution notes.
    """
    valid_statuses = ["Pending", "Reviewed", "Resolved"]
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{payload.status}'. Allowed: {', '.join(valid_statuses)}"
        )

    updated = update_violation_status(
        db=db,
        violation_id=violation_id,
        new_status=payload.status,
        updated_by=payload.updated_by or "HSE Admin",
        notes=payload.notes
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Violation record not found.")
    return updated


@router.post("/sync")
def sync_violations(db: Session = Depends(get_db)):
    """
    Scans Milestone 1 AnalysisJobs to register any newly processed detections as violations.
    """
    count = sync_violations_from_jobs(db)
    return {"status": "success", "synced_violations_count": count}
