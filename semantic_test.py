from backend.chunking.semantic import SemanticChunker
from backend.domain.models import Document, Page

print("STEP 1: imports OK", flush=True)

page = Page(
    document_id="semantic-test",
    version_id="semantic-version",
    number=1,
    text=(
        "RAG systems retrieve relevant documents for a question. "
        "Semantic chunking groups related text together. "
        "The weather forecast predicts heavy rainfall tomorrow."
    ),
)

print("STEP 2: page created", flush=True)

document = Document(
    id="semantic-test",
    title="Semantic Test",
    file_name="semantic-test.pdf",
    mime_type="application/pdf",
    pages=[page],
)

print("STEP 3: document created", flush=True)

chunker = SemanticChunker(
    chunk_size=1000,
    similarity_threshold=0.70,
)

print("STEP 4: chunker created", flush=True)

chunks = chunker.chunk(document)

print("STEP 5: chunking finished", flush=True)
print("TOTAL CHUNKS:", len(chunks), flush=True)

for i, chunk in enumerate(chunks, 1):
    print(f"\n--- CHUNK {i} ---", flush=True)
    print(chunk.text, flush=True)
    print("METADATA:", chunk.metadata, flush=True)
