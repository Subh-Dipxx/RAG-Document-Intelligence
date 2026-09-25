from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.auth.dependencies import AuthContext, get_auth_context
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

    existing_membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.user_id == user.id,
        )
        .first()
    )

    if existing_membership:
        if existing_membership.tenant_id == auth.tenant_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This user is already a member of your organization",
            )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This user already belongs to another organization",
        )

    membership = TenantMembershipModel(
        tenant_id=auth.tenant_id,
        user_id=user.id,
        role="member",
    )

    db.add(membership)
    db.commit()
    db.refresh(membership)

    return OrganizationMemberResponse(
        user_id=user.id,
        username=user.username,
        email=user.email,
        role=membership.role,
    )
