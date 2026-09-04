from datetime import datetime
from domain.models import (
    Document,
    Version,
    Page,
    Chunk,
    Query,
    Citation,
    EvalResult,
    OCRWord,
    OCRResult,
    ParsedDocument,
    Answer,
)


def test_document_model_instantiation():
    doc = Document(
        id="doc-123",
        title="Test Document",
        file_name="sample.pdf",
        mime_type="application/pdf",
        file_size=1024,
        permissions=["user_1", "group_admin"],
    )

    assert doc.id == "doc-123"
    assert doc.title == "Test Document"
    assert doc.file_size == 1024
    assert doc.permissions == ["user_1", "group_admin"]
    assert isinstance(doc.created_at, datetime)
    assert isinstance(doc.updated_at, datetime)


def test_version_and_page_models():
    page = Page(number=1, text="Sample page content", image_storage_key="images/page_1.png")
    version = Version(
        id="v-1",
        document_id="doc-123",
        version_number=1,
        storage_key="raw-documents/doc-123/v-1/sample.pdf",
        file_hash="sha256hash123",
    )

    assert page.number == 1
    assert page.image_storage_key == "images/page_1.png"
    assert version.version_number == 1
    assert version.storage_key.endswith("sample.pdf")


def test_chunk_and_query_models():
    chunk = Chunk(
        id="c-1",
        document_id="doc-123",
        version_id="v-1",
        page_number=1,
        text="Chunk text segment",
        start_offset=0,
        end_offset=18,
        tokens=4,
    )
    query = Query(text="What is sample page content?", top_k=5, permissions=["user_1"])

    assert chunk.id == "c-1"
    assert chunk.tokens == 4
    assert query.top_k == 5
    assert "user_1" in query.permissions


def test_citation_eval_answer_models():
    citation = Citation(source="doc-123", page=1, excerpt="Chunk text segment")
    answer = Answer(text="The sample content is segment.", citations=[citation], is_generated=True)
    eval_res = EvalResult(
        id="eval-1",
        query=Query(text="Sample query"),
        retrieved_ids=["c-1"],
        score=0.95,
        correct=True,
    )

    assert citation.page == 1
    assert len(answer.citations) == 1
    assert answer.is_generated is True
    assert eval_res.score == 0.95
    assert eval_res.correct is True
