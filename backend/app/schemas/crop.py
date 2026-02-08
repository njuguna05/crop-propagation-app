from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from .common import TimestampMixin


# Crop schemas
class CropBase(BaseModel):
    """Base crop schema"""
    name: str = Field(..., min_length=1, max_length=100)
    variety: str = Field(..., min_length=1, max_length=100)
    propagation_method: str = Field(..., min_length=1, max_length=50)
    current_stage: str = Field(..., min_length=1, max_length=50)
    location: Optional[str] = Field(None, max_length=100)
    planted_date: date
    expected_germination: Optional[date] = None
    temperature: Optional[float] = Field(None, ge=-50, le=100)  # Celsius
    humidity: Optional[float] = Field(None, ge=0, le=100)      # Percentage
    watered: Optional[date] = None
    notes: Optional[str] = None


class CropCreate(CropBase):
    """Crop creation schema"""
    pass


class CropUpdate(BaseModel):
    """Crop update schema"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    variety: Optional[str] = Field(None, min_length=1, max_length=100)
    propagation_method: Optional[str] = Field(None, min_length=1, max_length=50)
    current_stage: Optional[str] = Field(None, min_length=1, max_length=50)
    location: Optional[str] = Field(None, max_length=100)
    planted_date: Optional[date] = None
    expected_germination: Optional[date] = None
    temperature: Optional[float] = Field(None, ge=-50, le=100)
    humidity: Optional[float] = Field(None, ge=0, le=100)
    watered: Optional[date] = None
    notes: Optional[str] = None


class CropResponse(CropBase, TimestampMixin):
    """Crop response schema"""
    id: int
    user_id: int

    class Config:
        from_attributes = True


# Crop statistics schema
class CropStats(BaseModel):
    """Crop statistics schema"""
    total_crops: int
    by_stage: dict[str, int]
    by_propagation_method: dict[str, int]
    by_variety: dict[str, int]
    recent_plantings: int  # Last 30 days