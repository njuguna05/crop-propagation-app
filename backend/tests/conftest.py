import pytest
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from httpx import AsyncClient, ASGITransport

from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.tenant import Tenant, TenantUser, TenantRole
from app.main import app


# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@pytest.fixture(autouse=True)
async def setup_database():
    """Create tables before each test, drop after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Override the database dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a database session for tests."""
    async with TestSessionLocal() as session:
        yield session


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create a test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password=get_password_hash("testpassword123"),
        full_name="Test User",
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def test_tenant(db_session: AsyncSession) -> Tenant:
    """Create a test tenant."""
    tenant = Tenant(
        name="Test Organization",
        subdomain="test-org",
        description="Test tenant for unit tests",
        is_active=True,
        subscription_tier="premium"
    )
    db_session.add(tenant)
    await db_session.commit()
    await db_session.refresh(tenant)
    return tenant


@pytest.fixture
async def tenant_user(db_session: AsyncSession, test_user: User, test_tenant: Tenant) -> TenantUser:
    """Create tenant-user association with owner role."""
    tenant_user = TenantUser(
        tenant_id=test_tenant.id,
        user_id=test_user.id,
        role=TenantRole.OWNER,
        is_active=True
    )
    db_session.add(tenant_user)
    await db_session.commit()
    await db_session.refresh(tenant_user)
    return tenant_user


@pytest.fixture
async def auth_headers(test_user: User, test_tenant: Tenant, tenant_user: TenantUser) -> dict:
    """Create authentication headers with JWT token and tenant ID."""
    access_token = create_access_token(data={"sub": str(test_user.id)})
    return {
        "Authorization": f"Bearer {access_token}",
        "X-Tenant-ID": str(test_tenant.id)
    }


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP client for testing."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def authenticated_client(client: AsyncClient, auth_headers: dict) -> AsyncClient:
    """Provide an authenticated async HTTP client."""
    client.headers.update(auth_headers)
    return client
