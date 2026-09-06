from __future__ import annotations

from typing import Protocol, runtime_checkable


@runtime_checkable
class ObjectStorage(Protocol):
    """Swappable object-storage adapter (MinIO, in-memory, etc.)."""

    def init_buckets(self) -> None:
        ...

    def upload_bytes(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        ...

    def download_bytes(self, bucket_name: str, object_name: str) -> bytes:
        ...

    def delete_object(self, bucket_name: str, object_name: str) -> None:
        ...

    def get_presigned_url(
        self, bucket_name: str, object_name: str, expires_seconds: int | None = None
    ) -> str:
        ...
