import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.database import Base
from db import crud
from domain.models import Document, Version, Page, Chunk, EvalResult, Query
from storage.minio_client import MinIOStorage


@pytest.fixture
def db_session():
    """In-memory SQLite DB fixture for fast testing."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()


def test_crud_document_operations(db_session):
    doc = Document(
        id="test-doc-1",
        title="Test Doc",
        file_name="doc.pdf",
        mime_type="application/pdf",
        file_size=500,
        permissions=["admin"],
    )

    created_doc = crud.create_document(db_session, doc)
    assert created_doc.id == "test-doc-1"

    retrieved = crud.get_document(db_session, "test-doc-1")
    assert retrieved is not None
    assert retrieved.title == "Test Doc"

    doc_list = crud.list_documents(db_session)
    assert len(doc_list) == 1

    deleted = crud.delete_document(db_session, "test-doc-1")
    assert deleted is True
    assert crud.get_document(db_session, "test-doc-1") is None


def test_crud_version_and_chunks(db_session):
    doc = Document(id="doc-2", title="Doc 2")
    crud.create_document(db_session, doc)

    version = Version(id="v-2", document_id="doc-2", version_number=1, storage_key="key/1")
    crud.create_version(db_session, version)

    versions = crud.get_versions(db_session, "doc-2")
    assert len(versions) == 1
    assert versions[0].storage_key == "key/1"

    chunk = Chunk(id="chunk-1", document_id="doc-2", version_id="v-2", page_number=1, text="Sample text")
    crud.create_chunk(db_session, chunk)

    chunks = crud.get_chunks_by_document(db_session, "doc-2")
    assert len(chunks) == 1
    assert chunks[0].text == "Sample text"


def test_crud_eval_result(db_session):
    eval_res = EvalResult(
        id="eval-10",
        query=Query(text="Search query"),
        retrieved_ids=["chunk-1"],
        score=1.0,
        correct=True,
        notes="Exact match",
    )
    db_eval = crud.create_eval_result(db_session, eval_res)
    assert db_eval.id == "eval-10"

    eval_list = crud.list_eval_results(db_session)
    assert len(eval_list) == 1
    assert eval_list[0].query_text == "Search query"
