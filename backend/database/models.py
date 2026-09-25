import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from backend.database.database import Base


def utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class UserModel(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, nullable=False, unique=True, index=True)
    email = Column(String, nullable=True, unique=True, index=True)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=utc_now)


class PasswordResetTokenModel(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = Column(String, nullable=False, unique=True, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class TenantMembershipModel(Base):
    __tablename__ = "tenant_memberships"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_tenant_membership_user"),
        Index("ix_tenant_memberships_user", "user_id"),
        Index("ix_tenant_memberships_tenant", "tenant_id"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False, default="member")
    # Organization document access is granted only after an admin invitation is accepted.
    access_status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=utc_now)


class OrganizationInvitationModel(Base):
    __tablename__ = "organization_invitations"
    __table_args__ = (
        Index("ix_org_invitations_invitee", "invitee_user_id"),
        Index("ix_org_invitations_tenant", "tenant_id"),
        Index("ix_org_invitations_status", "status"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    invitee_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invited_by_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=utc_now)
    responded_at = Column(DateTime, nullable=True)


class TenantModel(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    quota_documents = Column(Integer, nullable=True)
    quota_pages = Column(Integer, nullable=True)
    quota_storage_bytes = Column(Integer, nullable=True)
    forbid_external = Column(Boolean, nullable=False, default=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    corpora = relationship("CorpusModel", back_populates="tenant", cascade="all, delete-orphan")


class CorpusModel(Base):
    __tablename__ = "corpora"

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    forbid_external = Column(Boolean, nullable=False, default=False)
    chunker_type = Column(String, nullable=True)
    embedding_model = Column(String, nullable=True)
    embedding_dim = Column(Integer, nullable=True)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    tenant = relationship("TenantModel", back_populates="corpora")
    documents = relationship("DocumentModel", back_populates="corpus")


class AccessGrantModel(Base):
    __tablename__ = "access_grants"
    __table_args__ = (Index("ix_access_grants_principal", "principal"),)

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    corpus_id = Column(String, ForeignKey("corpora.id", ondelete="CASCADE"), nullable=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    principal = Column(String, nullable=False)
    role = Column(String, nullable=False, default="viewer")


class AccessRequestModel(Base):
    __tablename__ = "access_requests"
    __table_args__ = (
        Index("ix_access_requests_tenant", "tenant_id"),
        Index("ix_access_requests_document", "document_id"),
        Index("ix_access_requests_requester", "requester_id"),
        Index("ix_access_requests_status", "status"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    requester_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    requested_role = Column(String, nullable=False, default="delete")
    status = Column(String, nullable=False, default="pending")
    created_at = Column(DateTime, default=utc_now)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    owner_id = Column(String, nullable=True, index=True)
    tenant_id = Column(String, ForeignKey("tenants.id", ondelete="SET NULL"), nullable=True, index=True)
    corpus_id = Column(String, ForeignKey("corpora.id", ondelete="SET NULL"), nullable=True, index=True)
    folder_id = Column(String, nullable=True)
    detected_mime_type = Column(String, nullable=True)
    language = Column(String, nullable=True)
    content_hash = Column(String, nullable=True, index=True)
    near_dup_fingerprint = Column(String, nullable=True, index=True)
    current_version_id = Column(String, nullable=True)
    forbid_external = Column(Boolean, nullable=False, default=False)
    permissions = Column(JSON, default=list)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    corpus = relationship("CorpusModel", back_populates="documents")
    versions = relationship("VersionModel", back_populates="document", cascade="all, delete-orphan")
    pages = relationship("PageModel", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("ChunkModel", back_populates="document", cascade="all, delete-orphan")
    citations = relationship("CitationModel", back_populates="document", cascade="all, delete-orphan")
    tables = relationship("TableModel", back_populates="document", cascade="all, delete-orphan")
    findings = relationship("FindingModel", back_populates="document", cascade="all, delete-orphan")
    jobs = relationship("JobModel", back_populates="document")


class VersionModel(Base):
    __tablename__ = "document_versions"
    __table_args__ = (
        UniqueConstraint("document_id", "version_number", name="uq_document_version_number"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, default=1)
    storage_key = Column(String, nullable=True)
    file_hash = Column(String, nullable=True, index=True)
    is_current = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=utc_now)
    metadata_json = Column(JSON, default=dict)

    document = relationship("DocumentModel", back_populates="versions")
    pages = relationship("PageModel", back_populates="version", cascade="all, delete-orphan")
    chunks = relationship("ChunkModel", back_populates="version", cascade="all, delete-orphan")


class PageModel(Base):
    __tablename__ = "pages"
    __table_args__ = (
        Index("ix_pages_document_version_number", "document_id", "version_id", "page_number"),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_id = Column(String, ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    image_storage_key = Column(String, nullable=True)
    thumbnail_storage_key = Column(String, nullable=True)
    origin = Column(String, nullable=False, default="extracted")
    is_generated = Column(Boolean, nullable=False, default=False)
    ocr_confidence = Column(Float, nullable=True)
    low_confidence = Column(Boolean, nullable=False, default=False)
    language = Column(String, nullable=True)
    reading_order = Column(JSON, default=list)
    metadata_json = Column(JSON, default=dict)

    document = relationship("DocumentModel", back_populates="pages")
    version = relationship("VersionModel", back_populates="pages")


class ChunkModel(Base):
    __tablename__ = "chunks"
    __table_args__ = (Index("ix_chunks_document_version", "document_id", "version_id"),)

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    version_id = Column(String, ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=True)
    page_number = Column(Integer, nullable=True)
    page_start = Column(Integer, nullable=True)
    page_end = Column(Integer, nullable=True)
    text = Column(Text, nullable=False)
    start_offset = Column(Integer, nullable=True)
    end_offset = Column(Integer, nullable=True)
    tokens = Column(Integer, nullable=True)
    origin = Column(String, nullable=False, default="extracted")
    source_type = Column(String, nullable=False, default="text_layer")
    structural_label = Column(String, nullable=False, default="body")
    is_generated = Column(Boolean, nullable=False, default=False)
    extraction_confidence = Column(Float, nullable=True)
    section_breadcrumb = Column(String, nullable=True)
    contextual_prefix = Column(Text, nullable=True)
    parent_chunk_id = Column(String, nullable=True)
    content_hash = Column(String, nullable=True, index=True)
    embedding_id = Column(String, nullable=True)
    embedding_model = Column(String, nullable=True)
    embedding = Column(Vector(384), nullable=True)
    metadata_json = Column(JSON, default=dict)

    document = relationship("DocumentModel", back_populates="chunks")
    version = relationship("VersionModel", back_populates="chunks")


class TableModel(Base):
    __tablename__ = "extracted_tables"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_id = Column(String, ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    page_start = Column(Integer, nullable=False)
    page_end = Column(Integer, nullable=False)
    caption = Column(String, nullable=True)
    headers = Column(JSON, default=list)
    rows = Column(JSON, default=list)
    serialization = Column(Text, nullable=False, default="")
    storage_key = Column(String, nullable=True)
    is_generated = Column(Boolean, nullable=False, default=False)
    metadata_json = Column(JSON, default=dict)

    document = relationship("DocumentModel", back_populates="tables")


class JobModel(Base):
    __tablename__ = "ingestion_jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, nullable=True, index=True)
    corpus_id = Column(String, nullable=True, index=True)
    document_id = Column(String, ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    version_id = Column(String, nullable=True)
    state = Column(String, nullable=False, default="queued", index=True)
    last_committed_page = Column(Integer, nullable=False, default=0)
    last_committed_chunk = Column(String, nullable=True)
    attempt = Column(Integer, nullable=False, default=0)
    error = Column(Text, nullable=True)
    cancel_requested = Column(Boolean, nullable=False, default=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    document = relationship("DocumentModel", back_populates="jobs")


class FindingModel(Base):
    __tablename__ = "findings"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_id = Column(String, nullable=True)
    page = Column(Integer, nullable=True)
    chunk_id = Column(String, nullable=True)
    kind = Column(String, nullable=False)
    label = Column(String, nullable=False)
    start_offset = Column(Integer, nullable=True)
    end_offset = Column(Integer, nullable=True)
    redacted = Column(Boolean, nullable=False, default=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    document = relationship("DocumentModel", back_populates="findings")


class CitationModel(Base):
    __tablename__ = "citations"

    id = Column(String, primary_key=True, default=generate_uuid)
    source = Column(String, nullable=False)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    version_id = Column(String, ForeignKey("document_versions.id", ondelete="SET NULL"), nullable=True)
    chunk_id = Column(String, ForeignKey("chunks.id", ondelete="SET NULL"), nullable=True)
    page = Column(Integer, nullable=True)
    excerpt = Column(Text, nullable=True)
    start_offset = Column(Integer, nullable=True)
    end_offset = Column(Integer, nullable=True)
    is_generated = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=utc_now)

    document = relationship("DocumentModel", back_populates="citations")


class QueryLogModel(Base):
    __tablename__ = "query_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    query_text = Column(Text, nullable=False)
    user_id = Column(String, nullable=True, index=True)
    tenant_id = Column(String, nullable=True, index=True)
    corpus_id = Column(String, nullable=True, index=True)
    permissions = Column(JSON, default=list)
    filters = Column(JSON, default=dict)
    retrieved_ids = Column(JSON, default=list)
    document_version_ids = Column(JSON, default=list)
    answer_id = Column(String, nullable=True)
    abstained = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=utc_now)


class DeletionAuditModel(Base):
    __tablename__ = "deletion_audit"

    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, nullable=True, index=True)
    corpus_id = Column(String, nullable=True)
    document_id = Column(String, nullable=False, index=True)
    actor_id = Column(String, nullable=True)
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class EvalResultModel(Base):
    __tablename__ = "eval_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    query_text = Column(Text, nullable=False)
    query_filters = Column(JSON, default=dict)
    query_permissions = Column(JSON, default=list)
    retrieved_ids = Column(JSON, default=list)
    score = Column(Float, nullable=True)
    correct = Column(Boolean, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class ChatConversationModel(Base):
    __tablename__ = "chat_conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = Column(String, nullable=True)
    document_id = Column(
        String,
        ForeignKey("documents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    user = relationship("UserModel")
    document = relationship("DocumentModel")
    messages = relationship(
        "ChatMessageModel",
        back_populates="conversation",
        cascade="all, delete-orphan",
    )


class ChatMessageModel(Base):
    __tablename__ = "chat_messages"
    __table_args__ = (
        Index(
            "ix_chat_messages_conversation_created",
            "conversation_id",
            "created_at",
        ),
    )

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(
        String,
        ForeignKey("chat_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    citations = Column(JSON, default=list)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)

    conversation = relationship(
        "ChatConversationModel",
        back_populates="messages",
    )
