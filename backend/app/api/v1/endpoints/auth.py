from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token, create_refresh_token, verify_token
)
from app.models.user import User
from app.models.tenant import TenantUser
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.schemas.common import Token, MessageResponse
from app.dependencies import CurrentUserDep


router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=UserResponse)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user
    """
    # Check if user already exists
    result = await db.execute(
        select(User).where(
            (User.email == user_in.email) |
            (User.username == user_in.username)
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="User with this email or username already exists"
        )

    # Create new user
    user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        is_active=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return user


@router.post("/login", response_model=Token)
async def login_for_access_token(
    user_credentials: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens
    """
    # Get user by username or email with tenant memberships
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(User)
        .options(selectinload(User.tenant_memberships).selectinload(TenantUser.tenant))
        .where(
            (User.username == user_credentials.username) |
            (User.email == user_credentials.username)
        )
    )
    user = result.scalar_one_or_none()

    # Verify credentials
    if not user or not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Process tenants for response (Optional, logic could be moved to service or serializer)
    # The UserResponse schema now has 'tenants' field, but it's a list of dicts.
    # We populate it here manually or let Pydantic handle it if we structured it right.
    # Since User model doesn't have 'tenants' property providing the exact shape, we might need a helper.
    # However, let's just return the token and let the client fetch /me or /tenants for full details.
    # But wait, UserResponse is NOT the return type of login. Login returns Token.
    # The 'me' endpoint returns UserResponse.
    
    # Get user's primary tenant (first active tenant)
    tenant_id = None
    if not user.is_superuser and user.tenant_memberships:
        for membership in user.tenant_memberships:
            if membership.is_active and membership.tenant.is_active:
                tenant_id = membership.tenant_id
                break

    # Create tokens with tenant_id for regular users
    token_data = {"sub": str(user.id)}
    if tenant_id is not None:
        token_data["tenant_id"] = tenant_id

    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: CurrentUserDep,
    db: AsyncSession = Depends(get_db)
):
    """
    Get current user profile with tenant information
    """
    # specific implementation to fetch tenants if not loaded
    # current_user from dependency might not have relations loaded
    # so we might need to reload or just fetch tenants
    
    from sqlalchemy.orm import selectinload
    
    # Reload user with tenants
    result = await db.execute(
        select(User)
        .options(selectinload(User.tenant_memberships).selectinload(TenantUser.tenant))
        .where(User.id == current_user.id)
    )
    user = result.scalar_one()
    
    # Transform tenants
    tenants_list = []
    for membership in user.tenant_memberships:
        if membership.tenant.is_active and membership.is_active:
            tenants_list.append({
                "id": membership.tenant.id,
                "name": membership.tenant.name,
                "subdomain": membership.tenant.subdomain,
                "role": membership.role,
                "is_active": membership.tenant.is_active,
                "subscription_tier": membership.tenant.subscription_tier
            })
            
    # Create response
    response = UserResponse.model_validate(user)
    response.tenants = tenants_list
    
    return response


@router.post("/logout", response_model=MessageResponse)
async def logout(
    current_user: CurrentUserDep
):
    """
    Logout user (client should discard tokens)
    """
    # In a production system, you might want to blacklist tokens
    # For now, we just return success and let client handle token removal
    return MessageResponse(message="Successfully logged out", success=True)