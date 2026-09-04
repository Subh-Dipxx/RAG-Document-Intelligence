from workers.celery_app import celery_app
from workers.tasks import process_document_task, dead_letter_handler_task


def test_process_document_task_execution():
    res = process_document_task.apply(args=["doc-test-1", "v-test-1"]).get()
    assert res["status"] == "completed"
    assert res["document_id"] == "doc-test-1"
    assert res["version_id"] == "v-test-1"


def test_dead_letter_handler_task_execution():
    res = dead_letter_handler_task.apply(
        kwargs={
            "task_name": "workers.tasks.process_document_task",
            "task_id": "failed-task-id",
            "args": ["doc-1"],
            "kwargs": {},
            "exception": "Test max retries exceeded error",
            "traceback": "Traceback info...",
        }
    ).get()

    assert res["dlq_status"] == "recorded"
    assert res["task_id"] == "failed-task-id"
    assert res["exception"] == "Test max retries exceeded error"


def test_celery_queues_configuration():
    queues = celery_app.conf.task_queues
    queue_names = [q.name for q in queues]
    assert "default" in queue_names
    assert "document_tasks" in queue_names
    assert "dead_letter" in queue_names
