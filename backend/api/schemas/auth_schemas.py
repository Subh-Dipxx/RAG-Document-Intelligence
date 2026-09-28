from pydantic import BaseModel, Field


class SignupRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)


class OrganizationSignupRequest(BaseModel):
    organization_name: str = Field(min_length=2, max_length=200)
    username: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)


class OrganizationLoginRequest(BaseModel):
    organization_name: str = Field(min_length=2, max_length=200)
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1)


class LoginRequest(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginAccount(BaseModel):
    username: str
    account_type: str
    organization_names: list[str] = []


class LoginAccountSelectionResponse(BaseModel):
    requires_account_selection: bool = True
    accounts: list[LoginAccount]

class SelectLoginAccountRequest(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)
    username: str = Field(min_length=1, max_length=100)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8)


class ChangeUsernameRequest(BaseModel):
    new_username: str = Field(min_length=1, max_length=100)
    current_password: str = Field(min_length=1)

class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

