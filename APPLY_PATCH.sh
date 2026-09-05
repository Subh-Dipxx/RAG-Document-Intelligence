#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [[ ! -f "docker-compose.yml" || ! -d "api" || ! -d "domain" ]]; then
  echo "Run this from the root of rag-document-intelligence, or copy the patch contents there first."
  exit 1
fi

mkdir -p frontend/src

if ! grep -q '^FRONTEND_PORT=' .env 2>/dev/null; then
  printf '\n# Frontend\nFRONTEND_PORT=3000\n' >> .env
fi
if ! grep -q '^FRONTEND_PORT=' .env.example 2>/dev/null; then
  printf '\n# Frontend\nFRONTEND_PORT=3000\n' >> .env.example
fi

python3 - <<'PY'
from pathlib import Path

p = Path('docker-compose.yml')
text = p.read_text()

if '\n  frontend:\n' not in text:
    marker = '\nvolumes:\n'
    if marker not in text:
        raise SystemExit('Could not locate volumes section in docker-compose.yml')
    service = '''\n  frontend:\n    build:\n      context: ./frontend\n      dockerfile: Dockerfile\n    depends_on:\n      api:\n        condition: service_healthy\n    ports:\n      - "${FRONTEND_PORT}:80"\n\n'''
    text = text.replace(marker, service + marker, 1)
    p.write_text(text)

main = Path('api/main.py')
if main.exists():
    text = main.read_text()
    old = 'app = FastAPI(title="RAG Platform API", lifespan=lifespan)'
    new = '''app = FastAPI(\n    title="RAG Platform API",\n    description="Local RAG document intelligence API. Interactive API documentation is available at /docs.",\n    version="0.1.0",\n    docs_url="/docs",\n    redoc_url="/redoc",\n    openapi_url="/openapi.json",\n    lifespan=lifespan,\n)'''
    if old in text and 'docs_url="/docs"' not in text:
        main.write_text(text.replace(old, new, 1))
PY

echo "Patch applied. Existing application files were preserved except docker-compose.yml and api/main.py documentation metadata."
echo "Next: docker compose config --services"
echo "Then: docker compose build frontend && docker compose up -d --build frontend"
