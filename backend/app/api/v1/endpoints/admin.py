from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional, Dict
from datetime import datetime

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.tenant import Tenant, TenantUser
from app.models.crop import Crop
from app.models.order import Order
from pydantic import BaseModel


router = APIRouter()


class PlatformStats(BaseModel):
    total_tenants: int
    active_tenants: int
    total_users: int
    total_crops: int
    total_orders: int
    subscription_breakdown: Dict[str, int]  # Count by tier


class TenantListItem(BaseModel):
    id: int
    name: str
    subdomain: str
    is_active: bool
    subscription_tier: str
    subscription_status: str
    subscription_expires_at: Optional[str]
    user_count: int
    created_at: str


class SubscriptionUpdate(BaseModel):
    subscription_tier: Optional[str] = None
    subscription_status: Optional[str] = None
    subscription_expires_at: Optional[datetime] = None


class TenantStatusUpdate(BaseModel):
    is_active: bool


@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get platform-wide statistics.
    Only accessible by superusers.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can access platform statistics"
        )

    # Count tenants
    total_tenants_result = await db.execute(select(func.count(Tenant.id)))
    total_tenants = total_tenants_result.scalar()

    active_tenants_result = await db.execute(
        select(func.count(Tenant.id)).where(Tenant.is_active == True)
    )
    active_tenants = active_tenants_result.scalar()

    # Count users
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()

    # Count crops
    total_crops_result = await db.execute(select(func.count(Crop.id)))
    total_crops = total_crops_result.scalar()

    # Count orders
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_result.scalar()

    # Get subscription breakdown
    subscription_breakdown = {}
    for tier in ["free", "basic", "premium", "enterprise"]:
        count_result = await db.execute(
            select(func.count(Tenant.id)).where(Tenant.subscription_tier == tier)
        )
        subscription_breakdown[tier] = count_result.scalar() or 0

    return PlatformStats(
        total_tenants=total_tenants,
        active_tenants=active_tenants,
        total_users=total_users,
        total_crops=total_crops,
        total_orders=total_orders,
        subscription_breakdown=subscription_breakdown
    )


@router.get("/tenants", response_model=List[TenantListItem])
async def list_all_tenants(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all tenants in the platform.
    Only accessible by superusers.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can list all tenants"
        )

    # Get all tenants with user count
    result = await db.execute(
        select(Tenant, func.count(TenantUser.id).label('user_count'))
        .outerjoin(TenantUser, Tenant.id == TenantUser.tenant_id)
        .group_by(Tenant.id)
        .order_by(Tenant.created_at.desc())
    )

    tenant_list = []
    for tenant, user_count in result.all():
        tenant_list.append(
            TenantListItem(
                id=tenant.id,
                name=tenant.name,
                subdomain=tenant.subdomain or "",
                is_active=tenant.is_active,
                subscription_tier=tenant.subscription_tier,
                subscription_status=tenant.subscription_status,
                subscription_expires_at=tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
                user_count=user_count or 0,
                created_at=tenant.created_at.isoformat() if tenant.created_at else ""
            )
        )

    return tenant_list


@router.patch("/tenants/{tenant_id}/subscription", response_model=TenantListItem)
async def update_tenant_subscription(
    tenant_id: int,
    subscription_update: SubscriptionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update tenant subscription details.
    Only accessible by superusers.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can update tenant subscriptions"
        )

    # Get tenant
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    # Update subscription fields
    if subscription_update.subscription_tier is not None:
        if subscription_update.subscription_tier not in ["free", "basic", "premium", "enterprise"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid subscription tier"
            )
        tenant.subscription_tier = subscription_update.subscription_tier

    if subscription_update.subscription_status is not None:
        if subscription_update.subscription_status not in ["active", "suspended", "cancelled"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid subscription status"
            )
        tenant.subscription_status = subscription_update.subscription_status

    if subscription_update.subscription_expires_at is not None:
        tenant.subscription_expires_at = subscription_update.subscription_expires_at

    await db.commit()
    await db.refresh(tenant)

    # Get user count
    user_count_result = await db.execute(
        select(func.count(TenantUser.id)).where(TenantUser.tenant_id == tenant_id)
    )
    user_count = user_count_result.scalar() or 0

    return TenantListItem(
        id=tenant.id,
        name=tenant.name,
        subdomain=tenant.subdomain or "",
        is_active=tenant.is_active,
        subscription_tier=tenant.subscription_tier,
        subscription_status=tenant.subscription_status,
        subscription_expires_at=tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
        user_count=user_count,
        created_at=tenant.created_at.isoformat() if tenant.created_at else ""
    )


@router.patch("/tenants/{tenant_id}/status", response_model=TenantListItem)
async def update_tenant_status(
    tenant_id: int,
    status_update: TenantStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Activate or deactivate a tenant.
    Only accessible by superusers.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superusers can update tenant status"
        )

    # Get tenant
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )

    tenant.is_active = status_update.is_active
    await db.commit()
    await db.refresh(tenant)

    # Get user count
    user_count_result = await db.execute(
        select(func.count(TenantUser.id)).where(TenantUser.tenant_id == tenant_id)
    )
    user_count = user_count_result.scalar() or 0

    return TenantListItem(
        id=tenant.id,
        name=tenant.name,
        subdomain=tenant.subdomain or "",
        is_active=tenant.is_active,
        subscription_tier=tenant.subscription_tier,
        subscription_status=tenant.subscription_status,
        subscription_expires_at=tenant.subscription_expires_at.isoformat() if tenant.subscription_expires_at else None,
        user_count=user_count,
        created_at=tenant.created_at.isoformat() if tenant.created_at else ""
    )
