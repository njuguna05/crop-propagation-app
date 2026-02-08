from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import date
from .common import TimestampMixin


# Order schemas
class OrderBase(BaseModel):
    """Base order schema"""
    client_name: str = Field(..., min_length=1, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    requested_delivery: Optional[date] = None
    crop_type: str = Field(..., min_length=1, max_length=100)
    variety: str = Field(..., min_length=1, max_length=100)
    total_quantity: int = Field(..., gt=0)
    propagation_method: str = Field(..., min_length=1, max_length=50)
    unit_price: Optional[float] = Field(None, ge=0)
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    notes: Optional[Any] = None
    specifications: Optional[Any] = None


class OrderCreate(OrderBase):
    """Order creation schema"""
    pass


class OrderUpdate(BaseModel):
    """Order update schema"""
    client_name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact_person: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    requested_delivery: Optional[date] = None
    crop_type: Optional[str] = Field(None, min_length=1, max_length=100)
    variety: Optional[str] = Field(None, min_length=1, max_length=100)
    total_quantity: Optional[int] = Field(None, gt=0)
    propagation_method: Optional[str] = Field(None, min_length=1, max_length=50)
    unit_price: Optional[float] = Field(None, ge=0)
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    notes: Optional[Any] = None
    specifications: Optional[Any] = None


class OrderStatusUpdate(BaseModel):
    """Order status update schema"""
    status: str = Field(..., min_length=1, max_length=50)
    notes: Optional[str] = None


class OrderTransfer(BaseModel):
    """Order transfer between stages schema"""
    from_section: str = Field(..., min_length=1, max_length=50)
    to_section: str = Field(..., min_length=1, max_length=50)
    to_stage: str = Field(..., min_length=1, max_length=50)
    quantity: int = Field(..., gt=0)
    operator: str = Field(..., min_length=1, max_length=100)
    quality_score: Optional[float] = Field(None, ge=0, le=10)
    notes: Optional[str] = None


class HealthAssessment(BaseModel):
    """Health assessment schema for plant losses"""
    lost_quantity: int = Field(..., ge=0)
    notes: Optional[str] = None


class StageHistoryItem(BaseModel):
    """Stage history item schema"""
    stage: str
    date: date
    quantity: int
    operator: Optional[str] = None
    notes: Optional[str] = None


class OrderResponse(OrderBase, TimestampMixin):
    """Order response schema"""
    id: str
    user_id: int
    order_number: str
    status: str
    current_section: Optional[str] = None
    order_date: date
    completed_quantity: int
    current_stage_quantity: int
    total_value: Optional[float] = None
    stage_history: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True


# Order statistics schema
class OrderStats(BaseModel):
    """Order statistics schema"""
    total_orders: int
    active_orders: int
    completed_orders: int
    total_plants: int
    total_revenue: float
    by_status: Dict[str, int]
    by_section: Dict[str, int]
    by_crop_type: Dict[str, int]