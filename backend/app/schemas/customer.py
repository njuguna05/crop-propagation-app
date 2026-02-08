from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    company_name: str
    contact_person: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: str = "USA"
    customer_type: str = "retail"
    tax_id: Optional[str] = None
    payment_terms: str = "net_30"
    credit_limit: int = 0
    notes: Optional[str] = None
    is_active: str = "true"


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    customer_type: Optional[str] = None
    tax_id: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[str] = None


class Customer(CustomerBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CustomerSummary(BaseModel):
    """Lightweight customer info for dropdowns and selects"""
    id: int
    company_name: str
    contact_person: str
    email: Optional[str] = None
    phone: Optional[str] = None
    customer_type: str

    class Config:
        from_attributes = True