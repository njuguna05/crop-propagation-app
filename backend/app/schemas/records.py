from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from .common import TimestampMixin


# Budwood Collection schemas
class BudwoodCollectionBase(BaseModel):
    """Base budwood collection schema"""
    mother_tree_id: Optional[str] = Field(None, max_length=50)
    variety: str = Field(..., min_length=1, max_length=100)
    harvest_date: date
    quantity: int = Field(..., gt=0)
    quality_score: Optional[float] = Field(None, ge=0, le=10)
    operator: str = Field(..., min_length=1, max_length=100)
    storage_location: Optional[str] = Field(None, max_length=100)
    storage_temperature: Optional[float] = Field(None, ge=-50, le=100)
    storage_humidity: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class BudwoodCollectionCreate(BudwoodCollectionBase):
    """Budwood collection creation schema"""
    order_id: Optional[str] = None


class BudwoodCollectionUpdate(BaseModel):
    """Budwood collection update schema"""
    mother_tree_id: Optional[str] = Field(None, max_length=50)
    variety: Optional[str] = Field(None, min_length=1, max_length=100)
    harvest_date: Optional[date] = None
    quantity: Optional[int] = Field(None, gt=0)
    quality_score: Optional[float] = Field(None, ge=0, le=10)
    operator: Optional[str] = Field(None, min_length=1, max_length=100)
    storage_location: Optional[str] = Field(None, max_length=100)
    storage_temperature: Optional[float] = Field(None, ge=-50, le=100)
    storage_humidity: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None
    order_id: Optional[str] = None


class BudwoodCollectionResponse(BudwoodCollectionBase, TimestampMixin):
    """Budwood collection response schema"""
    id: str
    user_id: int
    order_id: Optional[str] = None

    class Config:
        from_attributes = True


# Grafting Record schemas
class GraftingRecordBase(BaseModel):
    """Base grafting record schema"""
    date: date
    operator: str = Field(..., min_length=1, max_length=100)
    technique: str = Field(..., min_length=1, max_length=50)
    rootstock_type: str = Field(..., min_length=1, max_length=100)
    scion_variety: str = Field(..., min_length=1, max_length=100)
    quantity: int = Field(..., gt=0)
    success_count: int = Field(..., ge=0)
    temperature: Optional[float] = Field(None, ge=-50, le=100)
    humidity: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class GraftingRecordCreate(GraftingRecordBase):
    """Grafting record creation schema"""
    order_id: Optional[str] = None
    budwood_collection_id: Optional[str] = None


class GraftingRecordUpdate(BaseModel):
    """Grafting record update schema"""
    date: Optional[date] = None
    operator: Optional[str] = Field(None, min_length=1, max_length=100)
    technique: Optional[str] = Field(None, min_length=1, max_length=50)
    rootstock_type: Optional[str] = Field(None, min_length=1, max_length=100)
    scion_variety: Optional[str] = Field(None, min_length=1, max_length=100)
    quantity: Optional[int] = Field(None, gt=0)
    success_count: Optional[int] = Field(None, ge=0)
    temperature: Optional[float] = Field(None, ge=-50, le=100)
    humidity: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None
    order_id: Optional[str] = None
    budwood_collection_id: Optional[str] = None


class GraftingRecordResponse(GraftingRecordBase, TimestampMixin):
    """Grafting record response schema"""
    id: str
    user_id: int
    order_id: Optional[str] = None
    budwood_collection_id: Optional[str] = None
    success_rate: float

    class Config:
        from_attributes = True


# Transfer Record schemas
class TransferRecordBase(BaseModel):
    """Base transfer record schema"""
    from_section: str = Field(..., min_length=1, max_length=50)
    to_section: str = Field(..., min_length=1, max_length=50)
    from_stage: str = Field(..., min_length=1, max_length=50)
    to_stage: str = Field(..., min_length=1, max_length=50)
    quantity: int = Field(..., gt=0)
    transfer_date: date
    operator: str = Field(..., min_length=1, max_length=100)
    quality_score: Optional[float] = Field(None, ge=0, le=10)
    survival_rate: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None


class TransferRecordCreate(TransferRecordBase):
    """Transfer record creation schema"""
    order_id: str = Field(..., min_length=1)


class TransferRecordUpdate(BaseModel):
    """Transfer record update schema"""
    from_section: Optional[str] = Field(None, min_length=1, max_length=50)
    to_section: Optional[str] = Field(None, min_length=1, max_length=50)
    from_stage: Optional[str] = Field(None, min_length=1, max_length=50)
    to_stage: Optional[str] = Field(None, min_length=1, max_length=50)
    quantity: Optional[int] = Field(None, gt=0)
    transfer_date: Optional[date] = None
    operator: Optional[str] = Field(None, min_length=1, max_length=100)
    quality_score: Optional[float] = Field(None, ge=0, le=10)
    survival_rate: Optional[float] = Field(None, ge=0, le=100)
    notes: Optional[str] = None
    order_id: Optional[str] = None


class TransferRecordResponse(TransferRecordBase, TimestampMixin):
    """Transfer record response schema"""
    id: str
    user_id: int
    order_id: str

    class Config:
        from_attributes = True


# Records statistics schemas
class BudwoodStats(BaseModel):
    """Budwood collection statistics schema"""
    total_collections: int
    total_quantity: int
    average_quality: float
    by_variety: dict[str, int]
    recent_collections: int  # Last 30 days


class GraftingStats(BaseModel):
    """Grafting statistics schema"""
    total_grafts: int
    total_successful: int
    overall_success_rate: float
    by_technique: dict[str, dict[str, float]]  # technique -> {count, success_rate}
    by_variety: dict[str, dict[str, float]]
    recent_grafts: int  # Last 30 days


class TransferStats(BaseModel):
    """Transfer statistics schema"""
    total_transfers: int
    total_quantity_transferred: int
    average_survival_rate: float
    by_section: dict[str, int]  # section -> transfer count
    by_stage: dict[str, int]    # stage -> transfer count
    recent_transfers: int  # Last 30 days