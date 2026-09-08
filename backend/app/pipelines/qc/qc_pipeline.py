# =============================================================================
# QC Pipeline — Single-Cell RNA-seq Quality Control
# =============================================================================
"""
Implements standard scRNA-seq quality control:
  - Total counts per cell
  - Number of detected genes per cell
  - Mitochondrial gene percentage
  - Ribosomal gene percentage
  - Configurable filtering
  - Suspicious dataset warnings
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np
import scanpy as sc
from anndata import AnnData


@dataclass
class QCConfig:
    min_genes: int = 1
    max_genes: int = 50000
    min_counts: int = 1
    max_mito_pct: float = 80.0


@dataclass
class QCResult:
    cells_before: int = 0
    cells_after: int = 0
    cells_removed: int = 0
    genes_before: int = 0
    genes_after: int = 0
    warnings: List[str] = field(default_factory=list)
    qc_metrics: Dict[str, Any] = field(default_factory=dict)
    plots: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cells_before": self.cells_before,
            "cells_after": self.cells_after,
            "cells_removed": self.cells_removed,
            "genes_before": self.genes_before,
            "genes_after": self.genes_after,
            "warnings": self.warnings,
            "qc_metrics": self.qc_metrics,
            "plots": self.plots,
        }


def run_qc(adata: AnnData, config: QCConfig) -> tuple[AnnData, QCResult]:
    """
    Run quality control on an AnnData object.

    Returns the filtered AnnData and QC results.
    """
    result = QCResult()
    result.cells_before = adata.n_obs
    result.genes_before = adata.n_vars

    # ---- Calculate QC metrics ----
    # Mitochondrial genes
    adata.var["mt"] = adata.var_names.str.upper().str.startswith("MT-")
    # Ribosomal genes
    adata.var["ribo"] = adata.var_names.str.upper().str.match(r"^RP[SL]\d")

    sc.pp.calculate_qc_metrics(
        adata, qc_vars=["mt", "ribo"], percent_top=None, log1p=False, inplace=True
    )
    adata.obs["pct_counts_mito"] = adata.obs["pct_counts_mt"]

    # Store pre-filter metrics for plotting
    result.qc_metrics = {
        "total_counts": {
            "mean": float(np.mean(adata.obs["total_counts"])),
            "median": float(np.median(adata.obs["total_counts"])),
            "min": float(np.min(adata.obs["total_counts"])),
            "max": float(np.max(adata.obs["total_counts"])),
        },
        "n_genes_by_counts": {
            "mean": float(np.mean(adata.obs["n_genes_by_counts"])),
            "median": float(np.median(adata.obs["n_genes_by_counts"])),
            "min": float(np.min(adata.obs["n_genes_by_counts"])),
            "max": float(np.max(adata.obs["n_genes_by_counts"])),
        },
        "pct_counts_mt": {
            "mean": float(np.mean(adata.obs["pct_counts_mt"])),
            "median": float(np.median(adata.obs["pct_counts_mt"])),
            "max": float(np.max(adata.obs["pct_counts_mt"])),
        },
    }

    # ---- Generate plot data ----
    result.plots = _generate_qc_plot_data(adata)

    # ---- Warnings ----
    mito_mean = result.qc_metrics["pct_counts_mt"]["mean"]
    if mito_mean > 15:
        result.warnings.append(
            f"High average mitochondrial percentage ({mito_mean:.1f}%). "
            "This may indicate low-quality or dying cells."
        )
    if result.qc_metrics["n_genes_by_counts"]["median"] < 300:
        result.warnings.append(
            f"Low median gene count ({result.qc_metrics['n_genes_by_counts']['median']:.0f}). "
            "Consider checking sequencing depth."
        )
    if result.cells_before < 500:
        result.warnings.append(
            f"Small sample size ({result.cells_before} cells). "
            "Statistical power may be limited."
        )

    # ---- Filter ----
    sc.pp.filter_cells(adata, min_genes=config.min_genes)
    adata = adata[adata.obs["n_genes_by_counts"] < config.max_genes, :].copy()
    adata = adata[adata.obs["total_counts"] >= config.min_counts, :].copy()
    adata = adata[adata.obs["pct_counts_mt"] < config.max_mito_pct, :].copy()

    # Filter genes expressed in at least 3 cells
    sc.pp.filter_genes(adata, min_cells=3)

    result.cells_after = adata.n_obs
    result.cells_removed = result.cells_before - result.cells_after
    result.genes_after = adata.n_vars

    if result.cells_removed / max(result.cells_before, 1) > 0.5:
        result.warnings.append(
            f"Warning: {result.cells_removed} cells removed ({result.cells_removed / result.cells_before:.0%}). "
            "Consider relaxing QC thresholds."
        )

    return adata, result


def _generate_qc_plot_data(adata: AnnData) -> Dict[str, Any]:
    """Generate plot data for QC visualizations (violin, scatter, histogram)."""
    n_sample = min(adata.n_obs, 10000)  # Subsample for large datasets
    indices = np.random.choice(adata.n_obs, n_sample, replace=False) if adata.n_obs > n_sample else np.arange(adata.n_obs)

    obs = adata.obs.iloc[indices]

    return {
        "violin": {
            "n_genes_by_counts": obs["n_genes_by_counts"].tolist(),
            "total_counts": obs["total_counts"].tolist(),
            "pct_counts_mt": obs["pct_counts_mt"].tolist(),
        },
        "scatter": {
            "total_counts": obs["total_counts"].tolist(),
            "n_genes_by_counts": obs["n_genes_by_counts"].tolist(),
            "pct_counts_mt": obs["pct_counts_mt"].tolist(),
        },
        "histogram": {
            "n_genes_by_counts": np.histogram(obs["n_genes_by_counts"], bins=50)[0].tolist(),
            "n_genes_by_counts_edges": np.histogram(obs["n_genes_by_counts"], bins=50)[1].tolist(),
            "total_counts": np.histogram(obs["total_counts"], bins=50)[0].tolist(),
            "total_counts_edges": np.histogram(obs["total_counts"], bins=50)[1].tolist(),
        },
    }
