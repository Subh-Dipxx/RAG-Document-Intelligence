from typing import Any

from sqlalchemy.orm import Session

from backend.database.models import (
    ActivityLogModel,
    UserModel,
)


def log_activity(
    db: Session,
    *,
    tenant_id: str,
    actor_id: str | None,
    activity_type: str,
    message: str,
    document_id: str | None = None,
    document_name: str | None = None,
    metadata_json: dict[str, Any] | None = None,
) -> ActivityLogModel:
    actor_username = actor_id or "Unknown user"

    if actor_id:
        actor = (
            db.query(UserModel)
            .filter(UserModel.id == actor_id)
            .first()
        )

        if actor:
            actor_username = actor.username

    activity = ActivityLogModel(
        tenant_id=tenant_id,
        actor_id=actor_id,
        actor_username=actor_username,
        activity_type=activity_type,
        message=message,
        document_id=document_id,
        document_name=document_name,
        metadata_json=metadata_json or {},
    )

    db.add(activity)
    db.flush()

    return activity
