from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.tenant import TenantRole
from app.schemas.tenant import (
    TenantCreate,
    TenantUpdate,
    TenantResponse,
    TenantWithStats,
    TenantUserResponse,
    TenantUserWithDetails,
    TenantUserUpdate,
    TenantInvitation,
    TenantInvitationResponse,
    TenantStats,
    TenantSettingsUpdate,
    TenantListItem,
    TenantListResponse,
    TenantRegistration
)
from app.services.tenant_service import TenantService
from app.core.security import get_password_hash, create_access_token
from app.schemas.common import Token

router = APIRouter()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_tenant_and_user(
    registration_data: TenantRegistration,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new tenant and user in a single transaction.
    This endpoint does not require authentication.
    The user will be created as the tenant owner and a JWT token will be returned.
    """
    from sqlalchemy import select
    from app.models.tenant import Tenant

    # Check if user already exists
    result = await db.execute(
        select(User).where(
            (User.email == registration_data.email) |
            (User.username == registration_data.username)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email or username already exists"
        )

    # Check if subdomain is already taken
    if registration_data.subdomain:
        result = await db.execute(
            select(Tenant.id).where(Tenant.subdomain == registration_data.subdomain)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subdomain already taken"
            )

    # Create user
    user = User(
        email=registration_data.email,
        username=registration_data.username,
        full_name=registration_data.full_name,
        hashed_password=get_password_hash(registration_data.password),
        is_active=True
    )
    db.add(user)
    await db.flush()  # Flush to get user.id

    # Create tenant
    tenant_create = TenantCreate(
        name=registration_data.name,
        subdomain=registration_data.subdomain,
        description=registration_data.description,
        contact_email=registration_data.contact_email or registration_data.email,
        contact_phone=registration_data.contact_phone
    )
    tenant = await TenantService.create_tenant(db, tenant_create, user.id)

    await db.commit()

    # Generate access token
    access_token = create_access_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": access_token,  # For now, same as access token
        "token_type": "bearer"
    }


@router.get("/", response_model=TenantListResponse)
async def list_user_tenants(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all tenants for the current user with their roles in a single query
    """
    # Fetch tenants with roles in a single query (no N+1)
    from sqlalchemy import select, and_
    from app.models.tenant import Tenant, TenantUser

    result = await db.execute(
        select(Tenant, TenantUser.role)
        .join(TenantUser, TenantUser.tenant_id == Tenant.id)
        .where(
            and_(
                TenantUser.user_id == current_user.id,
                TenantUser.is_active == True,
                Tenant.is_active == True
            )
        )
    )

    tenant_list = []
    for tenant, role in result.all():
        tenant_list.append(
            TenantListItem(
                id=tenant.id,
                name=tenant.name,
                subdomain=tenant.subdomain,
                role=role,
                is_active=tenant.is_active,
                subscription_tier=tenant.subscription_tier
            )
        )

    return TenantListResponse(
        tenants=tenant_list,
        total=len(tenant_list)
    )


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new tenant. The current user will be set as the owner.
    """
    # Check if subdomain is already taken
    if tenant_data.subdomain:
        from sqlalchemy import select
        from app.models.tenant import Tenant
        result = await db.execute(
            select(Tenant.id).where(Tenant.subdomain == tenant_data.subdomain)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Subdomain already taken"
            )
    
    tenant = await TenantService.create_tenant(db, tenant_data, current_user.id)
    return tenant


@router.get("/{tenant_id}", response_model=TenantWithStats)
async def get_tenant(
    tenant_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get tenant details with statistics
    """
    # Check if user has access to this tenant
    role = await TenantService.get_user_role(db, tenant_id, current_user.id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this tenant"
        )
    
    tenant = await TenantService.get_tenant(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Get statistics
    stats = await TenantService.get_tenant_stats(db, tenant_id)
    
    return TenantWithStats(
        **tenant.__dict__,
        user_count=stats.total_users,
        crop_count=stats.total_crops,
        order_count=stats.total_orders,
        task_count=stats.total_tasks
    )


@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_data: TenantUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update tenant information. Requires ADMIN or OWNER role.
    """
    # Check permission
    has_permission = await TenantService.check_permission(
        db, tenant_id, current_user.id, TenantRole.ADMIN
    )
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this tenant"
        )
    
    tenant = await TenantService.update_tenant(db, tenant_id, tenant_data)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return tenant


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a tenant. Requires OWNER role.
    """
    # Check permission - only owner can delete
    has_permission = await TenantService.check_permission(
        db, tenant_id, current_user.id, TenantRole.OWNER
    )
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenant owners can delete tenants"
        )
    
    success = await TenantService.delete_tenant(db, tenant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )


@router.get("/{tenant_id}/users", response_model=List[TenantUserWithDetails])
async def list_tenant_users(
    tenant_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all users in a tenant
    """
    # Check if user has access
    role = await TenantService.get_user_role(db, tenant_id, current_user.id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this tenant"
        )
    
    tenant_users = await TenantService.get_tenant_users(db, tenant_id)
    
    # Add user details
    result = []
    for tu in tenant_users:
        result.append(
            TenantUserWithDetails(
                **tu.__dict__,
                user_email=tu.user.email,
                user_username=tu.user.username,
                user_full_name=tu.user.full_name
            )
        )
    
    return result


@router.post("/{tenant_id}/users/invite", response_model=TenantInvitationResponse)
async def invite_user_to_tenant(
    tenant_id: int,
    invitation: TenantInvitation,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Invite a user to a tenant. Requires ADMIN or OWNER role.
    """
    # Check permission
    has_permission = await TenantService.check_permission(
        db, tenant_id, current_user.id, TenantRole.ADMIN
    )
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to invite users"
        )
    
    # Find user by email
    from sqlalchemy import select
    result = await db.execute(
        select(User).where(User.email == invitation.email)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        return TenantInvitationResponse(
            success=False,
            message=f"User with email {invitation.email} not found"
        )
    
    # Check if user is already in tenant
    existing_role = await TenantService.get_user_role(db, tenant_id, user.id)
    if existing_role:
        return TenantInvitationResponse(
            success=False,
            message="User is already a member of this tenant"
        )
    
    # Add user to tenant
    tenant_user = await TenantService.add_user_to_tenant(
        db, tenant_id, user.id, invitation.role, current_user.id
    )
    
    return TenantInvitationResponse(
        success=True,
        message=f"User {user.username} invited successfully",
        user_id=user.id,
        tenant_user_id=tenant_user.id
    )


@router.delete("/{tenant_id}/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_from_tenant(
    tenant_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a user from a tenant. Requires ADMIN or OWNER role.
    """
    # Check permission
    has_permission = await TenantService.check_permission(
        db, tenant_id, current_user.id, TenantRole.ADMIN
    )
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to remove users"
        )
    
    # Prevent removing the last owner
    user_role = await TenantService.get_user_role(db, tenant_id, user_id)
    if user_role == TenantRole.OWNER:
        # Count owners
        from sqlalchemy import select, func, and_
        from app.models.tenant import TenantUser
        result = await db.execute(
            select(func.count(TenantUser.id))
            .where(
                and_(
                    TenantUser.tenant_id == tenant_id,
                    TenantUser.role == TenantRole.OWNER
                )
            )
        )
        owner_count = result.scalar()
        
        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot remove the last owner from a tenant"
            )
    
    success = await TenantService.remove_user_from_tenant(db, tenant_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this tenant"
        )


@router.patch("/{tenant_id}/users/{user_id}/role", response_model=TenantUserResponse)
async def update_user_role(
    tenant_id: int,
    user_id: int,
    role_update: TenantUserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a user's role in a tenant. Requires OWNER role.
    """
    # Check permission - only owners can change roles
    has_permission = await TenantService.check_permission(
        db, tenant_id, current_user.id, TenantRole.OWNER
    )
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenant owners can change user roles"
        )
    
    if not role_update.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role is required"
        )
    
    tenant_user = await TenantService.update_user_role(
        db, tenant_id, user_id, role_update.role
    )
    
    if not tenant_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this tenant"
        )
    
    return tenant_user


@router.get("/{tenant_id}/settings")
async def get_tenant_settings(
    tenant_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get tenant settings
    """
    # Check if user has access
    role = await TenantService.get_user_role(db, tenant_id, current_user.id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this tenant"
        )
    
    tenant = await TenantService.get_tenant(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return tenant.settings or {}


@router.put("/{tenant_id}/settings")
async def update_tenant_settings(
    tenant_id: int,
    settings: TenantSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update tenant settings. Requires ADMIN or OWNER role.
    """
    # Check permission
    has_permission = await TenantService.check_permission(
        db, tenant_id, current_user.id, TenantRole.ADMIN
    )
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update settings"
        )
    
    tenant = await TenantService.update_tenant_settings(db, tenant_id, settings)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    return tenant.settings


@router.get("/{tenant_id}/stats", response_model=TenantStats)
async def get_tenant_stats(
    tenant_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get tenant statistics
    """
    # Check if user has access
    role = await TenantService.get_user_role(db, tenant_id, current_user.id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this tenant"
        )
    
    stats = await TenantService.get_tenant_stats(db, tenant_id)
    return stats
