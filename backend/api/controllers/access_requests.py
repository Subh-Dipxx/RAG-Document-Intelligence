from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth.dependencies import AuthContext, get_auth_context
from backend.database.database import get_db
from backend.database.models import (
    AccessGrantModel,
    AccessRequestModel,
    DocumentModel,
    TenantMembershipModel,
    UserModel,
    utc_now,
)
from backend.domain.models import Role


router = APIRouter(
    prefix="/access-requests",
    tags=["access-requests"],
)


class AccessRequestCreate(BaseModel):
    document_id: str


class AccessRequestResponse(BaseModel):
    id: str
    tenant_id: str
    document_id: str
    document_name: str
    requester_id: str
    requester_username: str
    requested_role: str
    status: str
    created_at: datetime | None = None
    resolved_at: datetime | None = None
    resolved_by: str | None = None


def require_organization(auth: AuthContext):
    if not auth.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization access is required",
        )


def serialize_request(
    db: Session,
    request: AccessRequestModel,
) -> AccessRequestResponse:
    document = (
        db.query(DocumentModel)
        .filter(DocumentModel.id == request.document_id)
        .first()
    )

    requester = (
        db.query(UserModel)
        .filter(UserModel.id == request.requester_id)
        .first()
    )

    return AccessRequestResponse(
        id=request.id,
        tenant_id=request.tenant_id,
        document_id=request.document_id,
        document_name=(
            document.title
            or document.file_name
            or request.document_id
        ) if document else request.document_id,
        requester_id=request.requester_id,
        requester_username=(
            requester.username
            if requester
            else request.requester_id
        ),
        requested_role=request.requested_role,
        status=request.status,
        created_at=request.created_at,
        resolved_at=request.resolved_at,
        resolved_by=request.resolved_by,
    )


@router.post(
    "",
    response_model=AccessRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_access_request(
    payload: AccessRequestCreate,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization(auth)

    if auth.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization admins already have delete access",
        )

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
            detail="You must belong to this organization before requesting document access",
        )

    document = (
        db.query(DocumentModel)
        .filter(
            DocumentModel.id == payload.document_id,
            DocumentModel.tenant_id == auth.tenant_id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    existing_grant = (
        db.query(AccessGrantModel)
        .filter(
            AccessGrantModel.tenant_id == auth.tenant_id,
            AccessGrantModel.document_id == payload.document_id,
            AccessGrantModel.principal == auth.user_id,
            AccessGrantModel.role == Role.DELETE.value,
        )
        .first()
    )

    if existing_grant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Delete access has already been granted",
        )

    existing_request = (
        db.query(AccessRequestModel)
        .filter(
            AccessRequestModel.tenant_id == auth.tenant_id,
            AccessRequestModel.document_id == payload.document_id,
            AccessRequestModel.requester_id == auth.user_id,
            AccessRequestModel.requested_role == Role.DELETE.value,
            AccessRequestModel.status == "pending",
        )
        .first()
    )

    if existing_request:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Access request is already pending",
        )

    request = AccessRequestModel(
        tenant_id=auth.tenant_id,
        document_id=payload.document_id,
        requester_id=auth.user_id,
        requested_role=Role.DELETE.value,
        status="pending",
    )

    db.add(request)
    db.commit()
    db.refresh(request)

    return serialize_request(db, request)


@router.get(
    "",
    response_model=List[AccessRequestResponse],
)
def list_access_requests(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization(auth)

    query = db.query(AccessRequestModel).filter(
        AccessRequestModel.tenant_id == auth.tenant_id
    )

    if auth.role == "admin":
        query = query.filter(
            AccessRequestModel.status == "pending"
        )
    else:
        query = query.filter(
            AccessRequestModel.requester_id == auth.user_id
        )

    requests = (
        query
        .order_by(AccessRequestModel.created_at.desc())
        .all()
    )

    return [
        serialize_request(db, request)
        for request in requests
    ]


@router.post(
    "/{request_id}/approve",
    response_model=AccessRequestResponse,
)
def approve_access_request(
    request_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization(auth)

    if auth.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization admin access required",
        )

    request = (
        db.query(AccessRequestModel)
        .filter(
            AccessRequestModel.id == request_id,
            AccessRequestModel.tenant_id == auth.tenant_id,
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found",
        )

    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Access request is already {request.status}",
        )

    requester_membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == request.tenant_id,
            TenantMembershipModel.user_id == request.requester_id,
        )
        .first()
    )

    if not requester_membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is no longer a member of the organization",
        )

    document = (
        db.query(DocumentModel)
        .filter(
            DocumentModel.id == request.document_id,
            DocumentModel.tenant_id == auth.tenant_id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    existing_grant = (
        db.query(AccessGrantModel)
        .filter(
            AccessGrantModel.tenant_id == auth.tenant_id,
            AccessGrantModel.document_id == request.document_id,
            AccessGrantModel.principal == request.requester_id,
            AccessGrantModel.role == request.requested_role,
        )
        .first()
    )

    if not existing_grant:
        db.add(
            AccessGrantModel(
                tenant_id=auth.tenant_id,
                document_id=request.document_id,
                principal=request.requester_id,
                role=request.requested_role,
            )
        )

    request.status = "approved"
    request.resolved_at = utc_now()
    request.resolved_by = auth.user_id

    db.commit()
    db.refresh(request)

    return serialize_request(db, request)


@router.post(
    "/{request_id}/reject",
    response_model=AccessRequestResponse,
)
def reject_access_request(
    request_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization(auth)

    if auth.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization admin access required",
        )

    request = (
        db.query(AccessRequestModel)
        .filter(
            AccessRequestModel.id == request_id,
            AccessRequestModel.tenant_id == auth.tenant_id,
        )
        .first()
    )

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Access request not found",
        )

    if request.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Access request is already {request.status}",
        )

    request.status = "rejected"
    request.resolved_at = utc_now()
    request.resolved_by = auth.user_id

    db.commit()
    db.refresh(request)

    return serialize_request(db, request)
