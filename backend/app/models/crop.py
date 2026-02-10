from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Crop(Base):
    """Crop model for tracking individual crop propagation"""

    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Basic crop information
    name = Column(String(100), nullable=False, index=True)
    variety = Column(String(100), nullable=False, index=True)
    propagation_method = Column(String(50), nullable=False)  # seed, cutting, grafting, etc.

    # Current status
    current_stage = Column(String(50), nullable=False, index=True)  # planted, germinated, etc.
    location = Column(String(100), nullable=True)

    # Dates
    planted_date = Column(Date, nullable=False)
    expected_germination = Column(Date, nullable=True)

    # Environmental conditions
    temperature = Column(Float, nullable=True)  # Celsius
    humidity = Column(Float, nullable=True)     # Percentage
    watered = Column(Date, nullable=True)       # Last watered date

    # Additional information
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    tenant = relationship("Tenant", back_populates="crops")
    owner = relationship("User", back_populates="crops")
    tasks = relationship("Task", back_populates="crop", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Crop(id={self.id}, name={self.name}, variety={self.variety}, stage={self.current_stage})>"