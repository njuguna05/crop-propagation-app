from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class SupplierBase(BaseModel):
    company_name: str
    contact_person: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: str = "USA"
    supplier_type: str = "nursery"
    specializations: Optional[str] = None
    certifications: Optional[str] = None
    payment_terms: str = "net_30"
    minimum_order_value: float = 0.0
    lead_time_days: int = 7
    shipping_cost: float = 0.0
    tax_id: Optional[str] = None
    is_active: bool = True
    is_preferred: bool = False
    notes: Optional[str] = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    supplier_type: Optional[str] = None
    specializations: Optional[str] = None
    certifications: Optional[str] = None
    payment_terms: Optional[str] = None
    minimum_order_value: Optional[float] = None
    lead_time_days: Optional[int] = None
    shipping_cost: Optional[float] = None
    tax_id: Optional[str] = None
    is_active: Optional[bool] = None
    is_preferred: Optional[bool] = None
    notes: Optional[str] = None


class Supplier(SupplierBase):
    id: int
    quality_rating: float
    delivery_rating: float
    price_rating: float
    last_order_date: Optional[datetime] = None
    total_orders: int
    total_spent: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SupplierSummary(BaseModel):
    """Lightweight supplier info for dropdowns and selects"""
    id: int
    company_name: str
    contact_person: str
    supplier_type: str
    quality_rating: float
    is_preferred: bool

    class Config:
        from_attributes = True


# Supplier Catalog Schemas
class SupplierCatalogBase(BaseModel):
    supplier_id: int
    product_type: str
    species: Optional[str] = None
    variety: str
    rootstock_type: Optional[str] = None
    age_months: Optional[int] = None
    size_description: Optional[str] = None
    container_size: Optional[str] = None
    unit_price: float
    minimum_quantity: int = 1
    availability_season: Optional[str] = None
    current_stock: int = 0
    lead_time_days: int = 7
    quality_grade: str = "A"
    certifications: Optional[str] = None
    disease_tested: bool = False
    virus_indexed: bool = False
    specifications: Optional[str] = None
    notes: Optional[str] = None
    is_active: bool = True


class SupplierCatalogCreate(SupplierCatalogBase):
    pass


class SupplierCatalogUpdate(BaseModel):
    product_type: Optional[str] = None
    species: Optional[str] = None
    variety: Optional[str] = None
    rootstock_type: Optional[str] = None
    age_months: Optional[int] = None
    size_description: Optional[str] = None
    container_size: Optional[str] = None
    unit_price: Optional[float] = None
    minimum_quantity: Optional[int] = None
    availability_season: Optional[str] = None
    current_stock: Optional[int] = None
    lead_time_days: Optional[int] = None
    quality_grade: Optional[str] = None
    certifications: Optional[str] = None
    disease_tested: Optional[bool] = None
    virus_indexed: Optional[bool] = None
    specifications: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierCatalog(SupplierCatalogBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Purchase Order Schemas
class PurchaseOrderItemBase(BaseModel):
    catalog_item_id: Optional[int] = None
    product_type: str
    species: Optional[str] = None
    variety: str
    rootstock_type: Optional[str] = None
    description: Optional[str] = None
    quantity_ordered: int
    unit_price: float
    line_total: float
    quality_grade: Optional[str] = None
    quality_notes: Optional[str] = None
    lot_number: Optional[str] = None
    harvest_date: Optional[datetime] = None
    source_location: Optional[str] = None


class PurchaseOrderItemCreate(PurchaseOrderItemBase):
    pass


class PurchaseOrderItem(PurchaseOrderItemBase):
    id: int
    purchase_order_id: int
    quantity_received: int
    defect_count: int
    acceptance_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    supplier_id: int
    requested_delivery_date: Optional[datetime] = None
    delivery_address: Optional[str] = None
    delivery_instructions: Optional[str] = None
    inspection_required: bool = True
    notes: Optional[str] = None


class PurchaseOrderCreate(PurchaseOrderBase):
    line_items: List[PurchaseOrderItemCreate]


class PurchaseOrderUpdate(BaseModel):
    status: Optional[str] = None
    requested_delivery_date: Optional[datetime] = None
    actual_delivery_date: Optional[datetime] = None
    delivery_address: Optional[str] = None
    delivery_instructions: Optional[str] = None
    tracking_number: Optional[str] = None
    inspection_completed: Optional[bool] = None
    inspection_date: Optional[datetime] = None
    quality_score: Optional[float] = None
    notes: Optional[str] = None
    approved_by: Optional[str] = None
    received_by: Optional[str] = None


class PurchaseOrder(PurchaseOrderBase):
    id: int
    po_number: str
    order_date: datetime
    actual_delivery_date: Optional[datetime] = None
    status: str
    subtotal: float
    tax_amount: float
    shipping_cost: float
    total_amount: float
    tracking_number: Optional[str] = None
    inspection_completed: bool
    inspection_date: Optional[datetime] = None
    quality_score: Optional[float] = None
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    received_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    line_items: List[PurchaseOrderItem] = []

    class Config:
        from_attributes = True


# Supplier Evaluation Schemas
class SupplierEvaluationBase(BaseModel):
    supplier_id: int
    purchase_order_id: Optional[int] = None
    quality_score: float
    delivery_score: float
    communication_score: float
    price_score: float
    packaging_score: float
    overall_score: float
    quality_comments: Optional[str] = None
    delivery_comments: Optional[str] = None
    communication_comments: Optional[str] = None
    price_comments: Optional[str] = None
    packaging_comments: Optional[str] = None
    general_comments: Optional[str] = None
    would_reorder: bool = True
    recommend_to_others: bool = True
    evaluated_by: str


class SupplierEvaluationCreate(SupplierEvaluationBase):
    pass


class SupplierEvaluation(SupplierEvaluationBase):
    id: int
    evaluation_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True