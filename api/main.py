import os
import json
import urllib.request
import urllib.error
from typing import Dict, Any

from fastapi import FastAPI
from sqlalchemy import create_engine, text
import redis
from opensearchpy import OpenSearch

app = FastAPI(title="RAG Platform API")

# Read environment variables with sensible defaults (matching .env.example)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@postgres:5432/rag")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "http://minio:9000")
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant:6333")
OPENSEARCH_URL = os.getenv("OPENSEARCH_URL", "http://opensearch:9200")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434")


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
