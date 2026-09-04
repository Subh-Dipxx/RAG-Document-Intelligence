import os
from celery import Celery, Task
from kombu import Queue, Exchange

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "rag_workers",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

# Configure Queues and Dead-Letter Queue (DLQ) exchanges
default_exchange = Exchange("default", type="direct")
dlq_exchange = Exchange("dead_letter", type="direct")

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_queues=(
        Queue("default", default_exchange, routing_key="default"),
        Queue("document_tasks", default_exchange, routing_key="document_tasks"),
        Queue("dead_letter", dlq_exchange, routing_key="dead_letter"),
    ),
    task_default_queue="default",
    task_default_exchange="default",
    task_default_routing_key="default",
    task_routes={
        "workers.tasks.dead_letter_handler_task": {"queue": "dead_letter"},
        "workers.tasks.process_document_task": {"queue": "document_tasks"},
    },
)


class DLQBaseTask(Task):
    """Custom base task that routes failed tasks to the dead-letter queue after max retries are exceeded."""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        print(f"Task {self.name}[{task_id}] failed permanently: {exc}. Routing to DLQ.")
        try:
            from workers.tasks import dead_letter_handler_task
            dead_letter_handler_task.delay(
                task_name=self.name,
                task_id=task_id,
                args=args,
                kwargs=kwargs,
                exception=str(exc),
                traceback=str(einfo),
            )
        except Exception as dlq_err:
            print(f"Failed to publish to DLQ for task {task_id}: {dlq_err}")
        super().on_failure(exc, task_id, args, kwargs, einfo)
