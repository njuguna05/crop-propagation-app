from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON, Enum as SQLEnum, func, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class TenantRole(str, enum.Enum):
    """Roles for tenant users"""
    OWNER = "owner"        # Full control, can delete tenant
    ADMIN = "admin"        # Can manage users and all data
    MEMBER = "member"      # Can create and edit data
    VIEWER = "viewer"      # Read-only access


class Tenant(Base):
    """Tenant model for multi-tenancy support"""

    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    
    # Organization details
    name = Column(String(100), nullable=False, index=True)
    subdomain = Column(String(50), unique=True, nullable=True, index=True)  # Optional subdomain
    description = Column(Text, nullable=True)
    
    # Contact information
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Subscription/billing (for future use)
    subscription_tier = Column(String(50), default="free", nullable=False)  # free, basic, premium, enterprise
    subscription_status = Column(String(50), default="active", nullable=False)  # active, suspended, cancelled
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Settings stored as JSON
    settings = Column(JSON, nullable=True, default=dict)
    # Example settings structure:
    # {
    #     "timezone": "UTC",
    #     "currency": "USD",
    #     "date_format": "YYYY-MM-DD",
    #     "language": "en",
    #     "features": {
    #         "analytics": true,
    #         "advanced_reporting": false
    #     }
    # }
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tenant_users = relationship("TenantUser", back_populates="tenant", cascade="all, delete-orphan")
    crops = relationship("Crop", back_populates="tenant", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="tenant", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="tenant", cascade="all, delete-orphan")
    budwood_records = relationship("BudwoodCollection", back_populates="tenant", cascade="all, delete-orphan")
    grafting_records = relationship("GraftingRecord", back_populates="tenant", cascade="all, delete-orphan")
    transfer_records = relationship("TransferRecord", back_populates="tenant", cascade="all, delete-orphan")
    customers = relationship("Customer", back_populates="tenant", cascade="all, delete-orphan")
    suppliers = relationship("Supplier", back_populates="tenant", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Tenant(id={self.id}, name={self.name}, subdomain={self.subdomain})>"


class TenantUser(Base):
    """Association table for tenant-user many-to-many relationship with roles"""

    __tablename__ = "tenant_users"
    __table_args__ = (
        UniqueConstraint('tenant_id', 'user_id', name='uq_tenant_user'),
    )

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Role within this tenant
    role = Column(SQLEnum(TenantRole), nullable=False, default=TenantRole.MEMBER)
    
    # Invitation details
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    joined_at = Column(DateTime(timezone=True), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="tenant_users")
    user = relationship("User", foreign_keys=[user_id], back_populates="tenant_memberships")
    inviter = relationship("User", foreign_keys=[invited_by])

    def __repr__(self):
        return f"<TenantUser(tenant_id={self.tenant_id}, user_id={self.user_id}, role={self.role})>"
