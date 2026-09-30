import hashlib
import os
import secrets
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from email_validator import EmailNotValidError, validate_email

from backend.api.schemas.auth_schemas import (
    ChangePasswordRequest,
    ChangeUsernameRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    LoginRequest,
    SelectLoginAccountRequest,
    SignupRequest,
    OrganizationSignupRequest,
    OrganizationLoginRequest,
    TokenResponse,
    LoginAccount,
    LoginAccountSelectionResponse,
)
from backend.auth.security import create_access_token, verify_password, hash_password
from backend.auth.dependencies import get_current_user
from backend.database.database import get_db
from backend.database.activity import log_activity
from backend.database.models import PasswordResetTokenModel, TenantMembershipModel, TenantModel, UserModel, utc_now
from backend.auth.email_service import send_password_reset_email


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    payload: SignupRequest,
    db: Session = Depends(get_db),
):
    username = payload.username.strip()
    email = payload.email.strip()

    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty",
        )

    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    try:
        email_info = validate_email(
            email,
            check_deliverability=True,
            allow_display_name=False,
        )
        normalized_email = email_info.normalized
    except EmailNotValidError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

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

    existing_email = (
        db.query(UserModel)
        .filter(UserModel.email == normalized_email)
        .first()
    )
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email address is already registered",
        )

    user = UserModel(
        username=username,
        email=normalized_email,
        password_hash=hash_password(payload.password),
        is_active=True,
    )

    db.add(user)
    db.commit()

    return {
        "message": "Account created successfully",
    }


@router.post("/organization-signup", status_code=status.HTTP_201_CREATED)
def organization_signup(
    payload: OrganizationSignupRequest,
    db: Session = Depends(get_db),
):
    organization_name = payload.organization_name.strip()
    username = payload.username.strip()
    email = payload.email.strip()

    if not organization_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization name cannot be empty",
        )

    if not username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty",
        )

    if payload.password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    try:
        email_info = validate_email(
            email,
            check_deliverability=True,
            allow_display_name=False,
        )
        normalized_email = email_info.normalized
    except EmailNotValidError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

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

    # Email addresses may be shared by multiple organization accounts.
    # Username remains globally unique and identifies the account.
    
    # Exact organization-name matching:
    # same case + same internal spacing = same organization.
    # Different case or internal spacing = different organization.
    existing_organization = (
        db.query(TenantModel)
        .filter(TenantModel.name == organization_name)
        .first()
    )

    user = UserModel(
        username=username,
        email=normalized_email,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.flush()

    if existing_organization:
        # Existing organization: this signup becomes a member.
        tenant = existing_organization
        membership_role = "member"
        message = (
            "Account created successfully. "
            "You have joined the organization as a member."
        )
    else:
        # New organization: this signup creates the organization admin.
        tenant = TenantModel(
            name=organization_name,
        )
        db.add(tenant)
        db.flush()

        membership_role = "admin"
        message = (
            "Organization created successfully. "
            "You are the organization admin."
        )

    membership = TenantMembershipModel(
        tenant_id=tenant.id,
        user_id=user.id,
        role=membership_role,
        access_status=("active" if membership_role == "admin" else "pending"),
    )
    db.add(membership)
    db.commit()

    return {
        "message": message,
        "organization_id": tenant.id,
        "role": membership_role,
    }


@router.post("/organization-login", response_model=TokenResponse)
def organization_login(
    payload: OrganizationLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    organization_name = payload.organization_name.strip()
    username = payload.username.strip()

    tenant = (
        db.query(TenantModel)
        .filter(TenantModel.name == organization_name)
        .first()
    )

    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization credentials",
        )

    user = (
        db.query(UserModel)
        .filter(UserModel.username == username)
        .first()
    )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization credentials",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization credentials",
        )

    membership = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.tenant_id == tenant.id,
            TenantMembershipModel.user_id == user.id,
        )
        .first()
    )

    if membership is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization credentials",
        )

    access_token = create_access_token(
        user_id=user.id,
        username=user.username,
        tenant_id=tenant.id,
        role=membership.role,
        account_type="organization",
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.post("/login", response_model=TokenResponse | LoginAccountSelectionResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    email = payload.email.strip().lower()

    users = (
        db.query(UserModel)
        .filter(UserModel.email.ilike(email))
        .all()
    )

    matching_users = [
        candidate
        for candidate in users
        if candidate.is_active
        and verify_password(payload.password, candidate.password_hash)
    ]

    if not matching_users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Only users with at least one active organization membership are
    # valid organization accounts for the account chooser. Orphaned
    # UserModel rows must not cause the chooser to appear.
    valid_accounts = []

    for candidate in matching_users:
        memberships = (
            db.query(TenantMembershipModel, TenantModel)
            .join(
                TenantModel,
                TenantMembershipModel.tenant_id == TenantModel.id,
            )
            .filter(
                TenantMembershipModel.user_id == candidate.id,
                TenantMembershipModel.access_status == "active",
            )
            .order_by(TenantModel.name.asc())
            .all()
        )

        if memberships:
            valid_accounts.append(
                LoginAccount(
                    username=candidate.username,
                    account_type="organization",
                    organization_names=[
                        tenant.name
                        for _, tenant in memberships
                    ],
                )
            )

    if len(valid_accounts) > 1:
        return LoginAccountSelectionResponse(
            accounts=valid_accounts,
        )

    if len(valid_accounts) == 1:
        user = next(
            candidate
            for candidate in matching_users
            if candidate.username == valid_accounts[0].username
        )

        membership, tenant = (
            db.query(TenantMembershipModel, TenantModel)
            .join(
                TenantModel,
                TenantMembershipModel.tenant_id == TenantModel.id,
            )
            .filter(
                TenantMembershipModel.user_id == user.id,
                TenantMembershipModel.access_status == "active",
            )
            .order_by(TenantModel.name.asc())
            .first()
        )

        access_token = create_access_token(
            user_id=user.id,
            username=user.username,
            tenant_id=membership.tenant_id,
            role=membership.role,
            account_type="organization",
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
        )

    user = matching_users[0]

    # A user may belong to multiple organizations.
    # Select the first active organization as the initial login context.
    memberships = (
        db.query(TenantMembershipModel, TenantModel)
        .join(
            TenantModel,
            TenantMembershipModel.tenant_id == TenantModel.id,
        )
        .filter(
            TenantMembershipModel.user_id == user.id,
            TenantMembershipModel.access_status == "active",
        )
        .order_by(TenantModel.name.asc())
        .all()
    )

    if memberships:
        membership, tenant = memberships[0]

        access_token = create_access_token(
            user_id=user.id,
            username=user.username,
            tenant_id=membership.tenant_id,
            role=membership.role,
            account_type="organization",
        )
    else:
        access_token = create_access_token(
            user_id=user.id,
            username=user.username,
            account_type="individual",
        )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.post("/select-account", response_model=TokenResponse)
def select_login_account(
    payload: SelectLoginAccountRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    email = payload.email.strip().lower()
    username = payload.username.strip()

    user = (
        db.query(UserModel)
        .filter(
            UserModel.username == username,
            UserModel.email.ilike(email),
        )
        .first()
    )

    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid account selection",
        )

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    memberships = (
        db.query(TenantMembershipModel, TenantModel)
        .join(
            TenantModel,
            TenantMembershipModel.tenant_id == TenantModel.id,
        )
        .filter(
            TenantMembershipModel.user_id == user.id,
            TenantMembershipModel.access_status == "active",
        )
        .order_by(TenantModel.name.asc())
        .all()
    )

    if memberships:
        membership, tenant = memberships[0]

        access_token = create_access_token(
            user_id=user.id,
            username=user.username,
            tenant_id=membership.tenant_id,
            role=membership.role,
            account_type="organization",
        )
    else:
        access_token = create_access_token(
            user_id=user.id,
            username=user.username,
            account_type="individual",
        )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(UserModel)
        .filter(UserModel.id == current_user_id)
        .first()
    )

    if not user:
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

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {
        "message": "Password changed successfully",
    }

@router.post("/change-username")
def change_username(
    payload: ChangeUsernameRequest,
    current_user_id: str = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = (
        db.query(UserModel)
        .filter(UserModel.id == current_user_id)
        .first()
    )

    if not user:
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

    new_username = payload.new_username.strip()

    if not new_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username cannot be empty",
        )

    if new_username == user.username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New username must be different from the current username",
        )

    existing_user = (
        db.query(UserModel)
        .filter(UserModel.username == new_username)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken",
        )

    old_username = user.username
    user.username = new_username

    memberships = (
        db.query(TenantMembershipModel)
        .filter(
            TenantMembershipModel.user_id == user.id,
            TenantMembershipModel.access_status == "active",
        )
        .all()
    )

    for membership in memberships:
        log_activity(
            db,
            tenant_id=membership.tenant_id,
            actor_id=user.id,
            activity_type="USERNAME_CHANGED",
            message=(
                f"Username changed from {old_username} "
                f"to {new_username}"
            ),
            metadata_json={
                "old_username": old_username,
                "new_username": new_username,
            },
        )

    db.commit()
    db.refresh(user)

    return {
        "message": "Username changed successfully",
        "username": user.username,
    }



@router.post("/forgot-password")
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    generic_response = {
        "message": "If an account with that email exists, a password reset link has been sent.",
    }

    email = payload.email.strip()

    try:
        email_info = validate_email(
            email,
            check_deliverability=False,
            allow_display_name=False,
        )
        normalized_email = email_info.normalized
    except EmailNotValidError:
        return generic_response

    user = (
        db.query(UserModel)
        .filter(UserModel.email == normalized_email)
        .first()
    )

    if not user or not user.is_active:
        return generic_response

    now = utc_now()

    # Invalidate any previous unused reset tokens for this user.
    (
        db.query(PasswordResetTokenModel)
        .filter(
            PasswordResetTokenModel.user_id == user.id,
            PasswordResetTokenModel.used_at.is_(None),
        )
        .update(
            {"used_at": now},
            synchronize_session=False,
        )
    )

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

    reset_token = PasswordResetTokenModel(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=now + timedelta(minutes=10),
    )

    db.add(reset_token)
    db.commit()

    reset_url = (
        os.getenv("FRONTEND_URL", "http://localhost:3001").rstrip("/")
        + "/reset-password?token="
        + raw_token
    )

    try:
        send_password_reset_email(
            recipient_email=normalized_email,
            reset_url=reset_url,
        )
    except Exception:
        db.delete(reset_token)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send password reset email",
        )

    return generic_response


@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )

    token_hash = hashlib.sha256(
        payload.token.encode("utf-8")
    ).hexdigest()

    now = utc_now()

    reset_token = (
        db.query(PasswordResetTokenModel)
        .filter(
            PasswordResetTokenModel.token_hash == token_hash,
            PasswordResetTokenModel.used_at.is_(None),
            PasswordResetTokenModel.expires_at > now,
        )
        .first()
    )

    if not reset_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link",
        )

    user = (
        db.query(UserModel)
        .filter(UserModel.id == reset_token.user_id)
        .first()
    )

    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset link",
        )

    user.password_hash = hash_password(payload.new_password)
    reset_token.used_at = now

    # Invalidate any other unused reset tokens for this user.
    (
        db.query(PasswordResetTokenModel)
        .filter(
            PasswordResetTokenModel.user_id == user.id,
            PasswordResetTokenModel.id != reset_token.id,
            PasswordResetTokenModel.used_at.is_(None),
        )
        .update(
            {"used_at": now},
            synchronize_session=False,
        )
    )

    db.commit()

    return {
        "message": "Password reset successfully",
    }
