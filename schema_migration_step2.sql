BEGIN;

-- ============================================================
-- documents
-- ============================================================

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS owner_id VARCHAR,
    ADD COLUMN IF NOT EXISTS tenant_id VARCHAR,
    ADD COLUMN IF NOT EXISTS corpus_id VARCHAR,
    ADD COLUMN IF NOT EXISTS folder_id VARCHAR,
    ADD COLUMN IF NOT EXISTS detected_mime_type VARCHAR,
    ADD COLUMN IF NOT EXISTS language VARCHAR,
    ADD COLUMN IF NOT EXISTS content_hash VARCHAR,
    ADD COLUMN IF NOT EXISTS near_dup_fingerprint VARCHAR,
    ADD COLUMN IF NOT EXISTS current_version_id VARCHAR,
    ADD COLUMN IF NOT EXISTS forbid_external BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================================
-- document_versions
-- ============================================================

ALTER TABLE document_versions
    ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT TRUE;

-- ============================================================
-- pages
-- ============================================================

ALTER TABLE pages
    ADD COLUMN IF NOT EXISTS thumbnail_storage_key VARCHAR,
    ADD COLUMN IF NOT EXISTS origin VARCHAR,
    ADD COLUMN IF NOT EXISTS is_generated BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS ocr_confidence DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS low_confidence BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS language VARCHAR,
    ADD COLUMN IF NOT EXISTS reading_order INTEGER;

-- ============================================================
-- chunks
-- ============================================================

ALTER TABLE chunks
    ADD COLUMN IF NOT EXISTS page_start INTEGER,
    ADD COLUMN IF NOT EXISTS page_end INTEGER,
    ADD COLUMN IF NOT EXISTS origin VARCHAR,
    ADD COLUMN IF NOT EXISTS source_type VARCHAR,
    ADD COLUMN IF NOT EXISTS structural_label VARCHAR,
    ADD COLUMN IF NOT EXISTS is_generated BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS extraction_confidence DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS section_breadcrumb VARCHAR,
    ADD COLUMN IF NOT EXISTS contextual_prefix TEXT,
    ADD COLUMN IF NOT EXISTS parent_chunk_id VARCHAR,
    ADD COLUMN IF NOT EXISTS content_hash VARCHAR,
    ADD COLUMN IF NOT EXISTS embedding_id VARCHAR,
    ADD COLUMN IF NOT EXISTS embedding_model VARCHAR,
    ADD COLUMN IF NOT EXISTS embedding vector(384);

-- ============================================================
-- Indexes required by the current models
-- ============================================================

CREATE INDEX IF NOT EXISTS ix_documents_owner_id
    ON documents(owner_id);

CREATE INDEX IF NOT EXISTS ix_documents_tenant_id
    ON documents(tenant_id);

CREATE INDEX IF NOT EXISTS ix_documents_corpus_id
    ON documents(corpus_id);

CREATE INDEX IF NOT EXISTS ix_documents_content_hash
    ON documents(content_hash);

CREATE INDEX IF NOT EXISTS ix_documents_near_dup_fingerprint
    ON documents(near_dup_fingerprint);

CREATE INDEX IF NOT EXISTS ix_chunks_document_version
    ON chunks(document_id, version_id);

COMMIT;
