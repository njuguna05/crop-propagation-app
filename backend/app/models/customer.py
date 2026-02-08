from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from ..core.database import Base


class Customer(Base):
    __tablename__ = "customers"

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
    customer_type = Column(String(50), default="retail")  # retail, wholesale, nursery
    tax_id = Column(String(50))
    payment_terms = Column(String(50), default="net_30")  # net_30, net_15, cash, etc.
    credit_limit = Column(Integer, default=0)
    notes = Column(Text)
    is_active = Column(String(10), default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())