from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class BudwoodCollection(Base):
    """Budwood collection records for grafting operations"""

    __tablename__ = "budwood_collection"

    id = Column(String(50), primary_key=True, index=True)  # BW-timestamp format
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=True)

    # Collection details
    mother_tree_id = Column(String(50), nullable=True)
    variety = Column(String(100), nullable=False, index=True)
    harvest_date = Column(Date, nullable=False, index=True)
    quantity = Column(Integer, nullable=False)  # Number of budwood pieces
    quality_score = Column(Float, nullable=True)  # 1-10 quality rating
    operator = Column(String(100), nullable=False)

    # Storage information
    storage_location = Column(String(100), nullable=True)
    storage_temperature = Column(Float, nullable=True)
    storage_humidity = Column(Float, nullable=True)

    # Additional information
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="budwood_records")
    owner = relationship("User", back_populates="budwood_records")
    order = relationship("Order", back_populates="budwood_records")

    def __repr__(self):
        return f"<BudwoodCollection(id={self.id}, variety={self.variety}, quantity={self.quantity}, date={self.harvest_date})>"


class GraftingRecord(Base):
    """Grafting operation records"""

    __tablename__ = "grafting_records"

    id = Column(String(50), primary_key=True, index=True)  # GR-timestamp format
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=True)
    budwood_collection_id = Column(String(50), ForeignKey("budwood_collection.id"), nullable=True)

    # Grafting details
    date = Column(Date, nullable=False, index=True)
    operator = Column(String(100), nullable=False)
    technique = Column(String(50), nullable=False)  # whip, cleft, bark, etc.
    rootstock_type = Column(String(100), nullable=False)
    scion_variety = Column(String(100), nullable=False)

    # Results
    quantity = Column(Integer, nullable=False)  # Number of grafts attempted
    success_count = Column(Integer, nullable=False)  # Number of successful grafts
    success_rate = Column(Float, nullable=False)  # Calculated percentage

    # Environmental conditions
    temperature = Column(Float, nullable=True)
    humidity = Column(Float, nullable=True)

    # Additional information
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="grafting_records")
    owner = relationship("User", back_populates="grafting_records")
    order = relationship("Order", back_populates="grafting_records")
    budwood_collection = relationship("BudwoodCollection")

    def __repr__(self):
        return f"<GraftingRecord(id={self.id}, technique={self.technique}, quantity={self.quantity}, success_rate={self.success_rate})>"


class TransferRecord(Base):
    """Transfer records for stage-to-stage movement"""

    __tablename__ = "transfer_records"

    id = Column(String(50), primary_key=True, index=True)  # TR-timestamp format
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=False)

    # Transfer details
    from_section = Column(String(50), nullable=False, index=True)
    to_section = Column(String(50), nullable=False, index=True)
    from_stage = Column(String(50), nullable=False)
    to_stage = Column(String(50), nullable=False)
    quantity = Column(Integer, nullable=False)
    transfer_date = Column(Date, nullable=False, index=True)
    operator = Column(String(100), nullable=False)

    # Quality assessment
    quality_score = Column(Float, nullable=True)  # 1-10 quality rating
    survival_rate = Column(Float, nullable=True)  # Percentage of plants that survived

    # Additional information
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="transfer_records")
    owner = relationship("User", back_populates="transfer_records")
    order = relationship("Order", back_populates="transfer_records")

    def __repr__(self):
        return f"<TransferRecord(id={self.id}, from={self.from_section}, to={self.to_section}, quantity={self.quantity})>"