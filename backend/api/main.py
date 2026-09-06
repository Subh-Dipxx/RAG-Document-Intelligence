from backend.config import get_settings
import json
import urllib.request
import urllib.error
from typing import Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy import create_engine, text
import redis
from opensearchpy import OpenSearch

from backend.database.database import init_db
from backend.storage.minio_client import minio_storage
from backend.api.controllers import documents, jobs, eval as eval_route



@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    minio_storage.init_buckets()
    yield


app = FastAPI(
    title="RAG Platform API",
    description="Local RAG document intelligence API. Interactive API documentation is available at /docs.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Register API v1 routes
app.include_router(documents.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(eval_route.router, prefix="/api/v1")

settings = get_settings()

DATABASE_URL = settings.database_url
REDIS_URL = settings.redis_url
MINIO_ENDPOINT = settings.minio_endpoint
QDRANT_URL = settings.qdrant_url
OPENSEARCH_URL = settings.opensearch_url
OLLAMA_URL = settings.ollama_url

def http_check(url: str, path: str = "", timeout: int = 5) -> Dict[str, Any]:
    full = url.rstrip("/") + path
    try:
        with urllib.request.urlopen(full, timeout=timeout) as resp:
            status = resp.getcode()
            return {"ok": 200 <= status < 300, "status": status}
    except urllib.error.HTTPError as e:
        return {"ok": False, "status": e.code, "error": str(e)}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def check_postgres() -> Dict[str, Any]:
    try:
        engine = create_engine(DATABASE_URL, connect_args={})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def check_redis() -> Dict[str, Any]:
    try:
        r = redis.from_url(REDIS_URL)
        pong = r.ping()
        return {"ok": bool(pong)}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def check_minio() -> Dict[str, Any]:
    # Use the MinIO readiness endpoint used in docker-compose
    return http_check(MINIO_ENDPOINT, "/minio/health/ready")


def check_qdrant() -> Dict[str, Any]:
    # Qdrant's root path returns version info; use it for readiness instead of /health which may 404
    return http_check(QDRANT_URL, "/")


def check_opensearch() -> Dict[str, Any]:
    try:
        # opensearch-py accepts a hosts list; pass the full URL
        client = OpenSearch(hosts=[OPENSEARCH_URL], timeout=5)
        health = client.cluster.health()
        status = health.get("status")
        return {"ok": True, "status": status, "raw": health}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def check_ollama() -> Dict[str, Any]:
    # Ollama exposes /v1/models for a simple readiness check
    return http_check(OLLAMA_URL, "/v1/models")


@app.get("/health")
def health():
    """Check connectivity to all external services and return per-service status."""
    results = {
        "postgres": check_postgres(),
        "redis": check_redis(),
        "minio": check_minio(),
        "qdrant": check_qdrant(),
        "opensearch": check_opensearch(),
        "ollama": check_ollama(),
    }
    overall = all(v.get("ok") for v in results.values())
    return {"ok": overall, "services": results}

