from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from backend.auth.dependencies import AuthContext, get_auth_context
from backend.auth.security import verify_password, create_access_token, hash_password
from backend.database.database import get_db
from backend.database.models import (
    TenantModel,
    TenantMembershipModel,
    OrganizationInvitationModel,
    AccessGrantModel,
    AccessRequestModel,
    UserModel,
)


router = APIRouter(
    prefix="/account-management",
    tags=["account-management"],
)


class DeleteOrganizationRequest(BaseModel):
    password: str = Field(min_length=1)
    admin_user_id: str | None = None


def _require_authenticated_user(
    db: Session,
    auth: AuthContext,
) -> UserModel:
    user = (
        db.query(UserModel)
        .filter(
            UserModel.id == auth.user_id,
            UserModel.is_active.is_(True),
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user account was not found",
        )

    return user


@router.get("/organizations")
def list_admin_organizations(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    """
    Return organizations in which the authenticated user is an admin.

    This deliberately ignores the tenant_id in the current JWT so an admin
    can manage another organization without switching the active session.
    """
    _require_authenticated_user(db, auth)

    rows = (
        db.query(TenantModel, TenantMembershipModel)
        .join(
            TenantMembershipModel,
            TenantMembershipModel.tenant_id == TenantModel.id,
        )
        .filter(
            TenantMembershipModel.user_id == auth.user_id,
            TenantMembershipModel.role == "admin",
            TenantMembershipModel.access_status == "active",
        )
        .order_by(TenantModel.name.asc())
        .all()
    )

    return [
        {
            "organization_id": tenant.id,
            "organization_name": tenant.name,
            "role": membership.role,
        }
        for tenant, membership in rows
    ]



@router.get("/accounts")
def list_switchable_accounts(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    """
    Return active organization accounts that use the same email address
    as the currently authenticated administrator.

    This endpoint is intentionally restricted to administrators.
    """

    current_user = _require_authenticated_user(db, auth)

    if auth.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can switch accounts.",
        )

    if not current_user.email:
        return []

    users = (
        db.query(UserModel)
        .filter(
            UserModel.email.ilike(current_user.email.strip()),
            UserModel.is_active.is_(True),
        )
        .order_by(UserModel.username.asc())
        .all()
    )

    accounts = []

    for user in users:
        memberships = (
            db.query(TenantMembershipModel, TenantModel)
            .join(
                TenantModel,
                TenantMembershipModel.tenant_id == TenantModel.id,
            )
            .filter(
                TenantMembershipModel.user_id == user.id,
                TenantMembershipModel.role == "admin",
                TenantMembershipModel.access_status == "active",
            )
            .order_by(TenantModel.name.asc())
            .all()
        )

        for membership, tenant in memberships:
            accounts.append(
                {
                    "user_id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "account_type": "organization",
                    "organization_id": tenant.id,
                    "organization_name": tenant.name,
                    "role": membership.role,
                    "current": user.id == current_user.id
                    and tenant.id == auth.tenant_id,
                }
            )

    return accounts


@router.post("/switch")
def switch_account(
    payload: dict,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    """
    Switch between organization accounts belonging to the same email identity.

    No password is required because the current authenticated administrator
    session is used to authorize the switch.
    """

    current_user = _require_authenticated_user(db, auth)

    if auth.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can switch accounts.",
        )

    organization_id = str(payload.get("organization_id") or "").strip()

    if not organization_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization ID is required.",
        )

    target = (
        db.query(UserModel, TenantMembershipModel, TenantModel)
        .join(
            TenantMembershipModel,
            TenantMembershipModel.user_id == UserModel.id,
        )
        .join(
            TenantModel,
            TenantMembershipModel.tenant_id == TenantModel.id,
        )
        .filter(
            UserModel.email.ilike(current_user.email.strip()),
            UserModel.is_active.is_(True),
            TenantMembershipModel.tenant_id == organization_id,
            TenantMembershipModel.role == "admin",
            TenantMembershipModel.access_status == "active",
        )
        .first()
    )

    if not target:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to switch to this organization account.",
        )

    target_user, membership, tenant = target

    access_token = create_access_token(
        user_id=target_user.id,
        username=target_user.username,
        tenant_id=tenant.id,
        role=membership.role,
        account_type="organization",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": target_user.username,
        "tenant_id": tenant.id,
        "role": membership.role,
        "account_type": "organization",
        "organization_id": tenant.id,
        "organization_name": tenant.name,
    }


@router.delete("/organizations/{organization_id}")
def delete_organization(
    organization_id: str,
    payload: DeleteOrganizationRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    """
    Delete an organization while keeping the current login/session active.

    Security requirements:
    1. Current authenticated user must be an admin of the target organization.
    2. The target organization's admin account password must be supplied.
    3. The target admin account itself is NOT deleted.
    4. The current JWT/session is NOT changed.
    5. The organization currently represented by the JWT cannot be deleted.
    """

    current_user = _require_authenticated_user(db, auth)

    if auth.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can delete organizations.",
        )

    if auth.tenant_id and auth.tenant_id == organization_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "You cannot delete the organization currently active in your "
                "session. Switch to another organization first."
            ),
        )

    tenant = (
        db.query(TenantModel)
        .filter(TenantModel.id == organization_id)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    membership_query = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == organization_id,
            TenantMembershipModel.role == "admin",
            TenantMembershipModel.access_status == "active",
        )
    )

    if payload.admin_user_id:
        membership_query = membership_query.filter(
            TenantMembershipModel.user_id == payload.admin_user_id
        )
    else:
        membership_query = membership_query.filter(
            TenantMembershipModel.user_id == auth.user_id
        )

    target_membership = membership_query.first()

    if not target_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this organization.",
        )

    target_admin = (
        db.query(UserModel)
        .filter(
            UserModel.id == target_membership.user_id,
            UserModel.is_active.is_(True),
        )
        .first()
    )

    if not target_admin:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization administrator account not found",
        )

    if not current_user.email or not target_admin.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This organization account cannot be deleted from the current session.",
        )

    if current_user.email.strip().casefold() != target_admin.email.strip().casefold():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete organization accounts belonging to the same email identity.",
        )

    if not verify_password(payload.password, target_admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The organization administrator password is incorrect",
        )

    # Import storage/model classes locally so this controller remains
    # compatible with the existing model module structure.
    from backend.database.models import (
        DocumentModel,
        VersionModel,
        PageModel,
        TableModel,
        JobModel,
        QueryLogModel,
        DeletionAuditModel,
    )
    from backend.storage.minio_client import (
        minio_storage,
        RAW_DOCUMENTS_BUCKET,
        PAGE_IMAGES_BUCKET,
        OCR_OUTPUT_BUCKET,
        TABLES_BUCKET,
        THUMBNAILS_BUCKET,
    )

    # ---------------------------------------------------------------
    # 1. Collect all tenant documents and their storage references
    #    before deleting database records.
    # ---------------------------------------------------------------
    documents = (
        db.query(DocumentModel)
        .filter(DocumentModel.tenant_id == organization_id)
        .all()
    )

    document_ids = [document.id for document in documents]

    storage_objects = []

    if document_ids:
        versions = (
            db.query(VersionModel)
            .filter(VersionModel.document_id.in_(document_ids))
            .all()
        )

        for version in versions:
            if version.storage_key:
                storage_objects.append(
                    (RAW_DOCUMENTS_BUCKET, version.storage_key)
                )

        pages = (
            db.query(PageModel)
            .filter(PageModel.document_id.in_(document_ids))
            .all()
        )

        for page in pages:
            if page.image_storage_key:
                storage_objects.append(
                    (PAGE_IMAGES_BUCKET, page.image_storage_key)
                )

            if page.thumbnail_storage_key:
                storage_objects.append(
                    (THUMBNAILS_BUCKET, page.thumbnail_storage_key)
                )

        tables = (
            db.query(TableModel)
            .filter(TableModel.document_id.in_(document_ids))
            .all()
        )

        for table in tables:
            if table.storage_key:
                storage_objects.append(
                    (TABLES_BUCKET, table.storage_key)
                )

    # ---------------------------------------------------------------
    # 2. Delete tenant-owned MinIO objects.
    #
    # Storage deletion happens before the DB commit. If storage cleanup
    # fails, the database transaction is rolled back and the organization
    # remains intact instead of becoming partially deleted.
    # ---------------------------------------------------------------
    storage_failures = []

    for bucket, object_name in storage_objects:
        try:
            minio_storage.delete_object(bucket, object_name)
        except Exception as exc:
            storage_failures.append(
                f"{bucket}/{object_name}: {exc}"
            )

    if storage_failures:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "Organization deletion was stopped because one or more "
                "stored document objects could not be removed."
            ),
        )

    # ---------------------------------------------------------------
    # 3. Remove tenant-scoped authorization/access records.
    # ---------------------------------------------------------------
    db.query(AccessRequestModel).filter(
        AccessRequestModel.tenant_id == organization_id
    ).delete(synchronize_session=False)

    db.query(AccessGrantModel).filter(
        AccessGrantModel.tenant_id == organization_id
    ).delete(synchronize_session=False)

    db.query(OrganizationInvitationModel).filter(
        OrganizationInvitationModel.tenant_id == organization_id
    ).delete(synchronize_session=False)

    # ---------------------------------------------------------------
    # 4. Remove tenant-scoped operational/history records that do not
    #    have database-level tenant foreign keys.
    # ---------------------------------------------------------------
    db.query(JobModel).filter(
        JobModel.tenant_id == organization_id
    ).delete(synchronize_session=False)

    db.query(QueryLogModel).filter(
        QueryLogModel.tenant_id == organization_id
    ).delete(synchronize_session=False)

    db.query(DeletionAuditModel).filter(
        DeletionAuditModel.tenant_id == organization_id
    ).delete(synchronize_session=False)

    # ---------------------------------------------------------------
    # 5. Remove organization memberships.
    #
    # User accounts themselves are deliberately preserved because a user
    # may belong to other organizations or have other accounts.
    # ---------------------------------------------------------------
    db.query(TenantMembershipModel).filter(
        TenantMembershipModel.tenant_id == organization_id
    ).delete(synchronize_session=False)

    # ---------------------------------------------------------------
    # 6. Delete organization documents.
    #
    # Document relationships cascade to versions/pages/chunks/tables/
    # findings/citations. The tenant/corpus rows are then removed when
    # the organization is deleted.
    # ---------------------------------------------------------------
    if document_ids:
        db.query(DocumentModel).filter(
            DocumentModel.id.in_(document_ids)
        ).delete(synchronize_session=False)

    # ---------------------------------------------------------------
    # 7. Delete the organization.
    #
    # Tenant -> Corpus is configured with delete-orphan/cascade, so the
    # organization's corpora are removed as part of this operation.
    # ---------------------------------------------------------------
    organization_name = tenant.name

    db.delete(tenant)
    db.commit()

    return {
        "message": "Organization deleted successfully",
        "organization_id": organization_id,
        "organization_name": organization_name,
        "session_preserved": True,
    }


class AddAccountRequest(BaseModel):
    account_type: str = Field(min_length=1)
    username: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)
    confirm_password: str = Field(min_length=1)
    organization_name: str | None = None


@router.post("/accounts", status_code=status.HTTP_201_CREATED)
def add_account(
    payload: AddAccountRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    """
    Create an additional independent account while keeping the current
    authenticated session unchanged.

    The email address may already belong to another account.
    Usernames remain globally unique.
    """

    _require_authenticated_user(db, auth)

    if auth.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization administrators can add accounts.",
        )

    account_type = payload.account_type.strip().lower()
    username = payload.username.strip()
    email = payload.email.strip().lower()

    if account_type != "organization":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Additional accounts must be organization accounts",
        )

    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty",
        )

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email cannot be empty",
        )

    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    existing_username = (
        db.query(UserModel)
        .filter(UserModel.username == username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken",
        )

    if account_type == "organization":
        organization_name = (payload.organization_name or "").strip()

        if not organization_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organization name is required for organization accounts",
            )

        existing_organization = (
            db.query(TenantModel)
            .filter(TenantModel.name == organization_name)
            .first()
        )

        if existing_organization:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "An organization with this name already exists. "
                    "Use organization membership/invitation instead."
                ),
            )

    else:
        organization_name = None

    user = UserModel(
        username=username,
        email=email,
        password_hash=hash_password(payload.password),
        is_active=True,
    )

    db.add(user)
    db.flush()

    organization_id = None
    role = None

    if account_type == "organization":
        tenant = TenantModel(
            name=organization_name,
        )
        db.add(tenant)
        db.flush()

        membership = TenantMembershipModel(
            tenant_id=tenant.id,
            user_id=user.id,
            role="admin",
            access_status="active",
        )
        db.add(membership)

        organization_id = tenant.id
        role = "admin"

    db.commit()

    return {
        "message": (
            "Organization account created successfully"
            if account_type == "organization"
            else "Individual account created successfully"
        ),
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "account_type": account_type,
        "organization_id": organization_id,
        "organization_name": organization_name,
        "role": role,
        "session_preserved": True,
    }
