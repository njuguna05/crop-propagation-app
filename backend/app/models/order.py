from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, JSON, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class Order(Base):
    """Order model for propagation orders and workflow tracking"""

    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint('tenant_id', 'order_number', name='uq_order_tenant_order_number'),
    )

    id = Column(String(50), primary_key=True, index=True)  # PO-2024-001 format
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Order identification
    order_number = Column(String(50), nullable=False, index=True)
    status = Column(String(50), nullable=False, index=True)  # order_created, in_propagation, etc.
    current_section = Column(String(50), nullable=True, index=True)  # greenhouse, nursery, etc.

    # Client information
    client_name = Column(String(100), nullable=False, index=True)
    contact_person = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)

    # Order details
    order_date = Column(Date, nullable=False)
    requested_delivery = Column(Date, nullable=True)
    crop_type = Column(String(100), nullable=False, index=True)
    variety = Column(String(100), nullable=False, index=True)

    # Quantities
    total_quantity = Column(Integer, nullable=False)
    completed_quantity = Column(Integer, default=0, nullable=False)
    current_stage_quantity = Column(Integer, nullable=False)

    # Propagation details
    propagation_method = Column(String(50), nullable=False)  # seed, cutting, grafting
    unit_price = Column(Float, nullable=True)
    total_value = Column(Float, nullable=True)
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, urgent

    # Additional information
    notes = Column(JSON, nullable=True, default=list)
    specifications = Column(JSON, nullable=True, default=dict)

    # Enhanced features from Florisynergy implementation
    budwood_calculation = Column(JSON, nullable=True)
    worker_assignments = Column(JSON, nullable=True)
    stage_validation = Column(JSON, nullable=True)

    # Stage history (JSON field)
    stage_history = Column(JSON, nullable=True, default=list)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="orders")
    owner = relationship("User", back_populates="orders")
    tasks = relationship("Task", back_populates="order", cascade="all, delete-orphan")
    budwood_records = relationship("BudwoodCollection", back_populates="order", cascade="all, delete-orphan")
    grafting_records = relationship("GraftingRecord", back_populates="order", cascade="all, delete-orphan")
    transfer_records = relationship("TransferRecord", back_populates="order", cascade="all, delete-orphan")
    stage_history_records = relationship("OrderStageHistory", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order(id={self.id}, order_number={self.order_number}, status={self.status}, client={self.client_name})>"


class OrderStageHistory(Base):
    """Order stage history model for tracking stage transitions"""

    __tablename__ = "order_stage_history"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False)

    # Stage information
    stage = Column(String(50), nullable=False)
    date = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False)
    operator = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    # Enhanced worker performance tracking
    worker_performance = Column(JSON, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", back_populates="stage_history_records")

    def __repr__(self):
        return f"<OrderStageHistory(id={self.id}, order_id={self.order_id}, stage={self.stage}, date={self.date})>"