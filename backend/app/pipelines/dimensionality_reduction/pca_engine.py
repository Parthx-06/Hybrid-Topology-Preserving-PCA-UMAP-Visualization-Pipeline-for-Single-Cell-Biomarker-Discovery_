# =============================================================================
# PCA Engine — Principal Component Analysis for scRNA-seq
# =============================================================================
"""
PCA with configurable components, solver, random seed.
Generates:
  - Explained variance ratios
  - Cumulative explained variance
  - PC loadings with top contributing genes
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple

import numpy as np
import scanpy as sc
import scipy.sparse as sp
from anndata import AnnData


@dataclass
class PCAConfig:
    n_components: int = 50
    random_state: int = 42
    solver: str = "arpack"


@dataclass
class PCAResult:
    n_components: int = 0
    explained_variance_ratio: List[float] = field(default_factory=list)
    cumulative_variance: List[float] = field(default_factory=list)
    coordinates: List[List[float]] = field(default_factory=list)  # n_cells x 2 (PC1, PC2)
    loadings: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)  # top genes per PC
    cell_ids: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "n_components": self.n_components,
            "explained_variance_ratio": self.explained_variance_ratio,
            "cumulative_variance": self.cumulative_variance,
            "coordinates": self.coordinates,
            "loadings": self.loadings,
            "cell_ids": self.cell_ids,
        }


def run_pca(adata: AnnData, config: PCAConfig) -> Tuple[AnnData, PCAResult]:
    """
    Run PCA on the preprocessed AnnData object.

    Stores results in adata.obsm['X_pca'] and adata.uns['pca'].
    """
    n_components = min(config.n_components, adata.n_vars - 1, adata.n_obs - 1)

    sc.tl.pca(
        adata,
        n_comps=n_components,
        random_state=config.random_state,
        svd_solver=config.solver,
    )

    result = PCAResult()
    result.n_components = n_components

    # Explained variance
    var_ratio = adata.uns["pca"]["variance_ratio"]
    result.explained_variance_ratio = [float(v) for v in var_ratio]
    result.cumulative_variance = [float(v) for v in np.cumsum(var_ratio)]

    # 2D coordinates (first two PCs)
    pca_coords = adata.obsm["X_pca"][:, :2]
    result.coordinates = pca_coords.tolist()
    result.cell_ids = list(adata.obs_names)

    # Top loadings per PC
    if "PCs" in adata.varm:
        loadings_matrix = adata.varm["PCs"]
    else:
        loadings_matrix = adata.uns["pca"].get("components_", None)
        if loadings_matrix is not None:
            loadings_matrix = loadings_matrix.T  # genes x PCs

    if loadings_matrix is not None:
        gene_names = list(adata.var_names)
        for pc_idx in range(min(5, n_components)):
            pc_loadings = loadings_matrix[:, pc_idx]
            top_indices = np.argsort(np.abs(pc_loadings))[::-1][:10]
            result.loadings[f"PC{pc_idx + 1}"] = [
                {"gene": gene_names[i], "loading": float(pc_loadings[i])}
                for i in top_indices
            ]

    return adata, result
