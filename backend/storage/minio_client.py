from __future__ import annotations

import io
from datetime import timedelta
from typing import Optional

from minio import Minio

from config import get_settings
from storage.keys import object_key


class MinIOStorage:
    def __init__(
        self,
        endpoint: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ):
        settings = get_settings()
        endpoint_url = endpoint or settings.minio_endpoint
        clean_endpoint = endpoint_url.replace("http://", "").replace("https://", "")
        secure = endpoint_url.startswith("https://")
        self.client = Minio(
            endpoint=clean_endpoint,
            access_key=access_key or settings.minio_root_user,
            secret_key=secret_key or settings.minio_root_password,
            secure=secure,
        )

    def init_buckets(self) -> None:
        for bucket in get_settings().object_buckets():
            try:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
            except Exception as exc:
                print(f"Warning: Failed to ensure MinIO bucket '{bucket}': {exc}")

    def upload_bytes(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        key = object_key(*object_name.split("/"))
        data_stream = io.BytesIO(data)
        self.client.put_object(
            bucket_name=bucket_name,
            object_name=key,
            data=data_stream,
            length=len(data),
            content_type=content_type,
        )
        return f"{bucket_name}/{key}"

    def upload_file(
        self,
        bucket_name: str,
        object_name: str,
        file_path: str,
        content_type: str = "application/octet-stream",
    ) -> str:
        key = object_key(*object_name.split("/"))
        self.client.fput_object(
            bucket_name=bucket_name,
            object_name=key,
            file_path=file_path,
            content_type=content_type,
        )
        return f"{bucket_name}/{key}"

    def download_bytes(self, bucket_name: str, object_name: str) -> bytes:
        key = object_key(*object_name.split("/"))
        response = self.client.get_object(bucket_name, key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def get_presigned_url(
        self, bucket_name: str, object_name: str, expires_seconds: int | None = None
    ) -> str:
        settings = get_settings()
        ttl = expires_seconds if expires_seconds is not None else settings.minio_presign_expires_seconds
        key = object_key(*object_name.split("/"))
        return self.client.presigned_get_object(
            bucket_name=bucket_name,
            object_name=key,
            expires=timedelta(seconds=ttl),
        )

    def delete_object(self, bucket_name: str, object_name: str) -> None:
        key = object_key(*object_name.split("/"))
        self.client.remove_object(bucket_name, key)


minio_storage = MinIOStorage()

# Backwards-compatible names — values always come from settings, not literals.
RAW_DOCUMENTS_BUCKET = get_settings().minio_bucket_raw_documents
PAGE_IMAGES_BUCKET = get_settings().minio_bucket_page_images
OCR_OUTPUT_BUCKET = get_settings().minio_bucket_ocr_output
TABLES_BUCKET = get_settings().minio_bucket_tables
THUMBNAILS_BUCKET = get_settings().minio_bucket_thumbnails
ALL_BUCKETS = list(get_settings().object_buckets())