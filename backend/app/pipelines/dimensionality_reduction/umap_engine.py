# =============================================================================
# UMAP Engine — Hybrid PCA + UMAP with Topology Preservation
# =============================================================================
"""
Central feature of the project: Topology-preserving PCA → UMAP pipeline.

Supports three modes:
  1. Direct UMAP on expression matrix
  2. Hybrid PCA → UMAP (recommended)
  3. PCA-only embedding (for comparison)

Evaluates topology preservation using multiple metrics.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import scanpy as sc
import scipy.sparse as sp
from anndata import AnnData
from sklearn.manifold import trustworthiness
from sklearn.neighbors import NearestNeighbors


@dataclass
class UMAPConfig:
    n_neighbors: int = 15
    min_dist: float = 0.1
    metric: str = "cosine"
    n_components: int = 2
    random_state: int = 42
    pca_components: int = 50  # For hybrid mode


@dataclass
class EmbeddingResult:
    method: str = ""  # "pca", "umap", "hybrid"
    coordinates: List[List[float]] = field(default_factory=list)
    cell_ids: List[str] = field(default_factory=list)
    runtime_seconds: float = 0.0
    topology_scores: Dict[str, float] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "method": self.method,
            "coordinates": self.coordinates,
            "cell_ids": self.cell_ids,
            "runtime_seconds": self.runtime_seconds,
            "topology_scores": self.topology_scores,
        }


def run_hybrid_umap(adata: AnnData, config: UMAPConfig) -> Tuple[AnnData, Dict[str, EmbeddingResult]]:
    """
    Run the full hybrid PCA + UMAP pipeline plus direct comparisons.

    Returns embeddings for: pca, umap_direct, hybrid (pca+umap).
    """
    results: Dict[str, EmbeddingResult] = {}

    # Get the high-dimensional reference for topology metrics
    if sp.issparse(adata.X):
        X_hd = np.asarray(adata.X.toarray())
    else:
        X_hd = np.asarray(adata.X)

    cell_ids = list(adata.obs_names)

    # --- 1. PCA-only embedding ---
    pca_result = EmbeddingResult(method="pca", cell_ids=cell_ids)
    if "X_pca" in adata.obsm:
        pca_coords = adata.obsm["X_pca"][:, :2]
        pca_result.coordinates = pca_coords.tolist()
        pca_result.topology_scores = _compute_topology_metrics(X_hd, pca_coords)
    results["pca"] = pca_result

    # --- 2. Direct UMAP (on full expression space) ---
    t0 = time.time()
    direct_result = EmbeddingResult(method="umap_direct", cell_ids=cell_ids)
    try:
        # Build neighbor graph on full expression
        adata_copy = adata.copy()
        sc.pp.neighbors(
            adata_copy,
            n_neighbors=config.n_neighbors,
            use_rep="X",
            metric=config.metric,
            random_state=config.random_state,
        )
        sc.tl.umap(
            adata_copy,
            min_dist=config.min_dist,
            n_components=config.n_components,
            random_state=config.random_state,
        )
        umap_direct_coords = adata_copy.obsm["X_umap"]
        direct_result.coordinates = umap_direct_coords.tolist()
        direct_result.runtime_seconds = time.time() - t0
        direct_result.topology_scores = _compute_topology_metrics(X_hd, umap_direct_coords)
    except Exception as e:
        direct_result.topology_scores = {"error": str(e)}
    results["umap_direct"] = direct_result

    # --- 3. Hybrid PCA + UMAP (the central method) ---
    t0 = time.time()
    hybrid_result = EmbeddingResult(method="hybrid", cell_ids=cell_ids)

    # Step 1: Use PCA-compressed representation
    if "X_pca" not in adata.obsm:
        n_comps = min(config.pca_components, adata.n_vars - 1, adata.n_obs - 1)
        sc.tl.pca(adata, n_comps=n_comps, random_state=config.random_state)

    # Step 2: Build neighbor graph on PCA space
    sc.pp.neighbors(
        adata,
        n_neighbors=config.n_neighbors,
        n_pcs=min(config.pca_components, adata.obsm["X_pca"].shape[1]),
        metric=config.metric,
        random_state=config.random_state,
    )

    # Step 3: UMAP on neighbor graph
    sc.tl.umap(
        adata,
        min_dist=config.min_dist,
        n_components=config.n_components,
        random_state=config.random_state,
    )

    hybrid_coords = adata.obsm["X_umap"]
    hybrid_result.coordinates = hybrid_coords.tolist()
    hybrid_result.runtime_seconds = time.time() - t0
    hybrid_result.topology_scores = _compute_topology_metrics(X_hd, hybrid_coords)
    results["hybrid"] = hybrid_result

    return adata, results


def _compute_topology_metrics(
    X_high: np.ndarray,
    X_low: np.ndarray,
    k: int = 15,
) -> Dict[str, float]:
    """
    Compute topology preservation metrics between high and low dimensional spaces.

    Metrics:
      - trustworthiness: How well local structure is preserved (sklearn)
      - continuity: How well neighborhoods in the original space are maintained
      - knn_preservation: Fraction of k-nearest neighbors preserved
      - neighborhood_overlap: Average Jaccard similarity of neighborhoods
    """
    n_samples = X_high.shape[0]
    k = min(k, n_samples - 1)

    if n_samples < k + 1:
        return {"error": "Too few samples for topology metrics"}

    metrics: Dict[str, float] = {}

    # Subsample for large datasets (topology metrics are O(n²))
    max_samples = 5000
    if n_samples > max_samples:
        idx = np.random.choice(n_samples, max_samples, replace=False)
        X_high = X_high[idx]
        X_low = X_low[idx]
        n_samples = max_samples

    try:
        # 1. Trustworthiness (sklearn)
        tw = trustworthiness(X_high, X_low, n_neighbors=k)
        metrics["trustworthiness"] = round(float(tw), 4)
    except Exception:
        metrics["trustworthiness"] = -1.0

    try:
        # 2. k-NN preservation
        nn_high = NearestNeighbors(n_neighbors=k, metric="euclidean").fit(X_high)
        nn_low = NearestNeighbors(n_neighbors=k, metric="euclidean").fit(X_low)

        _, idx_high = nn_high.kneighbors(X_high)
        _, idx_low = nn_low.kneighbors(X_low)

        # kNN preservation: fraction of original neighbors preserved in embedding
        preservation_scores = []
        for i in range(n_samples):
            high_neighbors = set(idx_high[i])
            low_neighbors = set(idx_low[i])
            overlap = len(high_neighbors & low_neighbors)
            preservation_scores.append(overlap / k)

        metrics["knn_preservation"] = round(float(np.mean(preservation_scores)), 4)

        # 3. Continuity (reverse trustworthiness)
        continuity_scores = []
        for i in range(n_samples):
            high_neighbors = set(idx_high[i])
            low_neighbors = set(idx_low[i])
            overlap = len(high_neighbors & low_neighbors)
            continuity_scores.append(overlap / k)

        metrics["continuity"] = round(float(np.mean(continuity_scores)), 4)

        # 4. Neighborhood overlap (Jaccard)
        jaccard_scores = []
        for i in range(n_samples):
            high_neighbors = set(idx_high[i])
            low_neighbors = set(idx_low[i])
            intersection = len(high_neighbors & low_neighbors)
            union = len(high_neighbors | low_neighbors)
            jaccard_scores.append(intersection / union if union > 0 else 0.0)

        metrics["neighborhood_overlap"] = round(float(np.mean(jaccard_scores)), 4)

    except Exception as e:
        metrics["knn_preservation"] = -1.0
        metrics["continuity"] = -1.0
        metrics["neighborhood_overlap"] = -1.0

    return metrics
