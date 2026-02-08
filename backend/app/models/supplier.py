from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(200), nullable=False, index=True)
    contact_person = Column(String(100), nullable=False)
    email = Column(String(100), index=True)
    phone = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(50))
    zip_code = Column(String(20))
    country = Column(String(100), default="USA")

    # Supplier specific fields
    supplier_type = Column(String(50), default="nursery")  # nursery, collector, farm, distributor
    specializations = Column(Text)  # JSON string of specializations
    certifications = Column(Text)  # JSON string of certifications (organic, disease-free, etc.)
    quality_rating = Column(Float, default=0.0)  # Average quality rating 1-5
    delivery_rating = Column(Float, default=0.0)  # Average delivery rating 1-5
    price_rating = Column(Float, default=0.0)  # Price competitiveness 1-5

    # Business terms
    payment_terms = Column(String(50), default="net_30")
    minimum_order_value = Column(Float, default=0.0)
    lead_time_days = Column(Integer, default=7)
    shipping_cost = Column(Float, default=0.0)
    tax_id = Column(String(50))

    # Status and tracking
    is_active = Column(Boolean, default=True)
    is_preferred = Column(Boolean, default=False)
    last_order_date = Column(DateTime(timezone=True))
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)

    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    catalog_items = relationship("SupplierCatalog", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class SupplierCatalog(Base):
    __tablename__ = "supplier_catalog"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)

    # Product information
    product_type = Column(String(50), nullable=False)  # budwood, rootstock, seedlings, tools
    species = Column(String(100))  # Citrus, Avocado, etc.
    variety = Column(String(100), nullable=False)
    rootstock_type = Column(String(100))  # For grafted materials

    # Product details
    age_months = Column(Integer)  # Age of material
    size_description = Column(String(200))  # Height, caliper, etc.
    container_size = Column(String(50))  # Pot size or bare root

    # Pricing and availability
    unit_price = Column(Float, nullable=False)
    minimum_quantity = Column(Integer, default=1)
    availability_season = Column(String(100))  # Spring, Fall, Year-round
    current_stock = Column(Integer, default=0)
    lead_time_days = Column(Integer, default=7)

    # Quality and certifications
    quality_grade = Column(String(10), default="A")  # A, B, C
    certifications = Column(Text)  # JSON string
    disease_tested = Column(Boolean, default=False)
    virus_indexed = Column(Boolean, default=False)

    # Product specifications
    specifications = Column(Text)  # JSON string of detailed specs
    notes = Column(Text)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier", back_populates="catalog_items")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    po_number = Column(String(50), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)

    # Order details
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    requested_delivery_date = Column(DateTime(timezone=True))
    actual_delivery_date = Column(DateTime(timezone=True))

    # Status tracking
    status = Column(String(50), default="draft")  # draft, sent, confirmed, partial, delivered, cancelled

    # Financial
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    shipping_cost = Column(Float, default=0.0)
    total_amount = Column(Float, default=0.0)

    # Delivery information
    delivery_address = Column(Text)
    delivery_instructions = Column(Text)
    tracking_number = Column(String(100))

    # Quality and inspection
    inspection_required = Column(Boolean, default=True)
    inspection_completed = Column(Boolean, default=False)
    inspection_date = Column(DateTime(timezone=True))
    quality_score = Column(Float)  # 1-5 rating

    notes = Column(Text)
    created_by = Column(String(100))  # User who created the PO
    approved_by = Column(String(100))  # User who approved the PO
    received_by = Column(String(100))  # User who received the delivery

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    supplier = relationship("Supplier", back_populates="purchase_orders")
    line_items = relationship("PurchaseOrderItem", back_populates="purchase_order")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    catalog_item_id = Column(Integer, ForeignKey("supplier_catalog.id"), nullable=True)

    # Product details (can be custom or from catalog)
    product_type = Column(String(50), nullable=False)
    species = Column(String(100))
    variety = Column(String(100), nullable=False)
    rootstock_type = Column(String(100))
    description = Column(Text)

    # Order quantities and pricing
    quantity_ordered = Column(Integer, nullable=False)
    quantity_received = Column(Integer, default=0)
    unit_price = Column(Float, nullable=False)
    line_total = Column(Float, nullable=False)

    # Quality tracking
    quality_grade = Column(String(10))
    quality_notes = Column(Text)
    defect_count = Column(Integer, default=0)
    acceptance_status = Column(String(20), default="pending")  # pending, accepted, rejected, partial

    # Traceability
    lot_number = Column(String(100))
    harvest_date = Column(DateTime(timezone=True))
    source_location = Column(String(200))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="line_items")
    catalog_item = relationship("SupplierCatalog")


class SupplierEvaluation(Base):
    __tablename__ = "supplier_evaluations"

    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)

    # Evaluation scores (1-5 scale)
    quality_score = Column(Float, nullable=False)
    delivery_score = Column(Float, nullable=False)
    communication_score = Column(Float, nullable=False)
    price_score = Column(Float, nullable=False)
    packaging_score = Column(Float, nullable=False)

    # Overall rating
    overall_score = Column(Float, nullable=False)

    # Detailed feedback
    quality_comments = Column(Text)
    delivery_comments = Column(Text)
    communication_comments = Column(Text)
    price_comments = Column(Text)
    packaging_comments = Column(Text)
    general_comments = Column(Text)

    # Recommendations
    would_reorder = Column(Boolean, default=True)
    recommend_to_others = Column(Boolean, default=True)

    evaluated_by = Column(String(100), nullable=False)
    evaluation_date = Column(DateTime(timezone=True), server_default=func.now())

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    supplier = relationship("Supplier")
    purchase_order = relationship("PurchaseOrder")