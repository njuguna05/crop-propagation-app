from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.core.database import get_db
from app.models.records import BudwoodCollection, GraftingRecord, TransferRecord
from app.models.order import Order
from app.schemas.records import (
    BudwoodCollectionCreate, BudwoodCollectionUpdate, BudwoodCollectionResponse,
    GraftingRecordCreate, GraftingRecordUpdate, GraftingRecordResponse,
    TransferRecordCreate, TransferRecordUpdate, TransferRecordResponse,
    BudwoodStats, GraftingStats, TransferStats
)
from app.schemas.common import MessageResponse
from app.schemas.common import MessageResponse
from app.dependencies import CurrentUserDep, CurrentTenantDep


router = APIRouter()


def generate_record_id(prefix: str) -> str:
    """Generate record ID with timestamp"""
    timestamp = int(datetime.now().timestamp() * 1000)
    return f"{prefix}-{timestamp}"


# Budwood Collection Endpoints
@router.get("/budwood", response_model=List[BudwoodCollectionResponse])
async def get_budwood_records(
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db),
    since: Optional[datetime] = Query(None, description="Get records updated since this timestamp"),
    order_id: Optional[str] = Query(None, description="Filter by order ID"),
    variety: Optional[str] = Query(None, description="Filter by variety"),
    operator: Optional[str] = Query(None, description="Filter by operator"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """
    Get budwood collection records with filtering
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
        
    query = select(BudwoodCollection).where(BudwoodCollection.tenant_id == current_tenant.id)

    # Add filters
    if since:
        query = query.where(BudwoodCollection.updated_at > since)
    if order_id:
        query = query.where(BudwoodCollection.order_id == order_id)
    if variety:
        query = query.where(BudwoodCollection.variety.ilike(f"%{variety}%"))
    if operator:
        query = query.where(BudwoodCollection.operator.ilike(f"%{operator}%"))

    # Add pagination and ordering
    query = query.offset(skip).limit(limit).order_by(BudwoodCollection.harvest_date.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    return records


@router.post("/budwood", response_model=BudwoodCollectionResponse)
async def create_budwood_record(
    record_data: BudwoodCollectionCreate,
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Record budwood collection
    """
    # Validate order exists if provided
    if record_data.order_id:
        order_result = await db.execute(
            select(Order).where(
                and_(Order.id == record_data.order_id, Order.tenant_id == current_tenant.id)
            )
        )
        if not order_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order not found or not accessible"
            )

    # Generate record ID
    record_id = generate_record_id("BW")

    # Create record instance
    db_record = BudwoodCollection(
        id=record_id,
        user_id=current_user.id,
        tenant_id=current_tenant.id,
        **record_data.model_dump()
    )

    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)

    return db_record


@router.get("/budwood/{record_id}", response_model=BudwoodCollectionResponse)
async def get_budwood_record(
    record_id: str,
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific budwood collection record
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
        
    result = await db.execute(
        select(BudwoodCollection).where(
            and_(BudwoodCollection.id == record_id, BudwoodCollection.tenant_id == current_tenant.id)
        ).options(selectinload(BudwoodCollection.order))
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budwood record not found"
        )

    return record


@router.put("/budwood/{record_id}", response_model=BudwoodCollectionResponse)
async def update_budwood_record(
    record_id: str,
    record_update: BudwoodCollectionUpdate,
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Update budwood collection record
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )

    # Get existing record
    result = await db.execute(
        select(BudwoodCollection).where(
            and_(BudwoodCollection.id == record_id, BudwoodCollection.tenant_id == current_tenant.id)
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budwood record not found"
        )

    # Validate order if being updated
    if record_update.order_id and record_update.order_id != record.order_id:
        order_result = await db.execute(
            select(Order).where(
                and_(Order.id == record_update.order_id, Order.tenant_id == current_tenant.id)
            )
        )
        if not order_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order not found or not accessible"
            )

    # Update record fields
    update_data = record_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    await db.commit()
    await db.refresh(record)

    return record


# Grafting Records Endpoints
@router.get("/grafting", response_model=List[GraftingRecordResponse])
async def get_grafting_records(
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db),
    since: Optional[datetime] = Query(None, description="Get records updated since this timestamp"),
    order_id: Optional[str] = Query(None, description="Filter by order ID"),
    technique: Optional[str] = Query(None, description="Filter by technique"),
    operator: Optional[str] = Query(None, description="Filter by operator"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """
    Get grafting operation records with filtering
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
        
    query = select(GraftingRecord).where(GraftingRecord.tenant_id == current_tenant.id)

    # Add filters
    if since:
        query = query.where(GraftingRecord.updated_at > since)
    if order_id:
        query = query.where(GraftingRecord.order_id == order_id)
    if technique:
        query = query.where(GraftingRecord.technique.ilike(f"%{technique}%"))
    if operator:
        query = query.where(GraftingRecord.operator.ilike(f"%{operator}%"))

    # Add pagination and ordering
    query = query.offset(skip).limit(limit).order_by(GraftingRecord.date.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    return records


@router.post("/grafting", response_model=GraftingRecordResponse)
async def create_grafting_record(
    record_data: GraftingRecordCreate,
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Record grafting operation
    """
    # Validate order exists if provided
    if record_data.order_id:
        order_result = await db.execute(
            select(Order).where(
                and_(Order.id == record_data.order_id, Order.user_id == current_user.id)
            )
        )
        if not order_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Order not found or not accessible"
            )

    # Validate budwood collection exists if provided
    if record_data.budwood_collection_id:
        budwood_result = await db.execute(
            select(BudwoodCollection).where(
                and_(
                    BudwoodCollection.id == record_data.budwood_collection_id,
                    BudwoodCollection.tenant_id == current_tenant.id
                )
            )
        )
        if not budwood_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Budwood collection not found or not accessible"
            )

    # Calculate success rate
    if record_data.quantity > 0:
        success_rate = (record_data.success_count / record_data.quantity) * 100
    else:
        success_rate = 0.0

    # Generate record ID
    record_id = generate_record_id("GR")

    # Create record instance
    db_record = GraftingRecord(
        id=record_id,
        user_id=current_user.id,
        tenant_id=current_tenant.id,
        success_rate=success_rate,
        **record_data.model_dump()
    )

    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)

    return db_record


# Transfer Records Endpoints
@router.get("/transfers", response_model=List[TransferRecordResponse])
async def get_transfer_records(
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db),
    since: Optional[datetime] = Query(None, description="Get records updated since this timestamp"),
    order_id: Optional[str] = Query(None, description="Filter by order ID"),
    from_section: Optional[str] = Query(None, description="Filter by from section"),
    to_section: Optional[str] = Query(None, description="Filter by to section"),
    operator: Optional[str] = Query(None, description="Filter by operator"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """
    Get transfer records between stages with filtering
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
        
    query = select(TransferRecord).where(TransferRecord.tenant_id == current_tenant.id)

    # Add filters
    if since:
        query = query.where(TransferRecord.updated_at > since)
    if order_id:
        query = query.where(TransferRecord.order_id == order_id)
    if from_section:
        query = query.where(TransferRecord.from_section.ilike(f"%{from_section}%"))
    if to_section:
        query = query.where(TransferRecord.to_section.ilike(f"%{to_section}%"))
    if operator:
        query = query.where(TransferRecord.operator.ilike(f"%{operator}%"))

    # Add pagination and ordering
    query = query.offset(skip).limit(limit).order_by(TransferRecord.transfer_date.desc())

    result = await db.execute(query)
    records = result.scalars().all()

    return records


@router.post("/transfers", response_model=TransferRecordResponse)
async def create_transfer_record(
    record_data: TransferRecordCreate,
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Record transfer between stages
    """
    # Validate order exists
    order_result = await db.execute(
        select(Order).where(
            and_(Order.id == record_data.order_id, Order.tenant_id == current_tenant.id)
        )
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order not found or not accessible"
        )

    # Generate record ID
    record_id = generate_record_id("TR")

    # Create record instance
    db_record = TransferRecord(
        id=record_id,
        user_id=current_user.id,
        tenant_id=current_tenant.id,
        **record_data.model_dump()
    )

    db.add(db_record)
    await db.commit()
    await db.refresh(db_record)

    return db_record


# Statistics Endpoints
@router.get("/budwood/stats", response_model=BudwoodStats)
async def get_budwood_statistics(
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get budwood collection statistics
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
        
    user_filter = BudwoodCollection.tenant_id == current_tenant.id

    # Total collections and quantity
    totals_result = await db.execute(
        select(
            func.count(BudwoodCollection.id),
            func.sum(BudwoodCollection.quantity),
            func.avg(BudwoodCollection.quality_score)
        ).where(user_filter)
    )
    total_collections, total_quantity, avg_quality = totals_result.first()
    total_collections = total_collections or 0
    total_quantity = total_quantity or 0
    avg_quality = float(avg_quality or 0)

    # By variety
    variety_result = await db.execute(
        select(BudwoodCollection.variety, func.sum(BudwoodCollection.quantity))
        .where(user_filter)
        .group_by(BudwoodCollection.variety)
    )
    by_variety = {variety: quantity for variety, quantity in variety_result.all()}

    # Recent collections (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    recent_result = await db.execute(
        select(func.count(BudwoodCollection.id))
        .where(
            and_(user_filter, BudwoodCollection.harvest_date >= thirty_days_ago)
        )
    )
    recent_collections = recent_result.scalar()

    return BudwoodStats(
        total_collections=total_collections,
        total_quantity=total_quantity,
        average_quality=avg_quality,
        by_variety=by_variety,
        recent_collections=recent_collections
    )


@router.get("/grafting/stats", response_model=GraftingStats)
async def get_grafting_statistics(
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get grafting operation statistics
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
    
    user_filter = GraftingRecord.tenant_id == current_tenant.id

    # Total grafts and success
    totals_result = await db.execute(
        select(
            func.sum(GraftingRecord.quantity),
            func.sum(GraftingRecord.success_count),
            func.avg(GraftingRecord.success_rate)
        ).where(user_filter)
    )
    total_grafts, total_successful, overall_success_rate = totals_result.first()
    total_grafts = total_grafts or 0
    total_successful = total_successful or 0
    overall_success_rate = float(overall_success_rate or 0)

    # By technique
    technique_result = await db.execute(
        select(
            GraftingRecord.technique,
            func.sum(GraftingRecord.quantity),
            func.avg(GraftingRecord.success_rate)
        )
        .where(user_filter)
        .group_by(GraftingRecord.technique)
    )
    by_technique = {
        technique: {"count": count, "success_rate": float(success_rate)}
        for technique, count, success_rate in technique_result.all()
    }

    # By variety
    variety_result = await db.execute(
        select(
            GraftingRecord.scion_variety,
            func.sum(GraftingRecord.quantity),
            func.avg(GraftingRecord.success_rate)
        )
        .where(user_filter)
        .group_by(GraftingRecord.scion_variety)
    )
    by_variety = {
        variety: {"count": count, "success_rate": float(success_rate)}
        for variety, count, success_rate in variety_result.all()
    }

    # Recent grafts (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    recent_result = await db.execute(
        select(func.sum(GraftingRecord.quantity))
        .where(
            and_(user_filter, GraftingRecord.date >= thirty_days_ago)
        )
    )
    recent_grafts = recent_result.scalar() or 0

    return GraftingStats(
        total_grafts=total_grafts,
        total_successful=total_successful,
        overall_success_rate=overall_success_rate,
        by_technique=by_technique,
        by_variety=by_variety,
        recent_grafts=recent_grafts
    )


@router.get("/transfers/stats", response_model=TransferStats)
async def get_transfer_statistics(
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get transfer operation statistics
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )

    user_filter = TransferRecord.tenant_id == current_tenant.id

    # Total transfers and quantities
    totals_result = await db.execute(
        select(
            func.count(TransferRecord.id),
            func.sum(TransferRecord.quantity),
            func.avg(TransferRecord.survival_rate)
        ).where(user_filter)
    )
    total_transfers, total_quantity, avg_survival_rate = totals_result.first()
    total_transfers = total_transfers or 0
    total_quantity = total_quantity or 0
    avg_survival_rate = float(avg_survival_rate or 0)

    # By section
    section_result = await db.execute(
        select(TransferRecord.to_section, func.count(TransferRecord.id))
        .where(user_filter)
        .group_by(TransferRecord.to_section)
    )
    by_section = {section: count for section, count in section_result.all()}

    # By stage
    stage_result = await db.execute(
        select(TransferRecord.to_stage, func.count(TransferRecord.id))
        .where(user_filter)
        .group_by(TransferRecord.to_stage)
    )
    by_stage = {stage: count for stage, count in stage_result.all()}

    # Recent transfers (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    recent_result = await db.execute(
        select(func.count(TransferRecord.id))
        .where(
            and_(user_filter, TransferRecord.transfer_date >= thirty_days_ago)
        )
    )
    recent_transfers = recent_result.scalar()

    return TransferStats(
        total_transfers=total_transfers,
        total_quantity_transferred=total_quantity,
        average_survival_rate=avg_survival_rate,
        by_section=by_section,
        by_stage=by_stage,
        recent_transfers=recent_transfers
    )