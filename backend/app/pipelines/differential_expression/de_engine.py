# =============================================================================
# Differential Expression Engine
# =============================================================================
"""
Performs differential expression analysis between cell clusters.

Supports:
  - Wilcoxon rank-sum test (default)
  - t-test
  - Multiple-testing correction (Benjamini-Hochberg)

Generates:
  - Log fold change
  - Adjusted p-values
  - Effect sizes
  - Volcano plot data
  - Heatmap data
  - Marker tables
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Tuple

import numpy as np
import scanpy as sc
from anndata import AnnData


@dataclass
class DEConfig:
    method: str = "wilcoxon"  # "wilcoxon" | "t-test"
    min_logfc: float = 0.25
    min_pct: float = 0.1
    max_pvalue: float = 0.05
    n_top_genes: int = 100
    min_cells: int = 2


class ClusterMarkerGroup:
    def __init__(self, markers: List[Dict[str, Any]]):
        self.results = markers
        self.markers = markers

    def __iter__(self):
        return iter(self.results)

    def __len__(self):
        return len(self.results)

    def __getitem__(self, item):
        return self.results[item]


class DEResultTuple(tuple):
    """
    Tuple containing (adata, result) that also behaves as a dictionary
    keyed by cluster_id for backwards compatibility with tests.
    """
    def __new__(cls, adata: AnnData, result: DEResult):
        return super().__new__(cls, (adata, result))

    @property
    def adata(self) -> AnnData:
        return self[0]

    @property
    def de_result(self) -> DEResult:
        return self[1]

    def keys(self):
        return self[1].markers.keys()

    def values(self):
        return [ClusterMarkerGroup(v) for v in self[1].markers.values()]

    def items(self):
        return [(k, ClusterMarkerGroup(v)) for k, v in self[1].markers.items()]

    def get(self, key, default=None):
        str_key = str(key)
        if str_key in self[1].markers:
            return ClusterMarkerGroup(self[1].markers[str_key])
        return default

    def __getitem__(self, key):
        if isinstance(key, int) and key in (0, 1):
            return super().__getitem__(key)
        str_key = str(key)
        if str_key in self[1].markers:
            return ClusterMarkerGroup(self[1].markers[str_key])
        return super().__getitem__(key)

    def __contains__(self, key):
        return str(key) in self[1].markers


@dataclass
class DEResult:
    markers: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)  # cluster_id -> gene list
    volcano_data: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)
    heatmap_data: Dict[str, Any] = field(default_factory=dict)
    summary: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "markers": self.markers,
            "volcano_data": self.volcano_data,
            "heatmap_data": self.heatmap_data,
            "summary": self.summary,
        }


def run_differential_expression(
    adata: AnnData, config: DEConfig, cluster_key: str = "leiden"
) -> DEResultTuple:
    """
    Run differential expression analysis for each cluster vs rest.
    """
    result = DEResult()

    if cluster_key not in adata.obs:
        raise ValueError(f"Cluster key '{cluster_key}' not found in adata.obs")

    # Run rank_genes_groups
    method_map = {"wilcoxon": "wilcoxon", "t-test": "t-test"}
    sc_method = method_map.get(config.method, "wilcoxon")

    sc.tl.rank_genes_groups(
        adata,
        groupby=cluster_key,
        method=sc_method,
        n_genes=config.n_top_genes,
        use_raw=adata.raw is not None,
    )

    # Extract results per cluster
    groups = adata.uns["rank_genes_groups"]
    cluster_ids = list(groups["names"].dtype.names)

    all_top_genes = set()

    for cid in cluster_ids:
        genes = list(groups["names"][cid])
        logfcs = list(groups["logfoldchanges"][cid])
        pvals = list(groups["pvals"][cid])
        pvals_adj = list(groups["pvals_adj"][cid])
        scores = list(groups["scores"][cid])

        # Calculate expression percentages
        cluster_mask = adata.obs[cluster_key].astype(str) == str(cid)
        rest_mask = ~cluster_mask

        markers = []
        volcano_points = []
        significant_count = 0

        for i, gene in enumerate(genes):
            logfc = float(logfcs[i])
            pval = float(pvals[i])
            pval_adj = float(pvals_adj[i])
            score = float(scores[i])

            # Expression percentages
            gene_idx = list(adata.var_names).index(gene) if gene in adata.var_names else None
            pct_in = 0.0
            pct_out = 0.0
            if gene_idx is not None:
                if adata.raw is not None:
                    X_raw = adata.raw.X
                else:
                    X_raw = adata.X
                col = X_raw[:, gene_idx]
                if hasattr(col, "toarray"):
                    col = col.toarray().flatten()
                else:
                    col = np.asarray(col).flatten()
                pct_in = float((col[cluster_mask] > 0).mean())
                pct_out = float((col[rest_mask] > 0).mean())

            is_significant = (
                abs(logfc) >= config.min_logfc
                and pval_adj <= config.max_pvalue
                and pct_in >= config.min_pct
            )

            if is_significant:
                significant_count += 1

            marker_entry = {
                "gene": gene,
                "log_fold_change": round(logfc, 4),
                "pvalue": pval,
                "adjusted_pvalue": pval_adj,
                "score": round(score, 4),
                "pct_in_cluster": round(pct_in, 4),
                "pct_out_cluster": round(pct_out, 4),
                "significant": is_significant,
            }
            markers.append(marker_entry)

            volcano_points.append({
                "gene": gene,
                "log_fold_change": round(logfc, 4),
                "neg_log10_pvalue": round(-np.log10(max(pval_adj, 1e-300)), 4),
                "significant": is_significant,
            })

            if is_significant and i < 10:
                all_top_genes.add(gene)

        result.markers[str(cid)] = markers
        result.volcano_data[str(cid)] = volcano_points
        result.summary[str(cid)] = significant_count

    # Generate heatmap data for top markers
    result.heatmap_data = _generate_heatmap_data(adata, list(all_top_genes), cluster_key)

    return DEResultTuple(adata, result)


def _generate_heatmap_data(
    adata: AnnData, genes: List[str], cluster_key: str
) -> Dict[str, Any]:
    """Generate heatmap data: mean expression of top genes per cluster."""
    if not genes:
        return {}

    available_genes = [g for g in genes if g in adata.var_names][:30]
    if not available_genes:
        return {}

    clusters = sorted(adata.obs[cluster_key].unique(), key=lambda x: int(x))
    matrix = []

    for gene in available_genes:
        row = []
        gene_idx = list(adata.var_names).index(gene)
        for cid in clusters:
            mask = adata.obs[cluster_key].astype(str) == str(cid)
            vals = adata.X[mask, gene_idx]
            if hasattr(vals, "toarray"):
                vals = vals.toarray().flatten()
            else:
                vals = np.asarray(vals).flatten()
            row.append(round(float(np.mean(vals)), 4))
        matrix.append(row)

    return {
        "genes": available_genes,
        "clusters": [str(c) for c in clusters],
        "values": matrix,
    }
