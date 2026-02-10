from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

from app.models.tenant import Tenant, TenantUser, TenantRole
from app.models.user import User
from app.models.crop import Crop
from app.models.order import Order
from app.models.task import Task
from app.schemas.tenant import (
    TenantCreate,
    TenantUpdate,
    TenantUserCreate,
    TenantUserUpdate,
    TenantStats,
    TenantSettingsUpdate
)


class TenantService:
    """Service for tenant management operations"""
    
    @staticmethod
    async def create_tenant(db: AsyncSession, tenant_data: TenantCreate, owner_id: int) -> Tenant:
        """
        Create a new tenant and assign the creator as owner
        """
        # Create tenant
        tenant = Tenant(
            name=tenant_data.name,
            subdomain=tenant_data.subdomain,
            description=tenant_data.description,
            contact_email=tenant_data.contact_email,
            contact_phone=tenant_data.contact_phone,
            settings=tenant_data.settings.model_dump() if tenant_data.settings else {}
        )
        
        db.add(tenant)
        await db.flush()  # Get tenant ID
        
        # Add owner as first user
        tenant_user = TenantUser(
            tenant_id=tenant.id,
            user_id=owner_id,
            role=TenantRole.OWNER,
            joined_at=datetime.now(timezone.utc)
        )
        
        db.add(tenant_user)
        await db.commit()
        await db.refresh(tenant)
        
        return tenant
    
    @staticmethod
    async def get_tenant(db: AsyncSession, tenant_id: int) -> Optional[Tenant]:
        """Get tenant by ID"""
        result = await db.execute(
            select(Tenant).where(Tenant.id == tenant_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def get_user_tenants(db: AsyncSession, user_id: int) -> List[Tenant]:
        """Get all tenants for a user"""
        result = await db.execute(
            select(Tenant)
            .join(TenantUser)
            .where(
                and_(
                    TenantUser.user_id == user_id,
                    TenantUser.is_active == True,
                    Tenant.is_active == True
                )
            )
            .options(selectinload(Tenant.tenant_users))
        )
        return result.scalars().all()
    
    @staticmethod
    async def update_tenant(
        db: AsyncSession,
        tenant_id: int,
        tenant_data: TenantUpdate
    ) -> Optional[Tenant]:
        """Update tenant information"""
        tenant = await TenantService.get_tenant(db, tenant_id)
        if not tenant:
            return None
        
        update_data = tenant_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tenant, field, value)
        
        await db.commit()
        await db.refresh(tenant)
        return tenant
    
    @staticmethod
    async def delete_tenant(db: AsyncSession, tenant_id: int) -> bool:
        """Delete a tenant (soft delete by setting is_active=False)"""
        tenant = await TenantService.get_tenant(db, tenant_id)
        if not tenant:
            return False
        
        tenant.is_active = False
        await db.commit()
        return True
    
    @staticmethod
    async def get_tenant_users(db: AsyncSession, tenant_id: int) -> List[TenantUser]:
        """Get all users in a tenant"""
        result = await db.execute(
            select(TenantUser)
            .where(TenantUser.tenant_id == tenant_id)
            .options(selectinload(TenantUser.user))
        )
        return result.scalars().all()
    
    @staticmethod
    async def add_user_to_tenant(
        db: AsyncSession,
        tenant_id: int,
        user_id: int,
        role: TenantRole,
        invited_by: int
    ) -> TenantUser:
        """Add a user to a tenant"""
        tenant_user = TenantUser(
            tenant_id=tenant_id,
            user_id=user_id,
            role=role,
            invited_by=invited_by,
            joined_at=datetime.now(timezone.utc)
        )
        
        db.add(tenant_user)
        await db.commit()
        await db.refresh(tenant_user)
        return tenant_user
    
    @staticmethod
    async def remove_user_from_tenant(
        db: AsyncSession,
        tenant_id: int,
        user_id: int
    ) -> bool:
        """Remove a user from a tenant"""
        result = await db.execute(
            select(TenantUser).where(
                and_(
                    TenantUser.tenant_id == tenant_id,
                    TenantUser.user_id == user_id
                )
            )
        )
        tenant_user = result.scalar_one_or_none()
        
        if not tenant_user:
            return False
        
        await db.delete(tenant_user)
        await db.commit()
        return True
    
    @staticmethod
    async def update_user_role(
        db: AsyncSession,
        tenant_id: int,
        user_id: int,
        role: TenantRole
    ) -> Optional[TenantUser]:
        """Update a user's role in a tenant"""
        result = await db.execute(
            select(TenantUser).where(
                and_(
                    TenantUser.tenant_id == tenant_id,
                    TenantUser.user_id == user_id
                )
            )
        )
        tenant_user = result.scalar_one_or_none()
        
        if not tenant_user:
            return None
        
        tenant_user.role = role
        await db.commit()
        await db.refresh(tenant_user)
        return tenant_user
    
    @staticmethod
    async def get_user_role(
        db: AsyncSession,
        tenant_id: int,
        user_id: int
    ) -> Optional[TenantRole]:
        """Get a user's role in a tenant"""
        result = await db.execute(
            select(TenantUser.role).where(
                and_(
                    TenantUser.tenant_id == tenant_id,
                    TenantUser.user_id == user_id,
                    TenantUser.is_active == True
                )
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def check_permission(
        db: AsyncSession,
        tenant_id: int,
        user_id: int,
        required_role: TenantRole
    ) -> bool:
        """
        Check if user has required permission level in tenant
        Role hierarchy: OWNER > ADMIN > MEMBER > VIEWER
        """
        user_role = await TenantService.get_user_role(db, tenant_id, user_id)
        if not user_role:
            return False
        
        role_hierarchy = {
            TenantRole.OWNER: 4,
            TenantRole.ADMIN: 3,
            TenantRole.MEMBER: 2,
            TenantRole.VIEWER: 1
        }
        
        return role_hierarchy.get(user_role, 0) >= role_hierarchy.get(required_role, 0)
    
    @staticmethod
    async def get_tenant_stats(db: AsyncSession, tenant_id: int) -> TenantStats:
        """Get statistics for a tenant with optimized queries"""
        from sqlalchemy import case

        # Get all user counts and role breakdown in a single query
        user_stats_result = await db.execute(
            select(
                func.count(TenantUser.id).label('total_users'),
                func.sum(case((TenantUser.is_active == True, 1), else_=0)).label('active_users'),
                func.sum(case((TenantUser.role == TenantRole.OWNER, 1), else_=0)).label('owners'),
                func.sum(case((TenantUser.role == TenantRole.ADMIN, 1), else_=0)).label('admins'),
                func.sum(case((TenantUser.role == TenantRole.MEMBER, 1), else_=0)).label('members'),
                func.sum(case((TenantUser.role == TenantRole.VIEWER, 1), else_=0)).label('viewers')
            )
            .where(TenantUser.tenant_id == tenant_id)
        )
        user_stats = user_stats_result.first()
        total_users = int(user_stats.total_users or 0)
        active_users = int(user_stats.active_users or 0)
        role_counts = {
            "owner": int(user_stats.owners or 0),
            "admin": int(user_stats.admins or 0),
            "member": int(user_stats.members or 0),
            "viewer": int(user_stats.viewers or 0)
        }
        
        # Get crop count
        crop_result = await db.execute(
            select(func.count(Crop.id))
            .where(Crop.tenant_id == tenant_id)
        )
        total_crops = crop_result.scalar() or 0
        
        # Get order count
        order_result = await db.execute(
            select(func.count(Order.id))
            .where(Order.tenant_id == tenant_id)
        )
        total_orders = order_result.scalar() or 0
        
        # Get task counts in a single query
        task_stats_result = await db.execute(
            select(
                func.count(Task.id).label('total_tasks'),
                func.sum(case((Task.completed == False, 1), else_=0)).label('pending_tasks')
            )
            .where(Task.tenant_id == tenant_id)
        )
        task_stats = task_stats_result.first()
        total_tasks = int(task_stats.total_tasks or 0)
        pending_tasks = int(task_stats.pending_tasks or 0)

        # Get order counts in a single query
        order_stats_result = await db.execute(
            select(
                func.count(Order.id).label('total_orders'),
                func.sum(case((Order.status == "completed", 1), else_=0)).label('completed_orders')
            )
            .where(Order.tenant_id == tenant_id)
        )
        order_stats = order_stats_result.first()
        total_orders = int(order_stats.total_orders or 0)
        completed_orders = int(order_stats.completed_orders or 0)
        
        # Calculate revenue
        revenue_result = await db.execute(
            select(func.sum(Order.total_value))
            .where(
                and_(
                    Order.tenant_id == tenant_id,
                    Order.status == "completed"
                )
            )
        )
        revenue = revenue_result.scalar() or 0.0
        
        return TenantStats(
            total_users=total_users,
            active_users=active_users,
            total_crops=total_crops,
            total_orders=total_orders,
            total_tasks=total_tasks,
            pending_tasks=pending_tasks,
            completed_orders=completed_orders,
            revenue=float(revenue),
            owners=role_counts.get("owner", 0),
            admins=role_counts.get("admin", 0),
            members=role_counts.get("member", 0),
            viewers=role_counts.get("viewer", 0)
        )
    
    @staticmethod
    async def update_tenant_settings(
        db: AsyncSession,
        tenant_id: int,
        settings_data: TenantSettingsUpdate
    ) -> Optional[Tenant]:
        """Update tenant settings"""
        tenant = await TenantService.get_tenant(db, tenant_id)
        if not tenant:
            return None
        
        # Merge new settings with existing settings
        current_settings = tenant.settings or {}
        update_data = settings_data.model_dump(exclude_unset=True)
        
        for key, value in update_data.items():
            if value is not None:
                current_settings[key] = value
        
        tenant.settings = current_settings
        await db.commit()
        await db.refresh(tenant)
        return tenant
