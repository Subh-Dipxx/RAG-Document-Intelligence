from __future__ import annotations

from backend.config import get_settings
from backend.storage.base import ObjectStorage
from backend.storage.memory import memory_storage
from backend.storage.minio_client import minio_storage


def get_object_storage() -> ObjectStorage:
    backend = get_settings().object_storage_backend
    if backend in {"memory", "local", "inmemory"}:
        return memory_storage
    return minio_storage
