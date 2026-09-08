# =============================================================================
# Pydantic Schemas — Experiment & Pipeline Config
# =============================================================================
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class NormalizationConfig(BaseModel):
    target_sum: float = 10000.0
    log_transform: bool = True


class HVGConfig(BaseModel):
    n_top_genes: int = 2000
    flavor: str = "seurat_v3"


class PCAConfig(BaseModel):
    n_components: int = 50
    random_state: int = 42
    solver: str = "arpack"


class UMAPConfig(BaseModel):
    n_neighbors: int = 15
    min_dist: float = 0.1
    metric: str = "cosine"
    n_components: int = 2
    random_state: int = 42


class ClusteringConfig(BaseModel):
    method: str = "leiden"  # leiden | hdbscan
    resolution: float = 0.8
    random_state: int = 42


class QCConfig(BaseModel):
    min_genes: int = 200
    max_genes: int = 5000
    min_counts: int = 500
    max_mito_pct: float = 20.0


class DEConfig(BaseModel):
    method: str = "wilcoxon"  # wilcoxon | t-test
    min_logfc: float = 0.25
    min_pct: float = 0.1
    max_pvalue: float = 0.05


class BiomarkerConfig(BaseModel):
    top_n: int = 50
    min_adjusted_pvalue: float = 0.05
    min_log_fold_change: float = 0.5
    min_expression_pct: float = 0.1
    target_cluster: Optional[int] = None
    comparison_cluster: Optional[int] = None


class PipelineConfig(BaseModel):
    qc: QCConfig = QCConfig()
    normalization: NormalizationConfig = NormalizationConfig()
    hvg: HVGConfig = HVGConfig()
    pca: PCAConfig = PCAConfig()
    umap: UMAPConfig = UMAPConfig()
    clustering: ClusteringConfig = ClusteringConfig()
    de: DEConfig = DEConfig()
    biomarkers: BiomarkerConfig = BiomarkerConfig()
    random_seed: int = 42


# ---- Experiment CRUD ----
class ExperimentCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=512)
    description: Optional[str] = None
    dataset_id: int
    pipeline_config: PipelineConfig = PipelineConfig()


class ExperimentResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    status: str
    dataset_id: int
    owner_id: int
    pipeline_config: Optional[str] = None
    n_clusters: Optional[int] = None
    n_biomarkers: Optional[int] = None
    topology_score: Optional[float] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ExperimentListResponse(BaseModel):
    experiments: List[ExperimentResponse]
    total: int


# ---- Job ----
class JobResponse(BaseModel):
    id: int
    task_id: Optional[str] = None
    step: str
    status: str
    progress: float
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    runtime_seconds: Optional[float] = None
    experiment_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PipelineStatusResponse(BaseModel):
    experiment_id: int
    experiment_name: str
    overall_status: str
    steps: List[JobResponse]


# ---- Results ----
class QCResultResponse(BaseModel):
    cells_before: int
    cells_after: int
    cells_removed: int
    genes_before: int
    genes_after: int
    warnings: List[str]
    plots: Dict[str, Any]


class EmbeddingResultResponse(BaseModel):
    method: str  # pca | umap | hybrid
    coordinates: List[List[float]]
    cell_ids: List[str]
    metadata: Dict[str, Any] = {}
    topology_scores: Optional[Dict[str, float]] = None


class ClusterResultResponse(BaseModel):
    n_clusters: int
    cluster_labels: List[int]
    cluster_stats: List[Dict[str, Any]]


class BiomarkerResponse(BaseModel):
    id: int
    gene_name: str
    cluster_id: int
    rank: int
    biomarker_score: float
    effect_size: Optional[float] = None
    log_fold_change: Optional[float] = None
    adjusted_pvalue: Optional[float] = None
    auc: Optional[float] = None
    sensitivity: Optional[float] = None
    specificity: Optional[float] = None
    precision_score: Optional[float] = None
    recall_score: Optional[float] = None
    f1: Optional[float] = None
    expression_prevalence: Optional[float] = None
    cluster_specificity: Optional[float] = None
    category: Optional[str] = None
    experiment_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class BiomarkerListResponse(BaseModel):
    biomarkers: List[BiomarkerResponse]
    total: int
    validation_warning: str = (
        "Computational ranking does not constitute clinical validation. "
        "Experimental validation is required before clinical use."
    )
