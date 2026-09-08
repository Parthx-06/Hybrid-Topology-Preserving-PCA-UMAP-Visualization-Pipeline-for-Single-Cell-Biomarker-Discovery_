# =============================================================================
# Preprocessing — Normalization, Log-Transform, HVG Selection, Scaling
# =============================================================================
"""
Standard scRNA-seq preprocessing using Scanpy:
  1. Library-size normalization
  2. Log transformation
  3. Highly variable gene selection
  4. Optional scaling
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List

import numpy as np
import scanpy as sc
from anndata import AnnData


@dataclass
class PreprocessConfig:
    target_sum: float = 10000.0
    log_transform: bool = True
    log1p: bool = True
    highly_variable_genes: bool = True
    n_top_genes: int = 2000
    hvg_flavor: str = "seurat_v3"
    scale: bool = False
    max_value: float = 10.0

    def __post_init__(self):
        if not self.log_transform or not self.log1p:
            self.log_transform = False
            self.log1p = False


# Backward-compatible alias
PreprocessingConfig = PreprocessConfig


@dataclass
class PreprocessResult:
    n_hvg: int = 0
    genes_before: int = 0
    genes_after: int = 0
    normalization_target: float = 0.0
    log_transformed: bool = False
    scaled: bool = False
    hvg_names: List[str] = field(default_factory=list)
    plots: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "n_hvg": self.n_hvg,
            "genes_before": self.genes_before,
            "genes_after": self.genes_after,
            "normalization_target": self.normalization_target,
            "log_transformed": self.log_transformed,
            "scaled": self.scaled,
            "top_hvg": self.hvg_names[:50],
            "plots": self.plots,
        }


def preprocess_data(adata: AnnData, config: Optional[PreprocessConfig] = None) -> AnnData:
    """Convenience helper returning AnnData directly."""
    if config is None:
        config = PreprocessConfig()
    processed_adata, _ = run_preprocessing(adata, config)
    return processed_adata


def run_preprocessing(adata: AnnData, config: PreprocessConfig) -> tuple[AnnData, PreprocessResult]:
    """
    Run preprocessing pipeline: normalize → log → HVG → optional scale.

    Stores raw counts in adata.raw before normalization.
    """
    result = PreprocessResult()
    result.genes_before = adata.n_vars

    # Store raw counts
    adata.raw = adata.copy()

    # 1. Library-size normalization
    sc.pp.normalize_total(adata, target_sum=config.target_sum)
    result.normalization_target = config.target_sum

    # 2. Log transform
    if config.log_transform:
        sc.pp.log1p(adata)
        result.log_transformed = True

    # 3. Highly variable genes
    if config.highly_variable_genes:
        n_top = min(config.n_top_genes, adata.n_vars)
        try:
            if config.hvg_flavor == "seurat_v3" and adata.raw is not None:
                sc.pp.highly_variable_genes(
                    adata,
                    n_top_genes=n_top,
                    flavor="seurat_v3",
                    layer=None,
                )
            else:
                sc.pp.highly_variable_genes(
                    adata,
                    n_top_genes=n_top,
                    flavor="seurat",
                )
        except Exception:
            # Fallback to basic HVG selection
            sc.pp.highly_variable_genes(adata, min_mean=0.0125, max_mean=3, min_disp=0.5)

        hvg_mask = adata.var["highly_variable"]
        result.n_hvg = int(hvg_mask.sum())
        result.hvg_names = list(adata.var_names[hvg_mask])

        # Generate HVG plot data
        result.plots = _generate_hvg_plot_data(adata)

        # Subset to HVGs
        adata = adata[:, adata.var["highly_variable"]].copy()
    
    result.genes_after = adata.n_vars

    # 4. Optional scaling
    if config.scale:
        sc.pp.scale(adata, max_value=config.max_value)
        result.scaled = True

    return adata, result


def _generate_hvg_plot_data(adata: AnnData) -> Dict[str, Any]:
    """Generate HVG dispersion plot data."""
    if "means" not in adata.var or "dispersions_norm" not in adata.var:
        return {}

    mask = adata.var["highly_variable"].values
    return {
        "hvg_scatter": {
            "means": adata.var["means"].tolist(),
            "dispersions_norm": adata.var["dispersions_norm"].tolist(),
            "highly_variable": mask.tolist(),
            "gene_names": adata.var_names.tolist(),
        }
    }
