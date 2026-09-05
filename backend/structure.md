rag-document-intelligence/
│
├── apps/
│   ├── web/                              # Next.js frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── dashboard/
│   │   │   ├── corpora/
│   │   │   │   ├── [corpusId]/
│   │   │   │   │   ├── documents/
│   │   │   │   │   ├── search/
│   │   │   │   │   ├── chat/
│   │   │   │   │   └── evaluations/
│   │   │   ├── admin/
│   │   │   ├── api/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx
│   │   │   │   ├── Message.tsx
│   │   │   │   ├── Citation.tsx
│   │   │   │   └── SourceTrail.tsx
│   │   │   ├── documents/
│   │   │   │   ├── DocumentViewer.tsx
│   │   │   │   ├── PageViewer.tsx
│   │   │   │   └── HighlightRegion.tsx
│   │   │   ├── ingestion/
│   │   │   │   ├── UploadDropzone.tsx
│   │   │   │   ├── JobProgress.tsx
│   │   │   │   └── FailureSummary.tsx
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── SearchFilters.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   └── evaluations/
│   │   │       ├── MetricsCard.tsx
│   │   │       ├── EvaluationTable.tsx
│   │   │       └── AblationTable.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── streaming.ts
│   │   │   └── citations.ts
│   │   │
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── public/
│   │   ├── styles/
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                              # FastAPI backend
│       ├── app/
│       │   ├── main.py
│       │   │
│       │   ├── api/                      # HTTP API surface
│       │   │   ├── deps.py
│       │   │   ├── router.py
│       │   │   └── v1/
│       │   │       ├── auth.py
│       │   │       ├── corpora.py
│       │   │       ├── documents.py
│       │   │       ├── ingestion.py
│       │   │       ├── search.py
│       │   │       ├── chat.py
│       │   │       ├── evaluations.py
│       │   │       ├── permissions.py
│       │   │       └── admin.py
│       │   │
│       │   ├── domain/                   # Core business/domain models
│       │   │   ├── entities/
│       │   │   │   ├── tenant.py
│       │   │   │   ├── corpus.py
│       │   │   │   ├── document.py
│       │   │   │   ├── document_version.py
│       │   │   │   ├── page.py
│       │   │   │   ├── chunk.py
│       │   │   │   ├── citation.py
│       │   │   │   ├── query.py
│       │   │   │   ├── job.py
│       │   │   │   └── evaluation.py
│       │   │   ├── enums.py
│       │   │   └── errors.py
│       │   │
│       │   ├── ingestion/                # Document ingestion pipeline
│       │   │   ├── pipeline.py
│       │   │   ├── detector/
│       │   │   │   ├── interface.py
│       │   │   │   └── content_detector.py
│       │   │   ├── parsers/
│       │   │   │   ├── interface.py
│       │   │   │   ├── pdf_parser.py
│       │   │   │   ├── docx_parser.py
│       │   │   │   ├── spreadsheet_parser.py
│       │   │   │   ├── presentation_parser.py
│       │   │   │   ├── html_parser.py
│       │   │   │   ├── email_parser.py
│       │   │   │   ├── image_parser.py
│       │   │   │   └── text_parser.py
│       │   │   ├── ocr/
│       │   │   │   ├── interface.py
│       │   │   │   ├── processor.py
│       │   │   │   ├── quality.py
│       │   │   │   └── routing.py
│       │   │   ├── tables/
│       │   │   │   ├── interface.py
│       │   │   │   ├── extractor.py
│       │   │   │   └── serializer.py
│       │   │   ├── layout/
│       │   │   │   ├── reading_order.py
│       │   │   │   ├── headers_footers.py
│       │   │   │   └── structure.py
│       │   │   ├── metadata/
│       │   │   │   ├── extractor.py
│       │   │   │   └── classifier.py
│       │   │   ├── deduplication/
│       │   │   │   ├── exact.py
│       │   │   │   └── near_duplicate.py
│       │   │   ├── security/
│       │   │   │   ├── injection_detector.py
│       │   │   │   └── sensitive_data.py
│       │   │   └── artifacts/
│       │   │       ├── storage.py
│       │   │       └── thumbnails.py
│       │   │
│       │   ├── chunking/                 # Chunking strategies
│       │   │   ├── interface.py
│       │   │   ├── fixed.py
│       │   │   ├── structure_aware.py
│       │   │   ├── semantic.py
│       │   │   ├── enrichment.py
│       │   │   └── parent_expansion.py
│       │   │
│       │   ├── indexing/                 # Vector + lexical indexing
│       │   │   ├── interfaces/
│       │   │   │   ├── vector_store.py
│       │   │   │   └── lexical_store.py
│       │   │   ├── vector/
│       │   │   │   ├── qdrant.py
│       │   │   │   └── faiss.py
│       │   │   ├── lexical/
│       │   │   │   └── bm25.py
│       │   │   ├── embeddings/
│       │   │   │   ├── interface.py
│       │   │   │   ├── local.py
│       │   │   │   └── hosted.py
│       │   │   ├── indexing_service.py
│       │   │   └── reindex.py
│       │   │
│       │   ├── retrieval/                # Retrieval pipeline
│       │   │   ├── query/
│       │   │   │   ├── normalizer.py
│       │   │   │   ├── expansion.py
│       │   │   │   ├── intent.py
│       │   │   │   └── decomposition.py
│       │   │   ├── dense.py
│       │   │   ├── lexical.py
│       │   │   ├── fusion.py
│       │   │   ├── reranking/
│       │   │   │   ├── interface.py
│       │   │   │   └── cross_encoder.py
│       │   │   ├── permissions.py
│       │   │   ├── diversity.py
│       │   │   ├── freshness.py
│       │   │   ├── confidence.py
│       │   │   └── retriever.py
│       │   │
│       │   ├── generation/               # Grounded answer generation
│       │   │   ├── generator.py
│       │   │   ├── interfaces/
│       │   │   │   └── generator.py
│       │   │   ├── models/
│       │   │   │   ├── local.py
│       │   │   │   └── hosted.py
│       │   │   ├── context/
│       │   │   │   ├── assembler.py
│       │   │   │   └── token_budget.py
│       │   │   ├── prompts/
│       │   │   │   ├── answer.txt
│       │   │   │   ├── comparison.txt
│       │   │   │   ├── extraction.txt
│       │   │   │   └── summarization.txt
│       │   │   ├── citation/
│       │   │   │   ├── resolver.py
│       │   │   │   └── validator.py
│       │   │   ├── faithfulness/
│       │   │   │   └── checker.py
│       │   │   └── abstention.py
│       │   │
│       │   ├── evaluation/               # Evaluation harness
│       │   │   ├── datasets/
│       │   │   │   └── golden_questions.jsonl
│       │   │   ├── retrieval_metrics.py
│       │   │   ├── answer_metrics.py
│       │   │   ├── extraction_metrics.py
│       │   │   ├── ablations.py
│       │   │   ├── regression_gate.py
│       │   │   └── runner.py
│       │   │
│       │   ├── workers/                  # Async/background jobs
│       │   │   ├── queue.py
│       │   │   ├── tasks/
│       │   │   │   ├── ingestion.py
│       │   │   │   ├── embedding.py
│       │   │   │   ├── reindex.py
│       │   │   │   └── evaluation.py
│       │   │   ├── retry.py
│       │   │   ├── dead_letter.py
│       │   │   └── cancellation.py
│       │   │
│       │   ├── infrastructure/           # External implementations
│       │   │   ├── database/
│       │   │   │   ├── session.py
│       │   │   │   ├── models/
│       │   │   │   └── repositories/
│       │   │   ├── storage/
│       │   │   │   ├── s3.py
│       │   │   │   └── local.py
│       │   │   ├── queue/
│       │   │   │   └── redis.py
│       │   │   ├── vector/
│       │   │   └── observability/
│       │   │       ├── logging.py
│       │   │       ├── tracing.py
│       │   │       └── metrics.py
│       │   │
│       │   ├── security/
│       │   │   ├── authentication.py
│       │   │   ├── authorization.py
│       │   │   ├── permissions.py
│       │   │   ├── redaction.py
│       │   │   └── tenant_isolation.py
│       │   │
│       │   ├── schemas/                   # Pydantic request/response schemas
│       │   │   ├── auth.py
│       │   │   ├── corpus.py
│       │   │   ├── document.py
│       │   │   ├── ingestion.py
│       │   │   ├── search.py
│       │   │   ├── chat.py
│       │   │   └── evaluation.py
│       │   │
│       │   ├── config/
│       │   │   └── settings.py
│       │   │
│       │   └── tests/
│       │       ├── unit/
│       │       │   ├── ingestion/
│       │       │   ├── chunking/
│       │       │   ├── retrieval/
│       │       │   └── generation/
│       │       ├── integration/
│       │       ├── security/
│       │       │   ├── test_permissions.py
│       │       │   ├── test_tenant_isolation.py
│       │       │   ├── test_deletion.py
│       │       │   └── test_prompt_injection.py
│       │       └── fixtures/
│       │
│       ├── alembic/
│       │   └── versions/
│       ├── pyproject.toml
│       └── Dockerfile
│
├── packages/                             # Shared frontend packages
│   ├── ui/
│   │   ├── components/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── types/
│   │   ├── src/
│   │   │   ├── api.ts
│   │   │   ├── citation.ts
│   │   │   └── document.ts
│   │   └── package.json
│   └── config/
│       ├── eslint/
│       ├── typescript/
│       └── package.json
│
├── data/
│   ├── seed/
│   │   ├── pdf/
│   │   ├── scanned/
│   │   ├── spreadsheets/
│   │   ├── presentations/
│   │   ├── documents/
│   │   ├── html/
│   │   ├── images/
│   │   ├── emails/
│   │   ├── archives/
│   │   └── adversarial/
│   │       ├── prompt_injection.pdf
│   │       ├── metadata_injection.pdf
│   │       ├── image_injection.png
│   │       └── table_injection.xlsx
│   │
│   ├── golden/
│   │   ├── questions.jsonl
│   │   ├── expected_answers.jsonl
│   │   └── supporting_passages.jsonl
│   │
│   └── demo/
│       └── conversation.json
│
├── scripts/
│   ├── bootstrap.sh
│   ├── seed.py
│   ├── ingest.py
│   ├── evaluate.py
│   ├── run_demo.py
│   └── cleanup.py
│
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.test.yml
│   ├── postgres/
│   ├── redis/
│   └── qdrant/
│
├── docs/
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── ingestion.md
│   │   ├── retrieval.md
│   │   └── generation.md
│   ├── security.md
│   ├── evaluation.md
│   └── processing-report.md
│
├── reports/
│   ├── evaluation/
│   └── ablations/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── evaluation.yml
│
├── .env.example
├── .gitignore
├── Makefile
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── README.md
└── docker-compose.yml