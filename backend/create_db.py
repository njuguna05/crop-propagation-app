#!/usr/bin/env python3
"""
Script to create the PostgreSQL database for the crop propagation app
"""
from sqlalchemy import create_engine, text
import os
import sys


def create_database():
    """Create the crop propagation database"""

    # Read database URL from .env or use default
    db_url = "postgresql://user:password@localhost/crop_propagation_db"

    try:
        if os.path.exists('.env'):
            with open('.env', 'r') as f:
                for line in f:
                    if line.startswith('DATABASE_URL='):
                        db_url = line.split('=', 1)[1].strip()
                        # Convert async URL to sync for database creation
                        db_url = db_url.replace('+asyncpg', '')
                        break
    except Exception as e:
        print(f"Could not read .env file: {e}")

    # Parse database URL
    base_url = db_url.rsplit('/', 1)[0]  # Remove database name
    db_name = db_url.rsplit('/', 1)[1]   # Get database name

    print(f"Creating database: {db_name}")
    print(f"Base URL: {base_url}")

    try:
        # Connect to default postgres database to create our database
        engine = create_engine(f"{base_url}/postgres")

        with engine.connect() as conn:
            # End any existing transaction
            conn.execute(text("COMMIT"))

            # Create the database
            conn.execute(text(f"CREATE DATABASE {db_name}"))

        print(f"✅ Database '{db_name}' created successfully!")
        return True

    except Exception as e:
        error_msg = str(e).lower()
        if 'already exists' in error_msg or 'duplicate' in error_msg:
            print(f"ℹ️  Database '{db_name}' already exists.")
            return True
        else:
            print(f"❌ Error creating database: {e}")
            return False


if __name__ == "__main__":
    success = create_database()
    sys.exit(0 if success else 1)