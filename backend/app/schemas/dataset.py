# =============================================================================
# Pydantic Schemas — Dataset
# =============================================================================
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class DatasetResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    file_format: str
    file_size_bytes: int
    n_cells: Optional[int] = None
    n_genes: Optional[int] = None
    sparsity: Optional[float] = None
    metadata_columns: Optional[str] = None
    has_missing_values: bool = False
    has_duplicate_genes: bool = False
    owner_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DatasetValidationResponse(BaseModel):
    valid: bool
    n_cells: int
    n_genes: int
    sparsity: float
    memory_mb: float
    metadata_columns: List[str]
    has_missing_values: bool
    has_duplicate_genes: bool
    warnings: List[str] = []


class DatasetListResponse(BaseModel):
    datasets: List[DatasetResponse]
    total: int
