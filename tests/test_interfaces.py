from ingestion.parsers.base import DocumentParser
from ingestion.ocr.base import OCREngine
from chunking.base import Chunker
from indexing.embedders.base import Embedder
from indexing.vector_stores.base import VectorStore
from indexing.lexical.base import LexicalIndex
from retrieval.base import Retriever
from generation.base import Generator

from domain.models import ParsedDocument, OCRResult, Chunk, Query, Answer, Document


# For each Protocol import above, define a minimal concrete subclass that
# implements the required methods. The test asserts that subclassing works
# and that the method signatures are compatible at runtime.

class DummyParser(DocumentParser):
    def parse(self, file_path: str) -> ParsedDocument:
        doc = Document(id="doc1", title="dummy", pages=[])
        return ParsedDocument(document=doc)


class DummyOCREngine(OCREngine):
    def extract(self, image):
        return OCRResult(full_text="", words=[])


class DummyChunker(Chunker):
    def chunk(self, document: Document) -> list[Chunk]:
        return []


class DummyEmbedder(Embedder):
    def embed(self, texts):
        return [[0.0] for _ in texts]


class DummyVectorStore(VectorStore):
    def upsert(self, items):
        return None

    def search(self, vector, top_k: int = 10, filter=None):
        return []

    def delete(self, ids=None, filter=None):
        return None


class DummyLexicalIndex(LexicalIndex):
    def upsert(self, docs):
        return None

    def search(self, query: str, top_k: int = 10, filters=None):
        return []

    def delete(self, ids=None, filters=None):
        return None


class DummyRetriever(Retriever):
    def retrieve(self, query: Query, filters=None):
        return []


class DummyGenerator(Generator):
    def generate(self, query: Query, context, **kwargs):
        return Answer(text="", citations=[])


def test_subclassing():
    assert issubclass(DummyParser, DocumentParser)
    assert issubclass(DummyOCREngine, OCREngine)
    assert issubclass(DummyChunker, Chunker)
    assert issubclass(DummyEmbedder, Embedder)
    assert issubclass(DummyVectorStore, VectorStore)
    assert issubclass(DummyLexicalIndex, LexicalIndex)
    assert issubclass(DummyRetriever, Retriever)
    assert issubclass(DummyGenerator, Generator)
