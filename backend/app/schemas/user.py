from pydantic import BaseModel, EmailStr, ConfigDict
from datetime import datetime
import uuid
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    target_role: Optional[str] = None
    grad_year: Optional[int] = None
    avatar_url: Optional[str] = None
    college: Optional[str] = None
    branch: Optional[str] = None
    preferred_language: Optional[str] = None
    preferences: Optional[dict] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    target_role: Optional[str] = None
    grad_year: Optional[int] = None
    avatar_url: Optional[str] = None
    college: Optional[str] = None
    branch: Optional[str] = None
    preferred_language: Optional[str] = None
    preferences: Optional[dict] = None
    is_onboarded: Optional[bool] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserResponse(UserBase):
    id: uuid.UUID
    is_onboarded: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
