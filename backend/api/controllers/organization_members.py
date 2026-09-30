from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.auth.dependencies import AuthContext, get_auth_context
from backend.auth.security import create_access_token, verify_password
from backend.database.models import (
    AccessGrantModel,
    AccessRequestModel,
    OrganizationInvitationModel,
    TenantModel,
)
from datetime import datetime, timezone
from backend.database.database import get_db
from backend.database.models import (
    AccessGrantModel,
    AccessRequestModel,
    TenantMembershipModel,
    UserModel,
)


router = APIRouter(
    prefix="/organization-members",
    tags=["organization-members"],
)


class InviteMemberRequest(BaseModel):
    email: str


class UpdateOrganizationNameRequest(BaseModel):
    organization_name: str
    current_password: str


class OrganizationMemberResponse(BaseModel):
    user_id: str
    username: str
    email: str | None = None
    role: str
    access_status: str = "pending"


class OrganizationContextResponse(BaseModel):
    organization_id: str
    organization_name: str
    role: str
    access_status: str


class SwitchOrganizationRequest(BaseModel):
    organization_id: str


def require_organization_admin(auth: AuthContext):
    if not auth.tenant_id or auth.account_type != "organization":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization access is required",
        )

    if auth.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization admin access required",
        )


@router.get(
    "/my-organizations",
    response_model=List[OrganizationContextResponse],
)
def list_my_organizations(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    rows = (
        db.query(TenantMembershipModel, TenantModel)
        .join(
            TenantModel,
            TenantMembershipModel.tenant_id == TenantModel.id,
        )
        .filter(
            TenantMembershipModel.user_id == auth.user_id,
        )
        .order_by(TenantModel.name.asc())
        .all()
    )

    return [
        OrganizationContextResponse(
            organization_id=tenant.id,
            organization_name=tenant.name,
            role=membership.role,
            access_status=membership.access_status,
        )
        for membership, tenant in rows
    ]


@router.post("/switch", response_model=dict)
def switch_organization(
    payload: SwitchOrganizationRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    membership = (
        db.query(TenantMembershipModel, TenantModel)
        .join(
            TenantModel,
            TenantMembershipModel.tenant_id == TenantModel.id,
        )
        .filter(
            TenantMembershipModel.user_id == auth.user_id,
            TenantMembershipModel.tenant_id == payload.organization_id,
            TenantMembershipModel.access_status == "active",
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have active access to this organization",
        )

    membership_row, tenant = membership

    access_token = create_access_token(
        user_id=auth.user_id,
        username=auth.username,
        tenant_id=tenant.id,
        role=membership_row.role,
        account_type="organization",
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "organization_id": tenant.id,
        "organization_name": tenant.name,
        "role": membership_row.role,
    }


@router.get("/settings")
def get_organization_settings(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    if not auth.tenant_id or auth.account_type != "organization":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization access is required",
        )

    tenant = (
        db.query(TenantModel)
        .filter(TenantModel.id == auth.tenant_id)
        .first()
    )

    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    return {
        "organization_name": tenant.name,
    }


@router.patch("/settings")
def update_organization_settings(
    payload: UpdateOrganizationNameRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization_admin(auth)

    organization_name = payload.organization_name.strip()

    if not organization_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name is required",
        )

    if len(organization_name) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name must be 200 characters or fewer",
        )

    user = (
        db.query(UserModel)
        .filter(UserModel.id == auth.user_id)
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    tenant = (
        db.query(TenantModel)
        .filter(TenantModel.id == auth.tenant_id)
        .first()
    )

    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    duplicate = (
        db.query(TenantModel)
        .filter(
            TenantModel.id != auth.tenant_id,
            func.lower(TenantModel.name) == organization_name.lower(),
        )
        .first()
    )

    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An organization with this name already exists",
        )

    tenant.name = organization_name
    db.commit()
    db.refresh(tenant)

    return {
        "organization_name": tenant.name,
    }


@router.get(
    "",
    response_model=List[OrganizationMemberResponse],
)
def list_organization_members(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization_admin(auth)

    rows = (
        db.query(TenantMembershipModel, UserModel)
        .join(
            UserModel,
            TenantMembershipModel.user_id == UserModel.id,
        )
        .filter(
            TenantMembershipModel.tenant_id == auth.tenant_id,
        )
        .order_by(UserModel.username.asc())
        .all()
    )

    return [
        OrganizationMemberResponse(
            user_id=user.id,
            username=user.username,
            email=user.email,
            role=membership.role,
            access_status=membership.access_status,
        )
        for membership, user in rows
    ]


@router.get(
    "/sidebar-members",
    response_model=List[OrganizationMemberResponse],
)
def list_sidebar_organization_members(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    if not auth.tenant_id or auth.account_type != "organization":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization access is required",
        )

    requester_membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == auth.tenant_id,
            TenantMembershipModel.user_id == auth.user_id,
            TenantMembershipModel.access_status == "active",
        )
        .first()
    )

    if not requester_membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Active organization access is required",
        )

    rows = (
        db.query(TenantMembershipModel, UserModel)
        .join(
            UserModel,
            TenantMembershipModel.user_id == UserModel.id,
        )
        .filter(
            TenantMembershipModel.tenant_id == auth.tenant_id,
            TenantMembershipModel.access_status == "active",
            UserModel.is_active.is_(True),
        )
        .order_by(UserModel.username.asc())
        .all()
    )

    return [
        OrganizationMemberResponse(
            user_id=user.id,
            username=user.username,
            email=None,
            role=membership.role,
            access_status=membership.access_status,
        )
        for membership, user in rows
    ]
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.post(
    "/{user_id}/revoke-access",
    response_model=OrganizationMemberResponse,
)
def revoke_organization_member_access(
    user_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization_admin(auth)

    if user_id == auth.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot revoke your own organization access",
        )

    membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == auth.tenant_id,
            TenantMembershipModel.user_id == user_id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization member not found",
        )

    if membership.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization admin access cannot be revoked",
        )

    user = (
        db.query(UserModel)
        .filter(UserModel.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization member account not found",
        )

    membership.access_status = "revoked"

    db.query(AccessGrantModel).filter(
        AccessGrantModel.tenant_id == auth.tenant_id,
        AccessGrantModel.principal == user_id,
    ).delete(synchronize_session=False)

    db.query(AccessRequestModel).filter(
        AccessRequestModel.tenant_id == auth.tenant_id,
        AccessRequestModel.requester_id == user_id,
    ).delete(synchronize_session=False)

    db.commit()
    db.refresh(membership)

    return OrganizationMemberResponse(
        user_id=user.id,
        username=user.username,
        email=user.email,
        role=membership.role,
        access_status=membership.access_status,
    )


def delete_organization_member(
    user_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization_admin(auth)

    if user_id == auth.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from the organization",
        )

    membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == auth.tenant_id,
            TenantMembershipModel.user_id == user_id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization member not found",
        )

    if membership.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization admins cannot be removed",
        )

    db.delete(membership)
    db.commit()

    return None


@router.post(
    "/{user_id}/grant-access",
    response_model=OrganizationMemberResponse,
)
def grant_organization_member_access(
    user_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization_admin(auth)

    if user_id == auth.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot grant access to yourself",
        )

    membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == auth.tenant_id,
            TenantMembershipModel.user_id == user_id,
        )
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization member not found",
        )

    if membership.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization administrators already have access",
        )

    user = (
        db.query(UserModel)
        .filter(
            UserModel.id == user_id,
            UserModel.is_active.is_(True),
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization member account not found",
        )

    # The member remains without access until they explicitly accept.
    membership.access_status = "pending"

    # Remove any stale document-level grants/requests for this member.
    db.query(AccessGrantModel).filter(
        AccessGrantModel.tenant_id == auth.tenant_id,
        AccessGrantModel.principal == user_id,
    ).delete(synchronize_session=False)

    db.query(AccessRequestModel).filter(
        AccessRequestModel.tenant_id == auth.tenant_id,
        AccessRequestModel.requester_id == user_id,
    ).delete(synchronize_session=False)

    # Create or refresh the organization-access notification.
    invitation = (
        db.query(OrganizationInvitationModel)
        .filter(
            OrganizationInvitationModel.tenant_id == auth.tenant_id,
            OrganizationInvitationModel.invitee_user_id == user_id,
            OrganizationInvitationModel.status == "pending",
        )
        .first()
    )

    if invitation:
        invitation.created_at = datetime.now(timezone.utc)
        invitation.invited_by_user_id = auth.user_id
    else:
        invitation = OrganizationInvitationModel(
            tenant_id=auth.tenant_id,
            invitee_user_id=user_id,
            invited_by_user_id=auth.user_id,
            status="pending",
        )
        db.add(invitation)

    db.commit()
    db.refresh(membership)

    return OrganizationMemberResponse(
        user_id=user.id,
        username=user.username,
        email=user.email,
        role=membership.role,
        access_status=membership.access_status,
    )


@router.post(
    "/invite",
    response_model=OrganizationMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def invite_organization_member(
    payload: InviteMemberRequest,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    require_organization_admin(auth)

    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required",
        )

    user = (
        db.query(UserModel)
        .filter(UserModel.email.ilike(email))
        .first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered user was found with this email address. The user must create an account before being invited.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user account is inactive",
        )
    if user.id == auth.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot invite yourself",
        )

    membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.user_id == user.id,
            TenantMembershipModel.tenant_id == auth.tenant_id,
        )
        .first()
    )

    if membership and membership.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user is already an organization admin",
        )

    if membership and membership.access_status == "active":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user already has active access to your organization",
        )

    if not membership:
        membership = TenantMembershipModel(
            tenant_id=auth.tenant_id,
            user_id=user.id,
            role="member",
            access_status="pending",
        )
        db.add(membership)
    else:
        membership.access_status = "pending"

    pending = (
        db.query(OrganizationInvitationModel)
        .filter(
            OrganizationInvitationModel.tenant_id == auth.tenant_id,
            OrganizationInvitationModel.invitee_user_id == user.id,
            OrganizationInvitationModel.status == "pending",
        )
        .first()
    )
    if pending:
        # Resend semantics: keep the same pending invitation and refresh its timestamp.
        pending.created_at = datetime.now(timezone.utc)
        pending.invited_by_user_id = auth.user_id
    else:
        db.add(
            OrganizationInvitationModel(
                tenant_id=auth.tenant_id,
                invitee_user_id=user.id,
                invited_by_user_id=auth.user_id,
                status="pending",
            )
        )

    db.commit()
    db.refresh(membership)

    return OrganizationMemberResponse(
        user_id=user.id,
        username=user.username,
        email=user.email,
        role=membership.role,
        access_status=membership.access_status,
    )


class OrganizationInvitationResponse(BaseModel):
    id: str
    organization_id: str
    organization_name: str
    invited_by_username: str
    invited_by_email: str | None = None
    status: str
    created_at: datetime


@router.get("/invitations", response_model=List[OrganizationInvitationResponse])
def list_my_organization_invitations(
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    rows = (
        db.query(OrganizationInvitationModel, TenantModel, UserModel)
        .join(TenantModel, OrganizationInvitationModel.tenant_id == TenantModel.id)
        .join(UserModel, OrganizationInvitationModel.invited_by_user_id == UserModel.id)
        .filter(OrganizationInvitationModel.invitee_user_id == auth.user_id)
        .filter(OrganizationInvitationModel.status == "pending")
        .order_by(OrganizationInvitationModel.created_at.desc())
        .all()
    )
    return [
        OrganizationInvitationResponse(
            id=invitation.id,
            organization_id=tenant.id,
            organization_name=tenant.name,
            invited_by_username=inviter.username,
            invited_by_email=inviter.email,
            status=invitation.status,
            created_at=invitation.created_at,
        )
        for invitation, tenant, inviter in rows
    ]


def _get_my_pending_invitation(db: Session, auth: AuthContext, invitation_id: str):
    invitation = (
        db.query(OrganizationInvitationModel)
        .filter(
            OrganizationInvitationModel.id == invitation_id,
            OrganizationInvitationModel.invitee_user_id == auth.user_id,
            OrganizationInvitationModel.status == "pending",
        )
        .first()
    )
    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending organization invitation not found",
        )
    return invitation


@router.post("/invitations/{invitation_id}/accept")
def accept_organization_invitation(
    invitation_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    invitation = _get_my_pending_invitation(
        db,
        auth,
        invitation_id,
    )

    tenant = (
        db.query(TenantModel)
        .filter(TenantModel.id == invitation.tenant_id)
        .first()
    )

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization no longer exists",
        )

    membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == invitation.tenant_id,
            TenantMembershipModel.user_id == auth.user_id,
        )
        .first()
    )

    if membership:
        if membership.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already an administrator of this organization",
            )

        membership.access_status = "active"
        membership.role = "member"
    else:
        membership = TenantMembershipModel(
            tenant_id=invitation.tenant_id,
            user_id=auth.user_id,
            role="member",
            access_status="active",
        )
        db.add(membership)

    invitation.status = "accepted"
    invitation.responded_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(membership)

    return {
        "message": "Organization access granted",
        "organization_id": invitation.tenant_id,
        "organization_name": tenant.name,
        "role": membership.role,
        "access_status": membership.access_status,
    }


@router.post("/invitations/{invitation_id}/decline")
def decline_organization_invitation(
    invitation_id: str,
    db: Session = Depends(get_db),
    auth: AuthContext = Depends(get_auth_context),
):
    invitation = _get_my_pending_invitation(db, auth, invitation_id)
    membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == invitation.tenant_id,
            TenantMembershipModel.user_id == auth.user_id,
        )
        .first()
    )
    if membership:
        membership.access_status = "pending"
    invitation.status = "declined"
    invitation.responded_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Organization invitation declined"}
