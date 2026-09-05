from typing import Any

from config import get_settings
from workers.celery_app import DLQBaseTask, celery_app


settings = get_settings()


@celery_app.task(
    bind=True,
    base=DLQBaseTask,
    name="workers.tasks.process_document_task",
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=settings.celery_retry_backoff_max,
    max_retries=settings.celery_max_retries,
)
def process_document_task(
    self,
    document_id: str,
    version_id: str,
) -> dict[str, Any]:
    """Stage 1 document-processing task skeleton."""

    print(
        f"Processing document {document_id}, "
        f"version {version_id}, "
        f"attempt={self.request.retries + 1}"
    )

    return {
        "status": "completed",
        "document_id": document_id,
        "version_id": version_id,
        "processed_pages": 0,
        "created_chunks": 0,
    }


@celery_app.task(
    name="workers.tasks.dead_letter_handler_task",
)
def dead_letter_handler_task(
    task_name: str,
    task_id: str,
    args: list[Any],
    kwargs: dict[str, Any],
    exception: str,
    traceback: str,
) -> dict[str, Any]:
    """Record a permanently failed task."""

    print(
        f"[DLQ RECORDED] "
        f"{task_name}[{task_id}]"
    )

    print(f"Error: {exception}")

    return {
        "dlq_status": "recorded",
        "task_name": task_name,
        "task_id": task_id,
        "exception": exception,
    }


@celery_app.task(
    bind=True,
    base=DLQBaseTask,
    name="workers.tasks.step1_failure_test_task",
    autoretry_for=(RuntimeError,),
    retry_backoff=False,
    max_retries=settings.celery_max_retries,
)
def step1_failure_test_task(self) -> None:
    """Intentional failure task used only to verify retry/DLQ behavior."""

    raise RuntimeError(
        "Intentional Step 1 retry/DLQ verification failure"
    )