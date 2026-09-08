# =============================================================================
# Biomarker Discovery Engine
# =============================================================================
"""
Composite biomarker scoring and ranking system.

Score = weighted combination of:
  - Normalized effect size
  - Statistical significance
  - Expression prevalence
  - Cluster specificity
  - Classification performance (AUC)

Produces:
  - Ranked candidate biomarkers per cluster
  - ROC curves
  - Transparent score breakdown
  - Category labels (Highly Specific, Strong Classifier, etc.)
  - Validation warnings
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from anndata import AnnData
from sklearn.metrics import roc_auc_score, roc_curve, precision_recall_fscore_support


@dataclass
class BiomarkerConfig:
    top_n: int = 50
    top_n_per_cluster: int = 50
    min_auc: float = 0.5
    min_adjusted_pvalue: float = 0.05
    min_log_fold_change: float = 0.5
    min_expression_pct: float = 0.1
    target_cluster: Optional[int] = None
    comparison_cluster: Optional[int] = None


@dataclass
class BiomarkerCandidate:
    gene: str = ""
    cluster_id: int = 0
    rank: int = 0
    biomarker_score: float = 0.0
    effect_size: float = 0.0
    log_fold_change: float = 0.0
    adjusted_pvalue: float = 1.0
    auc: float = 0.0
    sensitivity: float = 0.0
    specificity: float = 0.0
    precision: float = 0.0
    recall: float = 0.0
    f1: float = 0.0
    expression_prevalence: float = 0.0
    cluster_specificity: float = 0.0
    category: str = ""
    roc_curve: Dict[str, List[float]] = field(default_factory=dict)
    score_breakdown: Dict[str, float] = field(default_factory=dict)

    @property
    def roc_auc(self) -> float:
        return self.auc

    @property
    def composite_score(self) -> float:
        return self.biomarker_score

    def to_dict(self) -> Dict[str, Any]:
        return {
            "gene": self.gene,
            "cluster_id": self.cluster_id,
            "rank": self.rank,
            "biomarker_score": self.biomarker_score,
            "effect_size": self.effect_size,
            "log_fold_change": self.log_fold_change,
            "adjusted_pvalue": self.adjusted_pvalue,
            "auc": self.auc,
            "sensitivity": self.sensitivity,
            "specificity": self.specificity,
            "precision": self.precision,
            "recall": self.recall,
            "f1": self.f1,
            "expression_prevalence": self.expression_prevalence,
            "cluster_specificity": self.cluster_specificity,
            "category": self.category,
            "roc_curve": self.roc_curve,
            "score_breakdown": self.score_breakdown,
        }


@dataclass
class BiomarkerResult:
    candidates: List[BiomarkerCandidate] = field(default_factory=list)
    validation_warning: str = (
        "Computational ranking does not constitute clinical validation. "
        "Experimental validation is required before clinical use."
    )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidates": [c.to_dict() for c in self.candidates],
            "validation_warning": self.validation_warning,
        }


def run_biomarker_discovery(
    adata: AnnData,
    de_results: Dict[str, List[Dict[str, Any]]],
    config: BiomarkerConfig,
    cluster_key: str = "leiden",
) -> BiomarkerResult:
    """
    Score and rank biomarker candidates based on DE results and expression data.
    """
    result = BiomarkerResult()

    clusters = sorted(de_results.keys())
    if config.target_cluster is not None:
        clusters = [str(config.target_cluster)]

    for cid in clusters:
        markers = de_results.get(str(cid), [])
        if not markers:
            continue

        cluster_mask = adata.obs[cluster_key].astype(str) == str(cid)
        if config.comparison_cluster is not None:
            rest_mask = adata.obs[cluster_key].astype(str) == str(config.comparison_cluster)
        else:
            rest_mask = ~cluster_mask

        for marker in markers:
            gene = marker["gene"]
            logfc = marker.get("log_fold_change", 0)
            pval_adj = marker.get("adjusted_pvalue", 1.0)
            pct_in = marker.get("pct_in_cluster", 0)

            # Filter by thresholds
            if pval_adj > config.min_adjusted_pvalue:
                continue
            if abs(logfc) < config.min_log_fold_change:
                continue
            if pct_in < config.min_expression_pct:
                continue

            # Get expression values for this gene
            if gene not in adata.var_names:
                continue

            gene_idx = list(adata.var_names).index(gene)
            X = adata.raw.X if adata.raw is not None else adata.X
            expr = X[:, gene_idx]
            if hasattr(expr, "toarray"):
                expr = expr.toarray().flatten()
            else:
                expr = np.asarray(expr).flatten()

            expr_cluster = expr[cluster_mask]
            expr_rest = expr[rest_mask]

            if len(expr_cluster) == 0 or len(expr_rest) == 0:
                continue

            candidate = BiomarkerCandidate(
                gene=gene,
                cluster_id=int(cid),
                log_fold_change=logfc,
                adjusted_pvalue=pval_adj,
                expression_prevalence=pct_in,
            )

            # ---- Compute classifier metrics ----
            try:
                y_true = np.concatenate([
                    np.ones(len(expr_cluster)),
                    np.zeros(len(expr_rest)),
                ])
                y_scores = np.concatenate([expr_cluster, expr_rest])

                # AUC
                candidate.auc = float(roc_auc_score(y_true, y_scores))

                # ROC curve
                fpr, tpr, thresholds = roc_curve(y_true, y_scores)
                candidate.roc_curve = {
                    "fpr": [float(x) for x in fpr[::max(1, len(fpr) // 50)]],
                    "tpr": [float(x) for x in tpr[::max(1, len(tpr) // 50)]],
                }

                # Binary classification at optimal threshold (Youden's J)
                j_scores = tpr - fpr
                optimal_idx = np.argmax(j_scores)
                optimal_threshold = thresholds[optimal_idx]

                y_pred = (y_scores >= optimal_threshold).astype(int)
                prec, rec, f1, _ = precision_recall_fscore_support(
                    y_true, y_pred, average="binary", zero_division=0
                )
                candidate.precision = float(prec)
                candidate.recall = float(rec)
                candidate.f1 = float(f1)
                candidate.sensitivity = float(rec)

                # Specificity
                tn = int(np.sum((y_pred == 0) & (y_true == 0)))
                fp = int(np.sum((y_pred == 1) & (y_true == 0)))
                candidate.specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0

            except Exception:
                candidate.auc = 0.5

            # ---- Effect size (Cohen's d) ----
            mean_diff = np.mean(expr_cluster) - np.mean(expr_rest)
            pooled_std = np.sqrt(
                (np.var(expr_cluster) * (len(expr_cluster) - 1)
                 + np.var(expr_rest) * (len(expr_rest) - 1))
                / (len(expr_cluster) + len(expr_rest) - 2)
            )
            candidate.effect_size = float(mean_diff / pooled_std) if pooled_std > 0 else 0.0

            # ---- Cluster specificity ----
            all_clusters = sorted(adata.obs[cluster_key].unique())
            expr_means = []
            for c in all_clusters:
                c_mask = adata.obs[cluster_key].astype(str) == str(c)
                c_expr = expr[c_mask]
                expr_means.append(float(np.mean(c_expr)))

            target_mean = expr_means[list(all_clusters).index(str(cid))] if str(cid) in list(all_clusters) else 0
            max_other = max((m for i, m in enumerate(expr_means) if str(all_clusters[i]) != str(cid)), default=0)
            candidate.cluster_specificity = (
                target_mean / (target_mean + max_other) if (target_mean + max_other) > 0 else 0.0
            )

            # ---- Composite score ----
            score_components = {
                "effect_size": _normalize_score(abs(candidate.effect_size), 0, 3),
                "significance": _normalize_score(-np.log10(max(pval_adj, 1e-300)), 0, 50),
                "prevalence": candidate.expression_prevalence,
                "specificity": candidate.cluster_specificity,
                "auc": candidate.auc,
            }

            weights = {
                "effect_size": 0.20,
                "significance": 0.15,
                "prevalence": 0.15,
                "specificity": 0.25,
                "auc": 0.25,
            }

            candidate.biomarker_score = sum(
                score_components[k] * weights[k] for k in weights
            )
            candidate.score_breakdown = {k: round(v, 4) for k, v in score_components.items()}

            # ---- Category ----
            candidate.category = _assign_category(candidate)

            result.candidates.append(candidate)

    # Sort by score and assign ranks
    result.candidates.sort(key=lambda c: c.biomarker_score, reverse=True)

    # Limit to top_n per cluster
    seen_per_cluster: Dict[int, int] = {}
    filtered = []
    for c in result.candidates:
        count = seen_per_cluster.get(c.cluster_id, 0)
        if count < config.top_n:
            seen_per_cluster[c.cluster_id] = count + 1
            c.rank = count + 1
            filtered.append(c)

    result.candidates = filtered
    return result


def _normalize_score(value: float, min_val: float, max_val: float) -> float:
    """Normalize a value to [0, 1] range."""
    if max_val <= min_val:
        return 0.0
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))


def _assign_category(candidate: BiomarkerCandidate) -> str:
    """Assign a biomarker category based on its strongest property."""
    categories = []

    if candidate.cluster_specificity >= 0.8:
        categories.append("Highly Specific")
    if candidate.sensitivity >= 0.9:
        categories.append("Highly Sensitive")
    if abs(candidate.log_fold_change) >= 2.0:
        categories.append("Strong Differential Expression")
    if candidate.auc >= 0.9:
        categories.append("Strong Classifier")
    if candidate.expression_prevalence >= 0.8:
        categories.append("Cluster-Specific")

    return "; ".join(categories) if categories else "Candidate"


def discover_biomarkers(
    adata: AnnData,
    de_results: Any,
    config: Optional[BiomarkerConfig] = None,
    cluster_key: str = "leiden",
) -> List[BiomarkerCandidate]:
    """Helper returning list of BiomarkerCandidate objects directly."""
    if config is None:
        config = BiomarkerConfig()

    markers_dict: Dict[str, List[Dict[str, Any]]] = {}
    if hasattr(de_results, "markers"):
        markers_dict = de_results.markers
    elif isinstance(de_results, dict) or hasattr(de_results, "items"):
        for k, v in de_results.items():
            if hasattr(v, "results"):
                markers_dict[str(k)] = v.results
            elif hasattr(v, "markers"):
                markers_dict[str(k)] = v.markers
            elif isinstance(v, dict) and "results" in v:
                markers_dict[str(k)] = v["results"]
            elif isinstance(v, list):
                markers_dict[str(k)] = v

    result = run_biomarker_discovery(adata, markers_dict, config, cluster_key)
    return result.candidates

