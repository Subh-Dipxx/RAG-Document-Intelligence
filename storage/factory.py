from __future__ import annotations

from config import get_settings
from storage.base import ObjectStorage
from storage.memory import memory_storage
from storage.minio_client import minio_storage


def get_object_storage() -> ObjectStorage:
    backend = get_settings().object_storage_backend
    if backend in {"memory", "local", "inmemory"}:
        return memory_storage
    return minio_storage