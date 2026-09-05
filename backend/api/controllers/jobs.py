from fastapi import APIRouter
from celery.result import AsyncResult
from workers.celery_app import celery_app
from api.schemas.document_schemas import JobStatusResponse

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{task_id}", response_model=JobStatusResponse)
def get_job_status(task_id: str):
    """Query async Celery job status and result by task ID."""
    result = AsyncResult(task_id, app=celery_app)
    return JobStatusResponse(
        task_id=task_id,
        status=result.status,
        result=result.result if result.ready() else None,
    )
