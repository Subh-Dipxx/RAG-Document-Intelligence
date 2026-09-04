import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from api.main import app
from db.database import Base, get_db

# In-memory database fixture for API tests
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert "ok" in json_data
    assert "services" in json_data


def test_upload_document_endpoint():
    files = {"file": ("test.txt", b"Hello document intelligence!", "text/plain")}
    data = {"title": "Test Upload Document", "permissions": '["user_1"]'}

    response = client.post("/api/v1/documents", files=files, data=data)
    assert response.status_code == 201
    res = response.json()
    assert res["title"] == "Test Upload Document"
    assert res["file_name"] == "test.txt"
    assert res["permissions"] == ["user_1"]
    assert len(res["versions"]) == 1


def test_list_and_get_document_endpoints():
    files = {"file": ("sample.txt", b"Sample content", "text/plain")}
    post_res = client.post("/api/v1/documents", files=files, data={"title": "Doc Title"})
    doc_id = post_res.json()["id"]

    list_res = client.get("/api/v1/documents")
    assert list_res.status_code == 200
    docs = list_res.json()
    assert len(docs) >= 1

    get_res = client.get(f"/api/v1/documents/{doc_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id


def test_eval_endpoints():
    payload = {
        "query_text": "What is the policy?",
        "query_filters": {"doc_id": "123"},
        "retrieved_ids": ["chunk_1", "chunk_2"],
        "score": 0.88,
        "correct": True,
        "notes": "Good retrieval",
    }
    post_res = client.post("/api/v1/eval", json=payload)
    assert post_res.status_code == 201
    eval_data = post_res.json()
    assert eval_data["query_text"] == "What is the policy?"
    assert eval_data["score"] == 0.88

    get_res = client.get("/api/v1/eval")
    assert get_res.status_code == 200
    evals = get_res.json()
    assert len(evals) >= 1
