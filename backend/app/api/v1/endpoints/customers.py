from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.models.customer import Customer
from app.schemas.customer import Customer as CustomerSchema, CustomerCreate, CustomerUpdate, CustomerSummary

router = APIRouter()


@router.get("/", response_model=List[CustomerSchema])
async def get_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, description="Search by company name, contact person, or email"),
    customer_type: Optional[str] = Query(None, description="Filter by customer type"),
    is_active: Optional[str] = Query("true", description="Filter by active status"),
    db: AsyncSession = Depends(get_db)
):
    """Get all customers with optional filtering and search"""
    query = select(Customer)

    # Filter by active status
    if is_active is not None:
        query = query.where(Customer.is_active == is_active)

    # Filter by customer type
    if customer_type:
        query = query.where(Customer.customer_type == customer_type)

    # Search across multiple fields
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Customer.company_name.ilike(search_term),
                Customer.contact_person.ilike(search_term),
                Customer.email.ilike(search_term)
            )
        )

    # Order by company name
    query = query.order_by(Customer.company_name).offset(skip).limit(limit)

    result = await db.execute(query)
    customers = result.scalars().all()
    return customers


@router.get("/summary", response_model=List[CustomerSummary])
async def get_customers_summary(
    search: Optional[str] = Query(None, description="Search by company name or contact person"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get customer summary for dropdowns and autocomplete"""
    query = select(Customer).where(Customer.is_active == "true")

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Customer.company_name.ilike(search_term),
                Customer.contact_person.ilike(search_term)
            )
        )

    query = query.order_by(Customer.company_name).limit(limit)

    result = await db.execute(query)
    customers = result.scalars().all()
    return customers


@router.get("/{customer_id}", response_model=CustomerSchema)
async def get_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific customer by ID"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.post("/", response_model=CustomerSchema)
async def create_customer(customer_data: CustomerCreate, db: AsyncSession = Depends(get_db)):
    """Create a new customer"""
    # Check if customer with same company name already exists
    result = await db.execute(
        select(Customer).where(Customer.company_name == customer_data.company_name)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this company name already exists")

    customer = Customer(**customer_data.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.put("/{customer_id}", response_model=CustomerSchema)
async def update_customer(customer_id: int, customer_data: CustomerUpdate, db: AsyncSession = Depends(get_db)):
    """Update an existing customer"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Update only provided fields
    update_data = customer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)

    await db.commit()
    await db.refresh(customer)
    return customer


@router.delete("/{customer_id}")
async def delete_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """Soft delete a customer (set is_active to false)"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.is_active = "false"
    await db.commit()
    return {"message": "Customer deactivated successfully"}


@router.post("/{customer_id}/activate")
async def activate_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    """Reactivate a deactivated customer"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.is_active = "true"
    await db.commit()
    return {"message": "Customer activated successfully"}
