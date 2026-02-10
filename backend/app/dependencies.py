from typing import Annotated, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.tenant import Tenant, TenantUser, TenantRole
# HTTP Bearer token security
security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """
    Get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Verify token
    payload = verify_token(credentials.credentials, "access")
    if payload is None:
        raise credentials_exception

    # Get user ID from token
    user_id: Optional[int] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Get user from database
    result = await db.execute(
        select(User).where(User.id == int(user_id))
    )
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    """
    Get current active user (redundant check but explicit)
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


async def get_current_tenant(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_active_user)]
) -> Optional[Tenant]:
    """
    Get current tenant from JWT token context (via middleware).
    Validates that the user is a member of the tenant.
    """
    # Import tenant context from middleware
    from app.core.tenant_middleware import get_tenant_id

    # Get tenant ID from context (set by middleware from JWT)
    tenant_id = get_tenant_id()

    if not tenant_id:
        # No tenant context is acceptable for some endpoints (like /tenants list)
        return None

    # Check if user is member of this tenant
    # We query the TenantUser association
    result = await db.execute(
        select(TenantUser).where(
            TenantUser.tenant_id == tenant_id,
            TenantUser.user_id == current_user.id,
            TenantUser.is_active == True
        )
    )
    membership = result.scalar_one_or_none()
    
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this tenant or tenant not found"
        )
        
    # Get the tenant details
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id, Tenant.is_active == True)
    )
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
        
    # Attach role to tenant object for convenience
    tenant.current_user_role = membership.role
    
    return tenant


def require_tenant_role(allowed_roles: list[TenantRole]):
    """
    Dependency factory to check if user has required role in current tenant
    """
    async def _check_role(
        tenant: Annotated[Tenant, Depends(get_current_tenant)]
    ):
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tenant context required for this operation"
            )
            
        if tenant.current_user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return tenant
        
    return _check_role


# Type aliases for dependency injection
DatabaseDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]
ActiveUserDep = Annotated[User, Depends(get_current_active_user)]
CurrentTenantDep = Annotated[Optional[Tenant], Depends(get_current_tenant)]