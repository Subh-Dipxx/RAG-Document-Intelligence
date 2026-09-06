from celery import Celery, Task
from kombu import Exchange, Queue

from backend.config import get_settings

settings = get_settings()

default_exchange = Exchange(
    settings.celery_default_queue,
    type="direct",
)

dead_letter_exchange = Exchange(
    settings.celery_dead_letter_queue,
    type="direct",
)

celery_app = Celery(
    "rag_workers",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["backend.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",

    timezone="UTC",
    enable_utc=True,

    task_queues=(
        Queue(
            settings.celery_default_queue,
            default_exchange,
            routing_key=settings.celery_default_queue,
        ),
        Queue(
            settings.celery_document_queue,
            default_exchange,
            routing_key=settings.celery_document_queue,
        ),
        Queue(
            settings.celery_dead_letter_queue,
            dead_letter_exchange,
            routing_key=settings.celery_dead_letter_queue,
        ),
    ),

    task_default_queue=settings.celery_default_queue,
    task_default_exchange=settings.celery_default_queue,
    task_default_routing_key=settings.celery_default_queue,

    task_routes={
        "backend.workers.tasks.process_document_task": {
            "queue": settings.celery_document_queue,
        },
        "backend.workers.tasks.dead_letter_handler_task": {
            "queue": settings.celery_dead_letter_queue,
        },
        "backend.workers.tasks.step1_failure_test_task": {
            "queue": settings.celery_default_queue,
        },
    },
)


class DLQBaseTask(Task):
    """Send permanently failed tasks to the configured DLQ task."""

    def on_failure(
        self,
        exc,
        task_id,
        args,
        kwargs,
        einfo,
    ):
        print(
            f"Task {self.name}[{task_id}] failed permanently. "
            f"Sending to DLQ."
        )

        try:
            from backend.workers.tasks import dead_letter_handler_task

            dead_letter_handler_task.apply_async(
                kwargs={
                    "task_name": self.name,
                    "task_id": task_id,
                    "args": args,
                    "kwargs": kwargs,
                    "exception": str(exc),
                    "traceback": str(einfo),
                },
                queue=settings.celery_dead_letter_queue,
            )

        except Exception as dlq_error:
            print(
                f"Failed to publish task {task_id} "
                f"to DLQ: {dlq_error}"
            )

        super().on_failure(
            exc,
            task_id,
            args,
            kwargs,
            einfo,
        )
