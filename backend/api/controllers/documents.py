import uuid
import hashlib
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
import json

from backend.database.database import get_db
from backend.auth.dependencies import AuthContext, get_auth_context
from backend.auth.dependencies import require_active_organization_access
from backend.database import crud
from backend.database.models import AccessGrantModel, TenantMembershipModel
from backend.domain.models import Document, Version
from backend.workers.tasks import process_document_task
from backend.api.schemas.document_schemas import DocumentResponse, VersionResponse
from backend.storage.minio_client import minio_storage, RAW_DOCUMENTS_BUCKET

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    permissions: Optional[str] = Form("[]"),  # JSON string of permissions list
    metadata_json: Optional[str] = Form("{}"),
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    """Upload a document file, store in MinIO, create DB records, and trigger async processing job."""
    if auth.tenant_id and auth.role != "admin":
        require_active_organization_access(db=db, auth=auth)

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
        # Never create a DB record or Celery task when the source object
        # was not successfully written to object storage.
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Document storage upload failed: {e}",
        )

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
        owner_id=auth.user_id,
        tenant_id=auth.tenant_id,
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
def list_documents(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    """List documents metadata stored in database."""
    if auth.tenant_id:
        if auth.role != "admin":
            try:
                require_active_organization_access(db=db, auth=auth)
            except HTTPException:
                return []
        docs = crud.list_documents(db, skip=skip, limit=limit, tenant_id=auth.tenant_id)
    else:
        docs = crud.list_documents(db, skip=skip, limit=limit, owner_id=auth.user_id)
    return docs


@router.get("/{document_id}/content")
def get_document_content(document_id: str, db: Session = Depends(get_db), auth: AuthContext = Depends(get_auth_context)):
    if auth.tenant_id and auth.role != "admin":
        require_active_organization_access(db=db, auth=auth)
    """Return the stored file bytes for a document."""
    from fastapi.responses import Response

    if auth.tenant_id:
        doc = crud.get_document(db, document_id, tenant_id=auth.tenant_id)
    else:
        doc = crud.get_document(db, document_id, owner_id=auth.user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    versions = crud.get_versions(db, document_id)
    if not versions:
        raise HTTPException(status_code=404, detail="Document version not found")

    version = versions[0]

    try:
        content = minio_storage.download_bytes(
            bucket_name=RAW_DOCUMENTS_BUCKET,
            object_name=version.storage_key,
        )
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Document content could not be retrieved: {e}",
        )

    return Response(
        content=content,
        media_type=doc.mime_type or "application/octet-stream",
        headers={
            "Content-Disposition": f'inline; filename="{doc.file_name}"'
        },
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db), auth: AuthContext = Depends(get_auth_context)):
    if auth.tenant_id and auth.role != "admin":
        require_active_organization_access(db=db, auth=auth)
    """Get document details including version history."""
    if auth.tenant_id:
        doc = crud.get_document(db, document_id, tenant_id=auth.tenant_id)
    else:
        doc = crud.get_document(db, document_id, owner_id=auth.user_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: str, db: Session = Depends(get_db), auth: AuthContext = Depends(get_auth_context)):
    """Delete a document and its database records."""
    if auth.tenant_id and auth.role != "admin":
        require_active_organization_access(db=db, auth=auth)

    if auth.tenant_id:
        if auth.role != "admin":
            membership = (
                db.query(TenantMembershipModel)
                .filter(
                    TenantMembershipModel.tenant_id == auth.tenant_id,
                    TenantMembershipModel.user_id == auth.user_id,
                )
                .first()
            )

            if not membership:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are no longer a member of this organization",
                )

            delete_grant = (
                db.query(AccessGrantModel)
                .filter(
                    AccessGrantModel.tenant_id == auth.tenant_id,
                    AccessGrantModel.document_id == document_id,
                    AccessGrantModel.principal == auth.user_id,
                    AccessGrantModel.role == "delete",
                )
                .first()
            )

            if not delete_grant:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access required to delete this document",
                )

        success = crud.delete_document(
            db,
            document_id,
            actor_id=auth.user_id,
            tenant_id=auth.tenant_id,
        )
    else:
        success = crud.delete_document(
            db,
            document_id,
            owner_id=auth.user_id,
        )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
