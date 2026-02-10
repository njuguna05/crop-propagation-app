from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime, date, timedelta
from app.core.database import get_db
from app.models.crop import Crop
from app.models.task import Task
from app.schemas.crop import CropCreate, CropUpdate, CropResponse, CropStats
from app.schemas.common import MessageResponse, PaginatedResponse
from app.dependencies import CurrentUserDep, CurrentTenantDep


router = APIRouter()


@router.get("/", response_model=List[CropResponse])
async def get_crops(
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db),
    since: Optional[datetime] = Query(None, description="Get crops updated since this timestamp"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return")
):
    """
    Get crops with optional incremental sync support
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
        
    query = select(Crop).where(Crop.tenant_id == current_tenant.id)

    # Add timestamp filter for incremental sync
    if since:
        query = query.where(Crop.updated_at > since)

    # Add pagination
    query = query.offset(skip).limit(limit).order_by(Crop.updated_at.desc())

    result = await db.execute(query)
    crops = result.scalars().all()

    return crops


@router.post("/", response_model=CropResponse)
async def create_crop(
    crop_data: CropCreate,
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new crop
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )

    # Create crop instance
    db_crop = Crop(
        user_id=current_user.id,
        tenant_id=current_tenant.id,
        **crop_data.model_dump()
    )

    db.add(db_crop)
    await db.commit()
    await db.refresh(db_crop)

    return db_crop


@router.get("/{crop_id}", response_model=CropResponse)
async def get_crop(
    crop_id: int,
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific crop by ID
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )
        
    result = await db.execute(
        select(Crop).where(
            and_(Crop.id == crop_id, Crop.tenant_id == current_tenant.id)
        ).options(selectinload(Crop.tasks))
    )
    crop = result.scalar_one_or_none()

    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found"
        )

    return crop


@router.put("/{crop_id}", response_model=CropResponse)
async def update_crop(
    crop_id: int,
    crop_update: CropUpdate,
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Update crop details
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )

    # Get existing crop
    result = await db.execute(
        select(Crop).where(
            and_(Crop.id == crop_id, Crop.tenant_id == current_tenant.id)
        )
    )
    crop = result.scalar_one_or_none()

    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found"
        )

    # Update crop fields
    update_data = crop_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(crop, field, value)

    await db.commit()
    await db.refresh(crop)

    return crop


@router.delete("/{crop_id}", response_model=MessageResponse)
async def delete_crop(
    crop_id: int,
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a crop
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )

    # Get existing crop
    result = await db.execute(
        select(Crop).where(
            and_(Crop.id == crop_id, Crop.tenant_id == current_tenant.id)
        )
    )
    crop = result.scalar_one_or_none()

    if not crop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Crop not found"
        )

    await db.delete(crop)
    await db.commit()

    return MessageResponse(message="Crop deleted successfully")


@router.get("/stats/overview", response_model=CropStats)
async def get_crop_statistics(
    current_user: CurrentUserDep,
    current_tenant: CurrentTenantDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get crop statistics and overview
    """
    if not current_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant context required"
        )

    # Total crops
    total_result = await db.execute(
        select(func.count(Crop.id)).where(Crop.tenant_id == current_tenant.id)
    )
    total_crops = total_result.scalar()

    # By stage
    stage_result = await db.execute(
        select(Crop.current_stage, func.count(Crop.id))
        .where(Crop.tenant_id == current_tenant.id)
        .group_by(Crop.current_stage)
    )
    by_stage = {stage: count for stage, count in stage_result.all()}

    # By propagation method
    method_result = await db.execute(
        select(Crop.propagation_method, func.count(Crop.id))
        .where(Crop.tenant_id == current_tenant.id)
        .group_by(Crop.propagation_method)
    )
    by_propagation_method = {method: count for method, count in method_result.all()}

    # By variety
    variety_result = await db.execute(
        select(Crop.variety, func.count(Crop.id))
        .where(Crop.tenant_id == current_tenant.id)
        .group_by(Crop.variety)
    )
    by_variety = {variety: count for variety, count in variety_result.all()}

    # Recent plantings (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    recent_result = await db.execute(
        select(func.count(Crop.id))
        .where(
            and_(
                Crop.tenant_id == current_tenant.id,
                Crop.planted_date >= thirty_days_ago
            )
        )
    )
    recent_plantings = recent_result.scalar()

    return CropStats(
        total_crops=total_crops,
        by_stage=by_stage,
        by_propagation_method=by_propagation_method,
        by_variety=by_variety,
        recent_plantings=recent_plantings
    )