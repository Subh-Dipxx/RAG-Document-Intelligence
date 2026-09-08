from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.api.schemas.auth_schemas import LoginRequest, TokenResponse
from backend.auth.security import create_access_token, verify_password
from backend.database.database import get_db
from backend.database.models import UserModel


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/login", response_model=TokenResponse)
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = (
        db.query(UserModel)
        .filter(UserModel.username == payload.username)
        .first()
    )

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )

    access_token = create_access_token(
        user_id=user.id,
        username=user.username,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )
