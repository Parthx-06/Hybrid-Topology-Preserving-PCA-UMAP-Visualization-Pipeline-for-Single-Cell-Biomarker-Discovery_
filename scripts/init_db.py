# =============================================================================
# CellMap BioAnalytics — Database Initialization Script
# =============================================================================
"""
Initializes database schema and creates the initial admin user.
Usage:
    python scripts/init_db.py
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from app.core.config import settings
from app.core.database import async_engine, Base
from app.core.security import hash_password
from app.models.user import User
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker


async def main():
    print("=" * 60)
    print(f"Initializing {settings.app_name} Database Schema...")
    print(f"Target DB: {settings.database_url}")
    print("=" * 60)

    # Create tables
    async with async_engine.begin() as conn:
        print("Creating all tables via SQLAlchemy metadata...")
        await conn.run_sync(Base.metadata.create_all)
        print("[OK] Tables created successfully.")

    # Seed admin user
    session_factory = async_sessionmaker(async_engine, expire_on_commit=False)
    async with session_factory() as session:
        result = await session.execute(
            select(User).where(User.email == settings.admin_email)
        )
        existing_admin = result.scalar_one_or_none()
        if not existing_admin:
            admin = User(
                email=settings.admin_email,
                hashed_password=hash_password(settings.admin_password),
                full_name="System Administrator",
                role="admin",
            )
            session.add(admin)
            await session.commit()
            print(f"[OK] Created default administrator: {settings.admin_email}")
        else:
            print(f"[OK] Administrator already exists: {settings.admin_email}")

    await async_engine.dispose()
    print("Database initialization complete.")


if __name__ == "__main__":
    asyncio.run(main())
