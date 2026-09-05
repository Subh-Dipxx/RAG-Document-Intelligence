"""Re-export SQLAlchemy models from ``db.models`` (single schema)."""
from db.models import *  # noqa: F401,F403
import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Float,
    Boolean,
)
from sqlalchemy.orm import relationship
from postgres.database import Base


def utc_now():
    return datetime.now(timezone.utc)


def generate_uuid():
    return str(uuid.uuid4())


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    mime_type = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    permissions = Column(JSON, default=list)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    versions = relationship("VersionModel", back_populates="document", cascade="all, delete-orphan")
    pages = relationship("PageModel", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("ChunkModel", back_populates="document", cascade="all, delete-orphan")


class VersionModel(Base):
    __tablename__ = "document_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, default=1)
    storage_key = Column(String, nullable=True)
    file_hash = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    metadata_json = Column(JSON, default=dict)

    document = relationship("DocumentModel", back_populates="versions")
    pages = relationship("PageModel", back_populates="version", cascade="all, delete-orphan")
    chunks = relationship("ChunkModel", back_populates="version", cascade="all, delete-orphan")


class PageModel(Base):
    __tablename__ = "pages"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_id = Column(String, ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    image_storage_key = Column(String, nullable=True)
    metadata_json = Column(JSON, default=dict)

    document = relationship("DocumentModel", back_populates="pages")
    version = relationship("VersionModel", back_populates="pages")


class ChunkModel(Base):
    __tablename__ = "chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=True)
    version_id = Column(String, ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=True)
    page_number = Column(Integer, nullable=True)
    text = Column(Text, nullable=False)
    start_offset = Column(Integer, nullable=True)
    end_offset = Column(Integer, nullable=True)
    tokens = Column(Integer, nullable=True)
    metadata_json = Column(JSON, default=dict)

    document = relationship("DocumentModel", back_populates="chunks")
    version = relationship("VersionModel", back_populates="chunks")


class EvalResultModel(Base):
    __tablename__ = "eval_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    query_text = Column(Text, nullable=False)
    query_filters = Column(JSON, default=dict)
    retrieved_ids = Column(JSON, default=list)
    score = Column(Float, nullable=True)
    correct = Column(Boolean, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
