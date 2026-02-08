from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from .common import TimestampMixin


# Task schemas
class TaskBase(BaseModel):
    """Base task schema"""
    task: str = Field(..., min_length=1, max_length=200)
    due_date: date
    completed: bool = False
    priority: str = Field(default="medium", pattern="^(low|medium|high|urgent)$")
    notes: Optional[str] = None


class TaskCreate(TaskBase):
    """Task creation schema"""
    crop_id: Optional[int] = None
    order_id: Optional[str] = None


class TaskUpdate(BaseModel):
    """Task update schema"""
    task: Optional[str] = Field(None, min_length=1, max_length=200)
    due_date: Optional[date] = None
    completed: Optional[bool] = None
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    notes: Optional[str] = None
    crop_id: Optional[int] = None
    order_id: Optional[str] = None


class TaskResponse(TaskBase, TimestampMixin):
    """Task response schema"""
    id: int
    user_id: int
    crop_id: Optional[int] = None
    order_id: Optional[str] = None

    class Config:
        from_attributes = True


# Task completion toggle
class TaskCompletion(BaseModel):
    """Task completion toggle schema"""
    completed: bool


# Task statistics schema
class TaskStats(BaseModel):
    """Task statistics schema"""
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    by_priority: dict[str, int]
    today_tasks: int
    this_week_tasks: int