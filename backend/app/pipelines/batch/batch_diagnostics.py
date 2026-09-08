# =============================================================================
# Batch Effect Diagnostics & Evaluation Module
# =============================================================================
"""
Evaluates batch effects and batch mixing in single-cell RNA-seq datasets.
Calculates:
  1. Batch entropy / mixing score across neighborhoods
  2. Batch representation per cluster
  3. Batch-associated cluster warnings (e.g. cluster dominated by a single batch)
  4. Integration quality diagnostics
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from anndata import AnnData
from sklearn.neighbors import NearestNeighbors

logger = logging.getLogger(__name__)


@dataclass
class BatchDiagnosticResult:
    batch_key: str
    num_batches: int
    batch_counts: Dict[str, int]
    overall_mixing_entropy: float  # Normalized [0, 1] where 1 = perfectly mixed
    cluster_batch_entropy: Dict[str, float]
    batch_dominated_clusters: List[Dict[str, Any]]
    recommendation: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "batch_key": self.batch_key,
            "num_batches": self.num_batches,
            "batch_counts": self.batch_counts,
            "overall_mixing_entropy": self.overall_mixing_entropy,
            "cluster_batch_entropy": self.cluster_batch_entropy,
            "batch_dominated_clusters": self.batch_dominated_clusters,
            "recommendation": self.recommendation,
        }


def compute_neighborhood_entropy(
    embedding: np.ndarray,
    batch_labels: np.ndarray,
    n_neighbors: int = 30,
) -> float:
    """
    Compute mean Shannon entropy across k-nearest neighbor graphs.
    Entropy is normalized by log(num_unique_batches) so max is 1.0.
    """
    unique_batches, batch_idx = np.unique(batch_labels, return_inverse=True)
    n_batches = len(unique_batches)
    if n_batches <= 1:
        return 1.0

    nn = NearestNeighbors(n_neighbors=min(n_neighbors, len(batch_labels)), metric="euclidean")
    nn.fit(embedding)
    _, indices = nn.kneighbors(embedding)

    entropies = []
    max_entropy = np.log(n_batches)

    for idx_set in indices:
        neighbor_batches = batch_idx[idx_set]
        counts = np.bincount(neighbor_batches, minlength=n_batches)
        probs = counts / counts.sum()
        probs = probs[probs > 0]
        ent = -np.sum(probs * np.log(probs))
        entropies.append(ent / max_entropy if max_entropy > 0 else 1.0)

    return float(np.mean(entropies))


def evaluate_batch_effects(
    adata: AnnData,
    batch_key: str = "batch",
    cluster_key: str = "leiden",
    rep_key: str = "X_umap_hybrid",
    dominance_threshold: float = 0.75,
) -> BatchDiagnosticResult:
    """
    Run full batch diagnostics on AnnData object.
    """
    if batch_key not in adata.obs.columns:
        return BatchDiagnosticResult(
            batch_key=batch_key,
            num_batches=1,
            batch_counts={},
            overall_mixing_entropy=1.0,
            cluster_batch_entropy={},
            batch_dominated_clusters=[],
            recommendation=f"Batch key '{batch_key}' not present in cell metadata. No batch correction needed.",
        )

    batches = adata.obs[batch_key].astype(str)
    counts = batches.value_counts().to_dict()
    n_batches = len(counts)

    if n_batches <= 1:
        return BatchDiagnosticResult(
            batch_key=batch_key,
            num_batches=n_batches,
            batch_counts=counts,
            overall_mixing_entropy=1.0,
            cluster_batch_entropy={},
            batch_dominated_clusters=[],
            recommendation="Single batch detected. Batch integration is not required.",
        )

    # Use embedding or PCA representation
    if rep_key in adata.obsm:
        rep = np.asarray(adata.obsm[rep_key])
    elif "X_pca" in adata.obsm:
        rep = np.asarray(adata.obsm["X_pca"])
    else:
        rep = np.asarray(adata.X.toarray() if hasattr(adata.X, "toarray") else adata.X)

    overall_entropy = compute_neighborhood_entropy(rep, batches.values)

    # Evaluate per-cluster entropy and check for dominance
    cluster_entropies = {}
    batch_dominated = []

    if cluster_key in adata.obs.columns:
        clusters = adata.obs[cluster_key].astype(str)
        for c in clusters.unique():
            mask = (clusters == c).values
            cluster_batches = batches.values[mask]
            sub_counts = pd.Series(cluster_batches).value_counts(normalize=True)
            max_batch = sub_counts.index[0]
            max_pct = float(sub_counts.iloc[0])

            # Cluster entropy
            p = sub_counts.values
            ent = -np.sum(p * np.log(p + 1e-12)) / (np.log(n_batches) if n_batches > 1 else 1.0)
            cluster_entropies[c] = round(float(ent), 4)

            if max_pct >= dominance_threshold:
                batch_dominated.append({
                    "cluster_id": c,
                    "dominant_batch": max_batch,
                    "proportion": round(max_pct, 4),
                    "cell_count": int(mask.sum()),
                    "warning": f"Cluster {c} is {round(max_pct * 100, 1)}% from batch '{max_batch}'. Potential batch artifact.",
                })

    # Overall recommendation
    if overall_entropy >= 0.70 and len(batch_dominated) == 0:
        rec = "Excellent batch mixing. No batch-correction artifacts identified."
    elif overall_entropy >= 0.50:
        rec = "Moderate batch mixing. Minimal batch artifacts observed. Standard PCA+UMAP pipeline is reliable."
    else:
        rec = "Significant batch segregation detected (entropy < 0.50). Consider applying Harmony or BBKNN integration before biomarker extraction."

    return BatchDiagnosticResult(
        batch_key=batch_key,
        num_batches=n_batches,
        batch_counts=counts,
        overall_mixing_entropy=round(overall_entropy, 4),
        cluster_batch_entropy=cluster_entropies,
        batch_dominated_clusters=batch_dominated,
        recommendation=rec,
    )
