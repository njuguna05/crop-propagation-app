from pydantic import BaseModel
from typing import Optional, Generic, TypeVar
from datetime import datetime


# Generic response schema
T = TypeVar('T')


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response schema"""
    items: list[T]
    total: int
    page: int
    size: int
    pages: int


class MessageResponse(BaseModel):
    """Simple message response schema"""
    message: str
    success: bool = True


class TimestampMixin(BaseModel):
    """Mixin for timestamp fields"""
    created_at: datetime
    updated_at: Optional[datetime] = None


class SyncMixin(BaseModel):
    """Mixin for sync-related fields"""
    last_updated: Optional[datetime] = None
    sync_status: str = "synced"  # pending, synced, error


# Token schemas
class Token(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token data schema"""
    user_id: Optional[int] = None