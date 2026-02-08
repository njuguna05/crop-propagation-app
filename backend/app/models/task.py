from sqlalchemy import Column, Integer, String, Date, DateTime, Text, Boolean, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Task(Base):
    """Task model for crop and order management tasks"""

    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=True)  # Optional: general tasks don't need crop
    order_id = Column(String(50), ForeignKey("orders.id"), nullable=True)  # Optional: order-specific tasks

    # Task details
    task = Column(String(200), nullable=False, index=True)
    due_date = Column(Date, nullable=False, index=True)
    completed = Column(Boolean, default=False, nullable=False, index=True)
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, urgent

    # Additional information
    notes = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="tasks")
    crop = relationship("Crop", back_populates="tasks")
    order = relationship("Order", back_populates="tasks")

    def __repr__(self):
        return f"<Task(id={self.id}, task={self.task}, due_date={self.due_date}, completed={self.completed})>"