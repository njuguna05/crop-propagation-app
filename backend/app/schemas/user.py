from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from .common import TimestampMixin


# User schemas
class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: bool = True


class UserCreate(UserBase):
    """User creation schema"""
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """User update schema"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    full_name: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class UserLogin(BaseModel):
    """User login schema"""
    username: str  # Can be username or email
    password: str


class UserResponse(UserBase, TimestampMixin):
    """User response schema"""
    id: int
    is_superuser: bool = False

    class Config:
        from_attributes = True


class UserInDB(UserResponse):
    """User schema for database operations"""
    hashed_password: str


# Password change schemas
class PasswordChange(BaseModel):
    """Password change schema"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)


class PasswordReset(BaseModel):
    """Password reset schema"""
    token: str
    new_password: str = Field(..., min_length=8, max_length=100)