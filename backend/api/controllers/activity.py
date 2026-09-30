from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth.dependencies import AuthContext, get_auth_context
from backend.database.database import get_db
from backend.database.models import ActivityLogModel


router = APIRouter(
    prefix="/activity",
    tags=["activity"],
)


class ActivityResponse(BaseModel):
    id: str
    actor_username: str
    activity_type: str
    message: str
    document_id: str | None = None
    document_name: str | None = None
    created_at: datetime | None = None


@router.delete("")
def clear_activity(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    if not auth.tenant_id or auth.account_type != "organization":
        raise HTTPException(403, "Organization activity access required")

    if auth.role != "admin":
        raise HTTPException(
            403,
            "Only organization administrators can clear activity",
        )

    deleted_count = (
        db.query(ActivityLogModel)
        .filter(ActivityLogModel.tenant_id == auth.tenant_id)
        .delete(synchronize_session=False)
    )

    db.commit()

    return {"deleted_count": deleted_count}


@router.get("", response_model=list[ActivityResponse])
def list_activity(
    document_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
) -> list[ActivityResponse]:
    if not auth.tenant_id or auth.account_type != "organization":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization activity access required",
        )

    if auth.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can view activity",
        )

    query = (
        db.query(ActivityLogModel)
        .filter(
            ActivityLogModel.tenant_id == auth.tenant_id,
        )
    )

    if document_id:
        query = query.filter(
            ActivityLogModel.document_id == document_id,
        )

    activities = (
        query
        .order_by(ActivityLogModel.created_at.desc())
        .limit(200)
        .all()
    )

    return [
        ActivityResponse(
            id=activity.id,
            actor_username=activity.actor_username,
            activity_type=activity.activity_type,
            message=activity.message,
            document_id=activity.document_id,
            document_name=activity.document_name,
            created_at=activity.created_at,
        )
        for activity in activities
    ]
