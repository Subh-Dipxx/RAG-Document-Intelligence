import uuid
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import json

from db.database import get_db
from db import crud
from domain.models import Document, Version
from storage.minio_client import minio_storage, RAW_DOCUMENTS_BUCKET
from workers.tasks import process_document_task
from api.schemas.document_schemas import DocumentResponse, VersionResponse

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    permissions: Optional[str] = Form("[]"),  # JSON string of permissions list
    metadata_json: Optional[str] = Form("{}"),
    db: Session = Depends(get_db),
):
    """Upload a document file, store in MinIO, create DB records, and trigger async processing job."""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Calculate file hash
    file_hash = hashlib.sha256(content).hexdigest()
    doc_id = str(uuid.uuid4())
    version_id = str(uuid.uuid4())
    file_name = file.filename or "uploaded_file"
    storage_key = f"{doc_id}/{version_id}/{file_name}"

    # Upload to MinIO
    try:
        minio_storage.upload_bytes(
            bucket_name=RAW_DOCUMENTS_BUCKET,
            object_name=storage_key,
            data=content,
            content_type=file.content_type or "application/octet-stream",
        )
    except Exception as e:
        # If MinIO upload fails in dev without running MinIO container, fallback log
        print(f"MinIO storage notice: {e}")

    # Parse JSON permissions & metadata
    try:
        perms_list = json.loads(permissions) if permissions else []
    except Exception:
        perms_list = []

    try:
        meta_dict = json.loads(metadata_json) if metadata_json else {}
    except Exception:
        meta_dict = {}

    doc_domain = Document(
        id=doc_id,
        title=title or file_name,
        file_name=file_name,
        mime_type=file.content_type,
        file_size=len(content),
        permissions=perms_list,
        metadata=meta_dict,
    )
    version_domain = Version(
        id=version_id,
        document_id=doc_id,
        version_number=1,
        storage_key=storage_key,
        file_hash=file_hash,
    )

    db_doc = crud.create_document(db, doc_domain)
    db_version = crud.create_version(db, version_domain)

    # Trigger Celery background task
    try:
        process_document_task.delay(document_id=doc_id, version_id=version_id)
    except Exception as task_err:
        print(f"Celery task trigger warning: {task_err}")

    # Reload full document from DB to include relationships
    refreshed_doc = crud.get_document(db, doc_id)
    return refreshed_doc


@router.get("", response_model=List[DocumentResponse])
def list_documents(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """List documents metadata stored in database."""
    docs = crud.list_documents(db, skip=skip, limit=limit)
    return docs


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    """Get document details including version history."""
    doc = crud.get_document(db, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db)):
    """Delete a document and its database records."""
    success = crud.delete_document(db, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return None
