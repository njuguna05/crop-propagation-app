from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class TenantRoleEnum(str, Enum):
    """Tenant role enumeration"""
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class SubscriptionTier(str, Enum):
    """Subscription tier enumeration"""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class SubscriptionStatus(str, Enum):
    """Subscription status enumeration"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CANCELLED = "cancelled"
    TRIAL = "trial"


# Tenant Settings Schema
class TenantSettings(BaseModel):
    """Tenant settings schema"""
    timezone: str = "UTC"
    currency: str = "USD"
    date_format: str = "YYYY-MM-DD"
    language: str = "en"
    features: Dict[str, bool] = Field(default_factory=dict)
    
    class Config:
        from_attributes = True


# Tenant Base Schemas
class TenantBase(BaseModel):
    """Base tenant schema"""
    name: str = Field(..., min_length=1, max_length=100)
    subdomain: Optional[str] = Field(None, min_length=3, max_length=50, pattern="^[a-z0-9-]+$")
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)


class TenantCreate(TenantBase):
    """Tenant creation schema"""
    settings: Optional[TenantSettings] = None


class TenantRegistration(TenantBase):
    """Combined tenant and user registration schema"""
    # User fields
    email: EmailStr = Field(..., description="User email")
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = Field(None, max_length=100)
    # contact_email is from TenantBase and is optional


class TenantUpdate(BaseModel):
    """Tenant update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    subdomain: Optional[str] = Field(None, min_length=3, max_length=50, pattern="^[a-z0-9-]+$")
    description: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = Field(None, max_length=20)
    is_active: Optional[bool] = None


class TenantResponse(TenantBase):
    """Tenant response schema"""
    id: int
    is_active: bool
    subscription_tier: str
    subscription_status: str
    subscription_expires_at: Optional[datetime] = None
    settings: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TenantWithStats(TenantResponse):
    """Tenant response with statistics"""
    user_count: int = 0
    crop_count: int = 0
    order_count: int = 0
    task_count: int = 0


# Tenant User Association Schemas
class TenantUserBase(BaseModel):
    """Base tenant user schema"""
    role: TenantRoleEnum = TenantRoleEnum.MEMBER


class TenantUserCreate(TenantUserBase):
    """Tenant user creation schema"""
    user_id: int
    tenant_id: int


class TenantUserUpdate(BaseModel):
    """Tenant user update schema"""
    role: Optional[TenantRoleEnum] = None
    is_active: Optional[bool] = None


class TenantUserResponse(TenantUserBase):
    """Tenant user response schema"""
    id: int
    tenant_id: int
    user_id: int
    is_active: bool
    invited_at: datetime
    joined_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TenantUserWithDetails(TenantUserResponse):
    """Tenant user response with user details"""
    user_email: str
    user_username: str
    user_full_name: Optional[str] = None


# Tenant Invitation Schemas
class TenantInvitation(BaseModel):
    """Tenant invitation schema"""
    email: EmailStr
    role: TenantRoleEnum = TenantRoleEnum.MEMBER
    message: Optional[str] = None


class TenantInvitationResponse(BaseModel):
    """Tenant invitation response schema"""
    success: bool
    message: str
    user_id: Optional[int] = None
    tenant_user_id: Optional[int] = None


# Tenant Statistics Schema
class TenantStats(BaseModel):
    """Tenant statistics schema"""
    total_users: int = 0
    active_users: int = 0
    total_crops: int = 0
    total_orders: int = 0
    total_tasks: int = 0
    pending_tasks: int = 0
    completed_orders: int = 0
    revenue: float = 0.0
    
    # User role breakdown
    owners: int = 0
    admins: int = 0
    members: int = 0
    viewers: int = 0


# Tenant Settings Update Schema
class TenantSettingsUpdate(BaseModel):
    """Tenant settings update schema"""
    timezone: Optional[str] = None
    currency: Optional[str] = None
    date_format: Optional[str] = None
    language: Optional[str] = None
    features: Optional[Dict[str, bool]] = None


# Tenant List Response
class TenantListItem(BaseModel):
    """Tenant list item schema"""
    id: int
    name: str
    subdomain: Optional[str] = None
    role: TenantRoleEnum
    is_active: bool
    subscription_tier: str
    
    class Config:
        from_attributes = True


class TenantListResponse(BaseModel):
    """Tenant list response schema"""
    tenants: List[TenantListItem]
    total: int
