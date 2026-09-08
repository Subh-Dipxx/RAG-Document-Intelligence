"""Central application configuration.

Deployment-specific values are supplied through environment variables.
Local defaults belong in .env / .env.example, not in application code.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache


def _required(name: str) -> str:
    value = os.getenv(name)

    if value is None or value.strip() == "":
        raise RuntimeError(
            f"Required environment variable '{name}' is not configured"
        )

    return value


def _required_int(name: str) -> int:
    value = _required(name)

    try:
        return int(value)
    except ValueError as exc:
        raise RuntimeError(
            f"Environment variable '{name}' must be an integer"
        ) from exc


@dataclass(frozen=True)
class Settings:
    # PostgreSQL
    postgres_user: str
    postgres_password: str
    postgres_host: str
    postgres_port: str
    postgres_db: str
    database_url: str

    # MinIO
    minio_endpoint: str
    minio_root_user: str
    minio_root_password: str
    minio_bucket_raw_documents: str
    minio_bucket_page_images: str
    minio_bucket_ocr_output: str
    minio_bucket_tables: str
    minio_bucket_thumbnails: str
    minio_presign_expires_seconds: int

    # Redis / Celery
    redis_url: str
    celery_default_queue: str
    celery_document_queue: str
    celery_dead_letter_queue: str
    celery_max_retries: int
    celery_retry_backoff_max: int

    # Other local services
    qdrant_url: str
    opensearch_url: str

    # Chunking
    chunk_size: int
    chunk_overlap: int
    chunker_type: str
    semantic_similarity_threshold: float

    # Embeddings
    embedding_model: str

    # Generation
    gemini_api_key: str
    gemini_model: str

    # Retrieval
    retrieval_top_k: int
    retrieval_min_score: float

    # Authentication
    jwt_secret: str
    jwt_access_token_expire_minutes: int
    def object_buckets(self) -> tuple[str, ...]:
        return (
            self.minio_bucket_raw_documents,
            self.minio_bucket_page_images,
            self.minio_bucket_ocr_output,
            self.minio_bucket_tables,
            self.minio_bucket_thumbnails,
        )


def load_settings() -> Settings:
    return Settings(
        postgres_user=_required("POSTGRES_USER"),
        postgres_password=_required("POSTGRES_PASSWORD"),
        postgres_host=_required("POSTGRES_HOST"),
        postgres_port=_required("POSTGRES_PORT"),
        postgres_db=_required("POSTGRES_DB"),
        database_url=_required("DATABASE_URL"),

        minio_endpoint=_required("MINIO_ENDPOINT"),
        minio_root_user=_required("MINIO_ROOT_USER"),
        minio_root_password=_required("MINIO_ROOT_PASSWORD"),
        minio_bucket_raw_documents=_required(
            "MINIO_BUCKET_RAW_DOCUMENTS"
        ),
        minio_bucket_page_images=_required(
            "MINIO_BUCKET_PAGE_IMAGES"
        ),
        minio_bucket_ocr_output=_required(
            "MINIO_BUCKET_OCR_OUTPUT"
        ),
        minio_bucket_tables=_required("MINIO_BUCKET_TABLES"),
        minio_bucket_thumbnails=_required(
            "MINIO_BUCKET_THUMBNAILS"
        ),
        minio_presign_expires_seconds=_required_int(
            "MINIO_PRESIGN_EXPIRES_SECONDS"
        ),

        redis_url=_required("REDIS_URL"),
        celery_default_queue=_required("CELERY_DEFAULT_QUEUE"),
        celery_document_queue=_required("CELERY_DOCUMENT_QUEUE"),
        celery_dead_letter_queue=_required(
            "CELERY_DEAD_LETTER_QUEUE"
        ),
        celery_max_retries=_required_int("CELERY_MAX_RETRIES"),
        celery_retry_backoff_max=_required_int(
            "CELERY_RETRY_BACKOFF_MAX"
        ),

        qdrant_url=_required("QDRANT_URL"),
        opensearch_url=_required("OPENSEARCH_URL"),

        chunk_size=_required_int("CHUNK_SIZE"),
        chunk_overlap=_required_int("CHUNK_OVERLAP"),
        chunker_type=_required("CHUNKER_TYPE"),
        semantic_similarity_threshold=float(
            _required("SEMANTIC_SIMILARITY_THRESHOLD")
        ),

        embedding_model=_required("EMBEDDING_MODEL"),

        gemini_api_key=_required("GEMINI_API_KEY"),
        gemini_model=_required("GEMINI_MODEL"),
        retrieval_top_k=_required_int("RETRIEVAL_TOP_K"),
        retrieval_min_score=float(_required("RETRIEVAL_MIN_SCORE")),
        jwt_secret=_required("JWT_SECRET"),
        jwt_access_token_expire_minutes=_required_int(
            "JWT_ACCESS_TOKEN_EXPIRE_MINUTES"
        ),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return load_settings()


def reset_settings_cache() -> None:
    get_settings.cache_clear()
