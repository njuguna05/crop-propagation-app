"""
Create a superuser/admin account for platform management.
This admin can manage all tenants and access the platform dashboard.

Usage:
    cd backend
    python create_superuser.py
"""

import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

from app.core.security import get_password_hash
from app.models.user import User


async def create_superuser():
    """Create a superuser account."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("ERROR: DATABASE_URL environment variable not set.")
        sys.exit(1)

    print("=" * 60)
    print("  FloraTrack - Superuser Creation")
    print("=" * 60)
    print(f"\nConnecting to database...")

    engine = create_async_engine(database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # Check if superuser already exists
        result = await session.execute(
            select(User).where(User.email == "admin@floratrack.com")
        )
        existing_admin = result.scalar_one_or_none()

        if existing_admin:
            print("\nWARNING: Superuser already exists!")
            print(f"   Email: {existing_admin.email}")
            print(f"   Username: {existing_admin.username}")

            # Update password to ensure it's correct
            existing_admin.hashed_password = get_password_hash("Admin@123")
            session.add(existing_admin)
            await session.commit()
            print("\nSUCCESS: Password has been reset to: Admin@123")
        else:
            print("\nCreating new superuser...")

            # Create superuser
            admin = User(
                email="admin@floratrack.com",
                username="admin",
                full_name="Platform Administrator",
                hashed_password=get_password_hash("Admin@123"),
                is_active=True,
                is_superuser=True,
            )
            session.add(admin)
            await session.commit()

            print("\nSUCCESS: Superuser created successfully!")

        print("\n" + "=" * 60)
        print("  SUPERUSER CREDENTIALS")
        print("=" * 60)
        print(f"  Email:    admin@floratrack.com")
        print(f"  Username: admin")
        print(f"  Password: Admin@123")
        print("=" * 60)
        print("\nIMPORTANT: Change the password after first login!")
        print("This account has full access to all tenants and platform settings.\n")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_superuser())
