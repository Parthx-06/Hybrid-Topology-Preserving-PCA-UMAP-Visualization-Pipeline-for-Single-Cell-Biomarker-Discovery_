# =============================================================================
# Dataset Service — Validation & Metadata Extraction
# =============================================================================
from __future__ import annotations

import warnings
from typing import Any, Dict, List

import numpy as np

warnings.filterwarnings("ignore")


def validate_and_extract_metadata(file_path: str, extension: str) -> Dict[str, Any]:
    """
    Read a dataset file and extract key metadata.

    Returns dict with keys:
        n_cells, n_genes, sparsity, memory_mb, metadata_columns,
        has_missing_values, has_duplicate_genes, warnings
    """
    if extension in (".h5ad",):
        return _read_h5ad(file_path)
    elif extension in (".csv", ".tsv"):
        sep = "," if extension == ".csv" else "\t"
        return _read_csv(file_path, sep)
    elif extension in (".mtx",):
        return _read_mtx(file_path)
    else:
        raise ValueError(f"Unsupported format: {extension}")


def _read_h5ad(path: str) -> Dict[str, Any]:
    import anndata as ad
    import scipy.sparse as sp

    adata = ad.read_h5ad(path)
    X = adata.X

    n_cells, n_genes = adata.shape
    sparsity = 0.0
    if sp.issparse(X):
        sparsity = 1.0 - (X.nnz / (n_cells * n_genes)) if n_cells * n_genes > 0 else 0.0
    else:
        sparsity = float(np.sum(X == 0) / (n_cells * n_genes)) if n_cells * n_genes > 0 else 0.0

    metadata_columns = list(adata.obs.columns) if adata.obs is not None else []
    has_missing = bool(adata.obs.isnull().any().any()) if len(metadata_columns) > 0 else False
    has_dup_genes = bool(adata.var_names.duplicated().any())

    w: List[str] = []
    if n_cells < 100:
        w.append(f"Very small dataset: only {n_cells} cells")
    if n_genes < 500:
        w.append(f"Very few genes: {n_genes}")
    if sparsity > 0.98:
        w.append(f"Extremely sparse matrix: {sparsity:.1%}")
    if has_dup_genes:
        w.append("Duplicate gene names detected")

    memory_mb = X.data.nbytes / 1e6 if sp.issparse(X) else X.nbytes / 1e6

    return {
        "n_cells": n_cells,
        "n_genes": n_genes,
        "sparsity": round(sparsity, 4),
        "memory_mb": round(memory_mb, 2),
        "metadata_columns": metadata_columns,
        "has_missing_values": has_missing,
        "has_duplicate_genes": has_dup_genes,
        "warnings": w,
    }


def _read_csv(path: str, sep: str) -> Dict[str, Any]:
    import pandas as pd

    df = pd.read_csv(path, sep=sep, index_col=0, nrows=5)
    df_full = pd.read_csv(path, sep=sep, index_col=0)

    # Auto-detect orientation: assume rows > cols means cells x genes
    n_rows, n_cols = df_full.shape
    if n_rows >= n_cols:
        n_cells, n_genes = n_rows, n_cols
    else:
        n_cells, n_genes = n_cols, n_rows

    vals = df_full.values
    sparsity = float(np.sum(vals == 0) / vals.size) if vals.size > 0 else 0.0

    return {
        "n_cells": n_cells,
        "n_genes": n_genes,
        "sparsity": round(sparsity, 4),
        "memory_mb": round(vals.nbytes / 1e6, 2),
        "metadata_columns": [],
        "has_missing_values": bool(df_full.isnull().any().any()),
        "has_duplicate_genes": bool(df_full.columns.duplicated().any()),
        "warnings": [],
    }


def _read_mtx(path: str) -> Dict[str, Any]:
    from scipy.io import mmread

    mat = mmread(path)
    n_rows, n_cols = mat.shape
    # MTX is typically genes x cells
    n_genes, n_cells = n_rows, n_cols

    import scipy.sparse as sp
    if sp.issparse(mat):
        sparsity = 1.0 - (mat.nnz / (n_rows * n_cols)) if n_rows * n_cols > 0 else 0.0
        mem = mat.data.nbytes / 1e6
    else:
        sparsity = float(np.sum(mat == 0) / mat.size) if mat.size > 0 else 0.0
        mem = mat.nbytes / 1e6

    return {
        "n_cells": n_cells,
        "n_genes": n_genes,
        "sparsity": round(sparsity, 4),
        "memory_mb": round(mem, 2),
        "metadata_columns": [],
        "has_missing_values": False,
        "has_duplicate_genes": False,
        "warnings": [],
    }
