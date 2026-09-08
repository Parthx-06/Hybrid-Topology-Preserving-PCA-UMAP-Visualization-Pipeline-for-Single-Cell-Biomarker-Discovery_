# =============================================================================
# Clustering Engine — Leiden & HDBSCAN for Cell Population Discovery
# =============================================================================
"""
Cell clustering using:
  - Leiden algorithm (default, via scanpy/leidenalg)
  - HDBSCAN (optional)

Generates:
  - Cluster labels
  - Cluster statistics (size, percentage, composition)
  - Suspicious cluster warnings
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple

import numpy as np
import scanpy as sc
from anndata import AnnData


@dataclass
class ClusterConfig:
    method: str = "leiden"  # "leiden" | "hdbscan"
    resolution: float = 0.8
    random_state: int = 42
    min_cluster_size: int = 15  # for HDBSCAN


@dataclass
class ClusterResult:
    n_clusters: int = 0
    cluster_labels: List[int] = field(default_factory=list)
    cluster_stats: List[Dict[str, Any]] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    @property
    def clusters(self) -> List[Dict[str, Any]]:
        return self.cluster_stats

    def to_dict(self) -> Dict[str, Any]:
        return {
            "n_clusters": self.n_clusters,
            "cluster_labels": self.cluster_labels,
            "cluster_stats": self.cluster_stats,
            "warnings": self.warnings,
        }


def run_clustering(adata: AnnData, config: ClusterConfig) -> Tuple[AnnData, ClusterResult]:
    """
    Cluster cells using the specified method.

    Requires neighbor graph to be precomputed (done by UMAP step).
    """
    result = ClusterResult()

    if config.method == "leiden":
        adata, result = _run_leiden(adata, config, result)
    elif config.method == "hdbscan":
        adata, result = _run_hdbscan(adata, config, result)
    else:
        raise ValueError(f"Unknown clustering method: {config.method}")

    # Compute cluster statistics
    result.cluster_stats = _compute_cluster_stats(adata, result.cluster_labels)

    # Check for suspicious clusters
    result.warnings = _check_suspicious_clusters(result.cluster_stats, adata)

    return adata, result


def _run_leiden(
    adata: AnnData, config: ClusterConfig, result: ClusterResult
) -> Tuple[AnnData, ClusterResult]:
    """Run Leiden clustering."""
    # Ensure neighbor graph exists
    if "neighbors" not in adata.uns:
        sc.pp.neighbors(adata, random_state=config.random_state)

    sc.tl.leiden(
        adata,
        resolution=config.resolution,
        random_state=config.random_state,
        key_added="leiden",
    )

    labels = adata.obs["leiden"].astype(int).tolist()
    result.cluster_labels = labels
    result.n_clusters = len(set(labels))

    return adata, result


def _run_hdbscan(
    adata: AnnData, config: ClusterConfig, result: ClusterResult
) -> Tuple[AnnData, ClusterResult]:
    """Run HDBSCAN clustering."""
    try:
        import hdbscan
    except ImportError:
        raise ImportError("hdbscan package required for HDBSCAN clustering")

    # Use PCA coordinates if available, else use X
    X = adata.obsm.get("X_pca", adata.X)
    if hasattr(X, "toarray"):
        X = X.toarray()

    clusterer = hdbscan.HDBSCAN(
        min_cluster_size=config.min_cluster_size,
        min_samples=5,
        metric="euclidean",
    )
    labels = clusterer.fit_predict(X)

    # HDBSCAN uses -1 for noise; remap
    labels = [int(l) for l in labels]
    adata.obs["hdbscan"] = labels

    # Count valid clusters (exclude noise)
    unique = set(l for l in labels if l >= 0)
    result.cluster_labels = labels
    result.n_clusters = len(unique)

    noise_count = labels.count(-1)
    if noise_count > 0:
        result.warnings.append(
            f"HDBSCAN classified {noise_count} cells as noise (cluster -1)."
        )

    return adata, result


def _compute_cluster_stats(
    adata: AnnData, labels: List[int]
) -> List[Dict[str, Any]]:
    """Compute statistics for each cluster."""
    labels_arr = np.array(labels)
    unique_clusters = sorted(set(labels_arr))
    total = len(labels_arr)

    stats = []
    for cid in unique_clusters:
        mask = labels_arr == cid
        n_cells = int(mask.sum())
        pct = round(n_cells / total * 100, 2)

        # Average expression
        cluster_data = adata.X[mask]
        if hasattr(cluster_data, "toarray"):
            cluster_data = cluster_data.toarray()
        avg_expr = float(np.mean(cluster_data))

        # Sample distribution (if 'batch' or 'sample' in obs)
        sample_dist = {}
        for col in ["batch", "sample", "donor", "condition"]:
            if col in adata.obs.columns:
                dist = adata.obs.loc[mask, col].value_counts().to_dict()
                sample_dist[col] = {str(k): int(v) for k, v in dist.items()}

        stats.append({
            "cluster_id": int(cid),
            "n_cells": n_cells,
            "percentage": pct,
            "avg_expression": round(avg_expr, 4),
            "sample_distribution": sample_dist,
        })

    return stats


def _check_suspicious_clusters(
    cluster_stats: List[Dict[str, Any]], adata: AnnData
) -> List[str]:
    """Detect potentially problematic clusters."""
    warnings = []
    total_cells = adata.n_obs

    for cs in cluster_stats:
        # Extremely small clusters
        if cs["n_cells"] < 10:
            warnings.append(
                f"Cluster {cs['cluster_id']} has only {cs['n_cells']} cells — "
                "may represent doublets or outliers."
            )
        # Dominant sample
        for col, dist in cs.get("sample_distribution", {}).items():
            if dist:
                max_sample_pct = max(dist.values()) / cs["n_cells"] * 100
                if max_sample_pct > 90 and cs["n_cells"] > 20:
                    warnings.append(
                        f"Cluster {cs['cluster_id']} is >90% dominated by one {col} — "
                        "potential batch effect."
                    )

    return warnings
