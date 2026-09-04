import io
import os
from typing import Optional
from minio import Minio
from minio.error import S3Error

MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://localhost:9000")
MINIO_ROOT_USER = os.getenv("MINIO_ROOT_USER", "minioadmin")
MINIO_ROOT_PASSWORD = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")

RAW_DOCUMENTS_BUCKET = "raw-documents"
PAGE_IMAGES_BUCKET = "page-images"
OCR_OUTPUT_BUCKET = "ocr-output"

ALL_BUCKETS = [RAW_DOCUMENTS_BUCKET, PAGE_IMAGES_BUCKET, OCR_OUTPUT_BUCKET]


class MinIOStorage:
    def __init__(self, endpoint: Optional[str] = None, access_key: Optional[str] = None, secret_key: Optional[str] = None):
        endpoint_url = endpoint or MINIO_ENDPOINT
        # Strip scheme prefix if passed (e.g. http://minio:9000 -> minio:9000)
        clean_endpoint = endpoint_url.replace("http://", "").replace("https://", "")
        secure = endpoint_url.startswith("https://")

        self.client = Minio(
            endpoint=clean_endpoint,
            access_key=access_key or MINIO_ROOT_USER,
            secret_key=secret_key or MINIO_ROOT_PASSWORD,
            secure=secure,
        )

    def init_buckets(self) -> None:
        """Ensure all required buckets exist in MinIO."""
        for bucket in ALL_BUCKETS:
            try:
                if not self.client.bucket_exists(bucket):
                    self.client.make_bucket(bucket)
            except Exception as e:
                # Log or handle initialization errors when MinIO service isn't reachble
                print(f"Warning: Failed to ensure MinIO bucket '{bucket}': {e}")

    def upload_bytes(self, bucket_name: str, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        data_stream = io.BytesIO(data)
        self.client.put_object(
            bucket_name=bucket_name,
            object_name=object_name,
            data=data_stream,
            length=len(data),
            content_type=content_type,
        )
        return f"{bucket_name}/{object_name}"

    def upload_file(self, bucket_name: str, object_name: str, file_path: str, content_type: str = "application/octet-stream") -> str:
        self.client.fput_object(
            bucket_name=bucket_name,
            object_name=object_name,
            file_path=file_path,
            content_type=content_type,
        )
        return f"{bucket_name}/{object_name}"

    def download_bytes(self, bucket_name: str, object_name: str) -> bytes:
        response = self.client.get_object(bucket_name, object_name)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def get_presigned_url(self, bucket_name: str, object_name: str, expires_seconds: int = 3600) -> str:
        from datetime import timedelta
        return self.client.presigned_get_object(
            bucket_name=bucket_name,
            object_name=object_name,
            expires=timedelta(seconds=expires_seconds),
        )

    def delete_object(self, bucket_name: str, object_name: str) -> None:
        self.client.remove_object(bucket_name, object_name)


# Default singleton storage instance
minio_storage = MinIOStorage()
