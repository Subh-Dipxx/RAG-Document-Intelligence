from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Optional

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from backend.config import get_settings
from backend.storage.keys import object_key


class MinIOStorage:
    """
    S3-compatible object storage adapter backed by MinIO.

    boto3 is used as the client SDK.
    MinIO remains the actual object-storage server.

    Because the application communicates through the S3 API,
    the same storage adapter can later point to Amazon S3 or
    another S3-compatible object-storage service.
    """

    def __init__(
        self,
        endpoint: Optional[str] = None,
        access_key: Optional[str] = None,
        secret_key: Optional[str] = None,
    ):
        settings = get_settings()

        endpoint_url = endpoint or settings.minio_endpoint

        self.settings = settings
        self.endpoint_url = endpoint_url

        self.client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=(
                access_key or settings.minio_root_user
            ),
            aws_secret_access_key=(
                secret_key or settings.minio_root_password
            ),
            region_name="us-east-1",
            config=Config(
                signature_version="s3v4",
                s3={
                    "addressing_style": "path",
                },
            ),
        )

    def init_buckets(self) -> None:
        settings = get_settings()

        for bucket in settings.object_buckets():
            try:
                self.client.head_bucket(
                    Bucket=bucket
                )

            except ClientError as exc:
                error_code = str(
                    exc.response
                    .get("Error", {})
                    .get("Code", "")
                )

                if error_code in {
                    "404",
                    "NoSuchBucket",
                    "NotFound",
                }:
                    try:
                        self.client.create_bucket(
                            Bucket=bucket
                        )
                    except ClientError as create_exc:
                        print(
                            f"Warning: Failed to ensure MinIO "
                            f"bucket '{bucket}': {create_exc}"
                        )
                else:
                    print(
                        f"Warning: Failed to check MinIO "
                        f"bucket '{bucket}': {exc}"
                    )

    def upload_bytes(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
    ) -> str:
        key = object_key(*object_name.split("/"))

        self.client.upload_fileobj(
            BytesIO(data),
            bucket_name,
            key,
            ExtraArgs={
                "ContentType": content_type,
            },
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

        self.client.upload_file(
            file_path,
            bucket_name,
            key,
            ExtraArgs={
                "ContentType": content_type,
            },
        )

        return f"{bucket_name}/{key}"

    def download_bytes(
        self,
        bucket_name: str,
        object_name: str,
    ) -> bytes:
        key = object_key(*object_name.split("/"))

        response = self.client.get_object(
            Bucket=bucket_name,
            Key=key,
        )

        try:
            return response["Body"].read()
        finally:
            response["Body"].close()

    def get_presigned_url(
        self,
        bucket_name: str,
        object_name: str,
        expires_seconds: int | None = None,
    ) -> str:
        settings = get_settings()

        ttl = (
            expires_seconds
            if expires_seconds is not None
            else settings.minio_presign_expires_seconds
        )

        key = object_key(*object_name.split("/"))

        return self.client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": bucket_name,
                "Key": key,
            },
            ExpiresIn=ttl,
        )

    def delete_object(
        self,
        bucket_name: str,
        object_name: str,
    ) -> None:
        key = object_key(*object_name.split("/"))

        self.client.delete_object(
            Bucket=bucket_name,
            Key=key,
        )


minio_storage = MinIOStorage()

# Backwards-compatible names — values always come from settings, not literals.
RAW_DOCUMENTS_BUCKET = get_settings().minio_bucket_raw_documents
PAGE_IMAGES_BUCKET = get_settings().minio_bucket_page_images
OCR_OUTPUT_BUCKET = get_settings().minio_bucket_ocr_output
TABLES_BUCKET = get_settings().minio_bucket_tables
THUMBNAILS_BUCKET = get_settings().minio_bucket_thumbnails
PROFILE_PICTURES_BUCKET = get_settings().minio_bucket_profile_pictures
ALL_BUCKETS = list(get_settings().object_buckets())
