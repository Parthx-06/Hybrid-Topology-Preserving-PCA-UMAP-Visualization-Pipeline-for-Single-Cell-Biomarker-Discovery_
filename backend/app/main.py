# =============================================================================
# CellMap BioAnalytics — FastAPI Main Application
# =============================================================================
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    # Startup
    logger.info("Starting CellMap BioAnalytics v%s", settings.app_version)
    await init_db()
    await _seed_admin()
    yield
    # Shutdown
    logger.info("Shutting down CellMap BioAnalytics")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "Topology-aware single-cell analytics for biomarker discovery. "
        "Hybrid PCA + UMAP pipeline with clustering, differential expression, "
        "and biomarker ranking."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---- CORS ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---- Global exception handler ----
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


# ---- Health check ----
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "healthy", "version": settings.app_version}


@app.get("/", tags=["System"])
async def root():
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "tagline": "Topology-aware single-cell analytics for biomarker discovery.",
        "docs": "/docs",
    }


# ---- Register routers ----
from app.api.auth import router as auth_router
from app.api.datasets import router as dataset_router
from app.api.experiments import router as experiment_router
from app.api.reports import router as report_router

app.include_router(auth_router, prefix=settings.api_prefix)
app.include_router(dataset_router, prefix=settings.api_prefix)
app.include_router(experiment_router, prefix=settings.api_prefix)
app.include_router(report_router, prefix=settings.api_prefix)


# ---- Admin seed ----
async def _seed_admin():
    """Create default admin user if it doesn't exist."""
    from sqlalchemy import select
    from app.core.database import async_session_factory
    from app.core.security import hash_password
    from app.models.user import User

    async with async_session_factory() as session:
        result = await session.execute(
            select(User).where(User.email == settings.admin_email)
        )
        if result.scalar_one_or_none() is None:
            admin = User(
                email=settings.admin_email,
                hashed_password=hash_password(settings.admin_password),
                full_name="System Admin",
                role="admin",
            )
            session.add(admin)
            await session.commit()
            logger.info("Created default admin user: %s", settings.admin_email)
