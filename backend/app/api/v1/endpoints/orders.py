from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.core.database import get_db
from app.models.order import Order, OrderStageHistory
from app.schemas.order import (
    OrderCreate, OrderUpdate, OrderResponse, OrderStatusUpdate,
    OrderTransfer, HealthAssessment, OrderStats
)
from app.schemas.common import MessageResponse
from app.dependencies import CurrentUserDep


router = APIRouter()


def generate_order_number(year: int, sequence: int) -> str:
    """Generate order number in format PO-YYYY-XXX"""
    return f"PO-{year}-{sequence:03d}"


@router.get("/", response_model=List[OrderResponse])
async def get_orders(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db),
    since: Optional[datetime] = Query(None, description="Get orders updated since this timestamp"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    current_section: Optional[str] = Query(None, description="Filter by current section"),
    client_name: Optional[str] = Query(None, description="Filter by client name"),
    crop_type: Optional[str] = Query(None, description="Filter by crop type"),
    variety: Optional[str] = Query(None, description="Filter by variety"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """
    Get orders with filtering and incremental sync support
    """
    query = select(Order).where(Order.user_id == current_user.id)

    # Add filters
    if since:
        query = query.where(Order.updated_at > since)
    if status_filter:
        query = query.where(Order.status == status_filter)
    if current_section:
        query = query.where(Order.current_section == current_section)
    if client_name:
        query = query.where(Order.client_name.ilike(f"%{client_name}%"))
    if crop_type:
        query = query.where(Order.crop_type.ilike(f"%{crop_type}%"))
    if variety:
        query = query.where(Order.variety.ilike(f"%{variety}%"))

    # Add pagination and ordering
    query = (query.offset(skip).limit(limit)
             .order_by(Order.order_date.desc())
             .options(selectinload(Order.stage_history_records)))

    result = await db.execute(query)
    orders = result.scalars().all()

    return orders


@router.post("/", response_model=OrderResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new propagation order
    """
    # Get current year for order numbering
    current_year = date.today().year

    # Get the next sequence number for this year
    count_result = await db.execute(
        select(func.count(Order.id))
        .where(
            and_(
                Order.user_id == current_user.id,
                Order.order_number.like(f"PO-{current_year}-%")
            )
        )
    )
    sequence = count_result.scalar() + 1

    # Generate order number and ID
    order_number = generate_order_number(current_year, sequence)
    order_id = order_number

    # Calculate total value
    total_value = None
    if order_data.unit_price:
        total_value = order_data.total_quantity * order_data.unit_price

    # Create initial stage history
    initial_stage = {
        "stage": "order_created",
        "date": date.today().isoformat(),
        "quantity": order_data.total_quantity,
        "operator": "System"
    }

    # Create order instance
    db_order = Order(
        id=order_id,
        user_id=current_user.id,
        order_number=order_number,
        status="order_created",
        order_date=date.today(),
        completed_quantity=0,
        current_stage_quantity=order_data.total_quantity,
        total_value=total_value,
        stage_history=[initial_stage],
        **order_data.model_dump()
    )

    db.add(db_order)

    # Create stage history record
    stage_history_record = OrderStageHistory(
        order_id=order_id,
        stage="order_created",
        date=date.today(),
        quantity=order_data.total_quantity,
        operator="System"
    )
    db.add(stage_history_record)

    await db.commit()
    await db.refresh(db_order)

    return db_order


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: str,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific order with stage history
    """
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == current_user.id)
        ).options(
            selectinload(Order.stage_history_records),
            selectinload(Order.tasks),
            selectinload(Order.transfer_records)
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    return order


@router.put("/{order_id}", response_model=OrderResponse)
async def update_order(
    order_id: str,
    order_update: OrderUpdate,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Update order details
    """
    # Get existing order
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == current_user.id)
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Update order fields
    update_data = order_update.model_dump(exclude_unset=True)

    # Recalculate total value if quantity or unit price changed
    if "total_quantity" in update_data or "unit_price" in update_data:
        new_quantity = update_data.get("total_quantity", order.total_quantity)
        new_unit_price = update_data.get("unit_price", order.unit_price)
        if new_unit_price:
            update_data["total_value"] = new_quantity * new_unit_price

    for field, value in update_data.items():
        setattr(order, field, value)

    await db.commit()
    await db.refresh(order)

    return order


@router.patch("/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Update order status and log stage history
    """
    # Get existing order
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == current_user.id)
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Update status
    old_status = order.status
    order.status = status_update.status

    # Add to stage history
    stage_entry = {
        "stage": status_update.status,
        "date": date.today().isoformat(),
        "quantity": order.current_stage_quantity,
        "operator": current_user.username,
        "notes": status_update.notes
    }

    if order.stage_history:
        order.stage_history = order.stage_history + [stage_entry]
    else:
        order.stage_history = [stage_entry]
    flag_modified(order, "stage_history")

    # Create stage history record
    stage_history_record = OrderStageHistory(
        order_id=order_id,
        stage=status_update.status,
        date=date.today(),
        quantity=order.current_stage_quantity,
        operator=current_user.username,
        notes=status_update.notes
    )
    db.add(stage_history_record)

    await db.commit()
    await db.refresh(order)

    return order


@router.post("/{order_id}/transfer", response_model=OrderResponse)
async def transfer_order_stage(
    order_id: str,
    transfer_data: OrderTransfer,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Transfer order between stages/sections
    """
    # Get existing order
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == current_user.id)
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Validate transfer quantity
    if transfer_data.quantity > order.current_stage_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer quantity exceeds current stage quantity"
        )

    # Update order
    order.status = transfer_data.to_stage
    order.current_section = transfer_data.to_section
    order.current_stage_quantity = transfer_data.quantity

    # Add to stage history
    stage_entry = {
        "stage": transfer_data.to_stage,
        "date": date.today().isoformat(),
        "quantity": transfer_data.quantity,
        "operator": transfer_data.operator,
        "notes": transfer_data.notes
    }

    if order.stage_history:
        order.stage_history = order.stage_history + [stage_entry]
    else:
        order.stage_history = [stage_entry]
    flag_modified(order, "stage_history")

    # Create stage history record
    stage_history_record = OrderStageHistory(
        order_id=order_id,
        stage=transfer_data.to_stage,
        date=date.today(),
        quantity=transfer_data.quantity,
        operator=transfer_data.operator,
        notes=transfer_data.notes
    )
    db.add(stage_history_record)

    # Create transfer record (this will be handled by records endpoint)
    # For now, just commit the order changes

    await db.commit()
    await db.refresh(order)

    return order


@router.post("/{order_id}/health-assessment", response_model=OrderResponse)
async def record_health_assessment(
    order_id: str,
    health_data: HealthAssessment,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Record plant losses/health assessment
    """
    # Get existing order
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == current_user.id)
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Validate lost quantity
    if health_data.lost_quantity > order.current_stage_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Lost quantity exceeds current stage quantity"
        )

    # Update current stage quantity
    new_quantity = order.current_stage_quantity - health_data.lost_quantity
    order.current_stage_quantity = max(0, new_quantity)

    # Add health assessment note to stage history
    stage_entry = {
        "stage": f"{order.status}_health_assessment",
        "date": date.today().isoformat(),
        "quantity": order.current_stage_quantity,
        "operator": current_user.username,
        "notes": f"Health assessment: {health_data.lost_quantity} plants lost. {health_data.notes or ''}"
    }

    if order.stage_history:
        order.stage_history = order.stage_history + [stage_entry]
    else:
        order.stage_history = [stage_entry]
    flag_modified(order, "stage_history")

    await db.commit()
    await db.refresh(order)

    return order


@router.delete("/{order_id}", response_model=MessageResponse)
async def delete_order(
    order_id: str,
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an order
    """
    # Get existing order
    result = await db.execute(
        select(Order).where(
            and_(Order.id == order_id, Order.user_id == current_user.id)
        )
    )
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    await db.delete(order)
    await db.commit()

    return MessageResponse(message="Order deleted successfully")


@router.get("/stats/overview", response_model=OrderStats)
async def get_order_statistics(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get order statistics and overview
    """
    user_filter = Order.user_id == current_user.id

    # Total orders
    total_result = await db.execute(
        select(func.count(Order.id)).where(user_filter)
    )
    total_orders = total_result.scalar()

    # Active orders (not completed/cancelled)
    active_result = await db.execute(
        select(func.count(Order.id)).where(
            and_(user_filter, ~Order.status.in_(["completed", "cancelled", "delivered"]))
        )
    )
    active_orders = active_result.scalar()

    # Completed orders
    completed_result = await db.execute(
        select(func.count(Order.id)).where(
            and_(user_filter, Order.status.in_(["completed", "delivered"]))
        )
    )
    completed_orders = completed_result.scalar()

    # Total plants and revenue
    totals_result = await db.execute(
        select(
            func.sum(Order.current_stage_quantity),
            func.sum(Order.total_value)
        ).where(user_filter)
    )
    total_plants, total_revenue = totals_result.first()
    total_plants = total_plants or 0
    total_revenue = float(total_revenue or 0)

    # By status
    status_result = await db.execute(
        select(Order.status, func.count(Order.id))
        .where(user_filter)
        .group_by(Order.status)
    )
    by_status = {status: count for status, count in status_result.all()}

    # By section
    section_result = await db.execute(
        select(Order.current_section, func.count(Order.id))
        .where(and_(user_filter, Order.current_section.isnot(None)))
        .group_by(Order.current_section)
    )
    by_section = {section: count for section, count in section_result.all()}

    # By crop type
    crop_result = await db.execute(
        select(Order.crop_type, func.count(Order.id))
        .where(user_filter)
        .group_by(Order.crop_type)
    )
    by_crop_type = {crop_type: count for crop_type, count in crop_result.all()}

    return OrderStats(
        total_orders=total_orders,
        active_orders=active_orders,
        completed_orders=completed_orders,
        total_plants=total_plants,
        total_revenue=total_revenue,
        by_status=by_status,
        by_section=by_section,
        by_crop_type=by_crop_type
    )