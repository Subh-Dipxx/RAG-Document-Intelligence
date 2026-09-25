from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth.dependencies import AuthContext, get_auth_context
from backend.database.models import OrganizationInvitationModel, TenantModel
from datetime import datetime, timezone
from backend.database.database import get_db
from backend.database.models import TenantMembershipModel, UserModel


router = APIRouter(
    prefix="/organization-members",
    tags=["organization-members"],
)


class InviteMemberRequest(BaseModel):
    email: str


class OrganizationMemberResponse(BaseModel):
    user_id: str
    username: str
    email: str | None = None
    role: str
    access_status: str = "pending"


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
        .filter(TenantMembershipModel.user_id == user.id)
        .first()
    )
    if membership and membership.tenant_id != auth.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user already belongs to another organization",
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
    invitation = _get_my_pending_invitation(db, auth, invitation_id)
    membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == invitation.tenant_id,
            TenantMembershipModel.user_id == auth.user_id,
        )
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization membership no longer exists",
        )
    membership.access_status = "active"
    invitation.status = "accepted"
    invitation.responded_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Organization invitation accepted", "organization_id": invitation.tenant_id}


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
