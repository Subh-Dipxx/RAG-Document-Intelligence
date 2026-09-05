from __future__ import annotations

from typing import Dict, Tuple

from config import get_settings
from storage.keys import object_key


class MemoryStorage:
    """In-process object store for tests and local runs without MinIO."""

    def __init__(self) -> None:
        self._objects: Dict[Tuple[str, str], bytes] = {}
        self._buckets: set[str] = set()

    def init_buckets(self) -> None:
        for bucket in get_settings().object_buckets():
            self._buckets.add(bucket)

    def upload_bytes(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        key = object_key(*object_name.split("/"))
        self._buckets.add(bucket_name)
        self._objects[(bucket_name, key)] = data
        return f"{bucket_name}/{key}"

    def download_bytes(self, bucket_name: str, object_name: str) -> bytes:
        key = object_key(*object_name.split("/"))
        try:
            return self._objects[(bucket_name, key)]
        except KeyError as exc:
            raise FileNotFoundError(f"{bucket_name}/{key}") from exc

    def delete_object(self, bucket_name: str, object_name: str) -> None:
        key = object_key(*object_name.split("/"))
        self._objects.pop((bucket_name, key), None)

    def get_presigned_url(
        self, bucket_name: str, object_name: str, expires_seconds: int | None = None
    ) -> str:
        key = object_key(*object_name.split("/"))
        return f"memory://{bucket_name}/{key}"


memory_storage = MemoryStorage()