from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.auth.security import decode_access_token


bearer_scheme = HTTPBearer()


@dataclass(frozen=True)
class AuthContext:
    user_id: str
    tenant_id: str | None
    role: str | None
    account_type: str


def get_auth_context(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> AuthContext:
    payload = decode_access_token(credentials.credentials)

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
        )

    account_type = str(payload.get("account_type") or "individual")
    tenant_id = payload.get("tenant_id")
    role = payload.get("role")

    if account_type == "organization" and not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid organization access token",
        )

    return AuthContext(
        user_id=str(user_id),
        tenant_id=str(tenant_id) if tenant_id else None,
        role=str(role) if role else None,
        account_type=account_type,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    return get_auth_context(credentials).user_id
