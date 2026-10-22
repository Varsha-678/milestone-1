from typing import Optional
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: str
    password: str
    role: Optional[str] = "Safety Lead"
    remember_me: Optional[bool] = False


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "Safety Lead"
    department: Optional[str] = "Operations"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    department: Optional[str] = "Safety & Compliance"
    avatar: Optional[str] = None
    created_at: str


class AuthResponse(BaseModel):
    status: str
    token: str
    user: UserResponse
    message: str
