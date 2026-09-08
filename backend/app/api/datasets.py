# =============================================================================
# Dataset API Router
# =============================================================================
from __future__ import annotations

import hashlib
import json
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.dataset import DatasetListResponse, DatasetResponse, DatasetValidationResponse
from app.services.dataset_service import validate_and_extract_metadata

router = APIRouter(prefix="/datasets", tags=["Datasets"])

ALLOWED_EXTENSIONS = {".h5ad", ".csv", ".tsv", ".mtx"}


@router.post("/upload", response_model=DatasetResponse, status_code=201)
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = "",
    description: str = "",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a dataset file and extract metadata."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content
    content = await file.read()
    file_size = len(content)
    max_bytes = settings.max_upload_size_mb * 1024 * 1024
    if file_size > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size / 1e6:.1f} MB). Max: {settings.max_upload_size_mb} MB",
        )

    # Save to disk
    file_id = uuid.uuid4().hex
    safe_name = f"{file_id}{ext}"
    save_path = settings.upload_path / safe_name
    save_path.write_bytes(content)

    # Checksum
    checksum = hashlib.sha256(content).hexdigest()

    # Extract metadata
    try:
        meta = validate_and_extract_metadata(str(save_path), ext)
    except Exception as e:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Failed to read dataset: {e}")

    ds = Dataset(
        name=name or file.filename,
        description=description,
        file_path=str(save_path),
        file_format=ext.lstrip("."),
        file_size_bytes=file_size,
        checksum=checksum,
        n_cells=meta["n_cells"],
        n_genes=meta["n_genes"],
        sparsity=meta["sparsity"],
        metadata_columns=json.dumps(meta["metadata_columns"]),
        has_missing_values=meta["has_missing_values"],
        has_duplicate_genes=meta["has_duplicate_genes"],
        owner_id=current_user.id,
    )
    db.add(ds)
    await db.flush()
    await db.refresh(ds)
    return ds


@router.get("", response_model=DatasetListResponse)
async def list_datasets(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all datasets for the current user."""
    result = await db.execute(
        select(Dataset).where(Dataset.owner_id == current_user.id).order_by(Dataset.created_at.desc())
    )
    datasets = result.scalars().all()
    return DatasetListResponse(datasets=datasets, total=len(datasets))


@router.get("/{dataset_id}", response_model=DatasetResponse)
async def get_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get dataset details."""
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.owner_id == current_user.id)
    )
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return ds


@router.delete("/{dataset_id}", status_code=204)
async def delete_dataset(
    dataset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a dataset."""
    result = await db.execute(
        select(Dataset).where(Dataset.id == dataset_id, Dataset.owner_id == current_user.id)
    )
    ds = result.scalar_one_or_none()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Remove file
    fp = Path(ds.file_path)
    fp.unlink(missing_ok=True)

    await db.delete(ds)
