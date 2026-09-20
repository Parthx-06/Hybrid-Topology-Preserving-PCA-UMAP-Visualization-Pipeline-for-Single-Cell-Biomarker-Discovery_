# =============================================================================
# Celery Tasks — Pipeline Step Execution
# =============================================================================
"""
Each pipeline step runs as a Celery task with progress reporting.
Results are saved to disk as JSON and the database is updated.
"""
from __future__ import annotations

import json
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path

import anndata as ad
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.workers.celery_app import celery_app

# Use synchronous SQLAlchemy for Celery workers
_raw_sync = settings.database_url.replace("+asyncpg", "").replace("+aiosqlite", "")
if _raw_sync.startswith("postgres://"):
    _raw_sync = _raw_sync.replace("postgres://", "postgresql://", 1)
SYNC_DB_URL = _raw_sync
sync_engine = create_engine(SYNC_DB_URL)
SyncSession = sessionmaker(bind=sync_engine)


def _update_job(job_id: int, **kwargs):
    """Update a job record synchronously."""
    from app.models.job import AnalysisJob
    session = SyncSession()
    try:
        job = session.query(AnalysisJob).filter(AnalysisJob.id == job_id).first()
        if job:
            for k, v in kwargs.items():
                setattr(job, k, v)
            session.commit()
    finally:
        session.close()


def _update_experiment(exp_id: int, **kwargs):
    """Update experiment record synchronously."""
    from app.models.experiment import Experiment
    session = SyncSession()
    try:
        exp = session.query(Experiment).filter(Experiment.id == exp_id).first()
        if exp:
            for k, v in kwargs.items():
                setattr(exp, k, v)
            session.commit()
    finally:
        session.close()


def _save_results(exp_id: int, step: str, data: dict):
    """Save step results to disk."""
    results_dir = Path(settings.results_dir) / str(exp_id)
    results_dir.mkdir(parents=True, exist_ok=True)
    path = results_dir / f"{step}_results.json"
    path.write_text(json.dumps(data, default=str))


def _get_dataset_path(exp_id: int) -> str:
    """Get the dataset file path for an experiment."""
    from app.models.experiment import Experiment
    from app.models.dataset import Dataset
    session = SyncSession()
    try:
        exp = session.query(Experiment).filter(Experiment.id == exp_id).first()
        ds = session.query(Dataset).filter(Dataset.id == exp.dataset_id).first()
        return ds.file_path
    finally:
        session.close()


def _get_pipeline_config(exp_id: int) -> dict:
    """Get the pipeline configuration for an experiment."""
    from app.models.experiment import Experiment
    session = SyncSession()
    try:
        exp = session.query(Experiment).filter(Experiment.id == exp_id).first()
        return json.loads(exp.pipeline_config) if exp.pipeline_config else {}
    finally:
        session.close()


def _get_adata_path(exp_id: int) -> Path:
    """Get the path for the processed adata file."""
    return Path(settings.results_dir) / str(exp_id) / "adata_processed.h5ad"


@celery_app.task(bind=True, name="run_analysis_step")
def run_analysis_step(self, job_id: int, exp_id: int, step: str):
    """Execute a single pipeline step."""
    _update_job(job_id, status="running", started_at=datetime.now(timezone.utc), progress=0)

    try:
        t0 = time.time()

        if step == "qc":
            _run_qc_step(exp_id, job_id)
        elif step == "preprocess":
            _run_preprocess_step(exp_id, job_id)
        elif step == "pca":
            _run_pca_step(exp_id, job_id)
        elif step == "umap":
            _run_umap_step(exp_id, job_id)
        elif step == "cluster":
            _run_cluster_step(exp_id, job_id)
        elif step == "de":
            _run_de_step(exp_id, job_id)
        elif step == "biomarkers":
            _run_biomarker_step(exp_id, job_id)
        else:
            raise ValueError(f"Unknown step: {step}")

        runtime = time.time() - t0
        _update_job(
            job_id,
            status="completed",
            progress=100,
            completed_at=datetime.now(timezone.utc),
            runtime_seconds=round(runtime, 2),
        )

    except Exception as e:
        _update_job(
            job_id,
            status="failed",
            error_message=str(e),
            completed_at=datetime.now(timezone.utc),
        )
        _update_experiment(exp_id, status="failed")
        raise


def _run_qc_step(exp_id: int, job_id: int):
    from app.pipelines.qc.qc_pipeline import QCConfig as QCCfg, run_qc

    config = _get_pipeline_config(exp_id)
    qc_cfg = config.get("qc", {})
    dataset_path = _get_dataset_path(exp_id)

    _update_job(job_id, progress=10)

    adata = ad.read_h5ad(dataset_path)
    _update_job(job_id, progress=30)

    qc_config = QCCfg(
        min_genes=qc_cfg.get("min_genes", 200),
        max_genes=qc_cfg.get("max_genes", 5000),
        min_counts=qc_cfg.get("min_counts", 500),
        max_mito_pct=qc_cfg.get("max_mito_pct", 20.0),
    )

    adata, qc_result = run_qc(adata, qc_config)
    _update_job(job_id, progress=80)

    # Save processed adata
    adata_path = _get_adata_path(exp_id)
    adata_path.parent.mkdir(parents=True, exist_ok=True)
    adata.write_h5ad(adata_path)

    _save_results(exp_id, "qc", qc_result.to_dict())
    _update_job(job_id, progress=100)


def _run_preprocess_step(exp_id: int, job_id: int):
    from app.pipelines.preprocessing.normalization import PreprocessConfig, run_preprocessing

    config = _get_pipeline_config(exp_id)
    norm_cfg = config.get("normalization", {})
    hvg_cfg = config.get("hvg", {})

    adata = ad.read_h5ad(_get_adata_path(exp_id))
    _update_job(job_id, progress=20)

    pp_config = PreprocessConfig(
        target_sum=norm_cfg.get("target_sum", 10000),
        log_transform=norm_cfg.get("log_transform", True),
        n_top_genes=hvg_cfg.get("n_top_genes", 2000),
        hvg_flavor=hvg_cfg.get("flavor", "seurat_v3"),
    )

    adata, pp_result = run_preprocessing(adata, pp_config)
    _update_job(job_id, progress=80)

    adata.write_h5ad(_get_adata_path(exp_id))
    _save_results(exp_id, "preprocess", pp_result.to_dict())


def _run_pca_step(exp_id: int, job_id: int):
    from app.pipelines.dimensionality_reduction.pca_engine import PCAConfig as PCACfg, run_pca

    config = _get_pipeline_config(exp_id)
    pca_cfg = config.get("pca", {})

    adata = ad.read_h5ad(_get_adata_path(exp_id))
    _update_job(job_id, progress=20)

    pca_config = PCACfg(
        n_components=pca_cfg.get("n_components", 50),
        random_state=pca_cfg.get("random_state", 42),
        solver=pca_cfg.get("solver", "arpack"),
    )

    adata, pca_result = run_pca(adata, pca_config)
    _update_job(job_id, progress=80)

    adata.write_h5ad(_get_adata_path(exp_id))
    _save_results(exp_id, "pca", pca_result.to_dict())


def _run_umap_step(exp_id: int, job_id: int):
    from app.pipelines.dimensionality_reduction.umap_engine import UMAPConfig as UMAPCfg, run_hybrid_umap

    config = _get_pipeline_config(exp_id)
    umap_cfg = config.get("umap", {})
    pca_cfg = config.get("pca", {})

    adata = ad.read_h5ad(_get_adata_path(exp_id))
    _update_job(job_id, progress=10)

    umap_config = UMAPCfg(
        n_neighbors=umap_cfg.get("n_neighbors", 15),
        min_dist=umap_cfg.get("min_dist", 0.1),
        metric=umap_cfg.get("metric", "cosine"),
        n_components=umap_cfg.get("n_components", 2),
        random_state=umap_cfg.get("random_state", 42),
        pca_components=pca_cfg.get("n_components", 50),
    )

    adata, embedding_results = run_hybrid_umap(adata, umap_config)
    _update_job(job_id, progress=80)

    # Save topology scores to experiment
    hybrid_scores = embedding_results.get("hybrid", None)
    if hybrid_scores and hybrid_scores.topology_scores:
        tw = hybrid_scores.topology_scores.get("trustworthiness", None)
        if tw and tw > 0:
            _update_experiment(exp_id, topology_score=tw)

    adata.write_h5ad(_get_adata_path(exp_id))
    results_data = {k: v.to_dict() for k, v in embedding_results.items()}
    _save_results(exp_id, "umap", results_data)


def _run_cluster_step(exp_id: int, job_id: int):
    from app.pipelines.clustering.cluster_engine import ClusterConfig as ClCfg, run_clustering

    config = _get_pipeline_config(exp_id)
    cl_cfg = config.get("clustering", {})

    adata = ad.read_h5ad(_get_adata_path(exp_id))
    _update_job(job_id, progress=20)

    cl_config = ClCfg(
        method=cl_cfg.get("method", "leiden"),
        resolution=cl_cfg.get("resolution", 0.8),
        random_state=cl_cfg.get("random_state", 42),
    )

    adata, cl_result = run_clustering(adata, cl_config)
    _update_job(job_id, progress=80)

    _update_experiment(exp_id, n_clusters=cl_result.n_clusters)

    adata.write_h5ad(_get_adata_path(exp_id))
    _save_results(exp_id, "cluster", cl_result.to_dict())


def _run_de_step(exp_id: int, job_id: int):
    from app.pipelines.differential_expression.de_engine import DEConfig as DECfg, run_differential_expression

    config = _get_pipeline_config(exp_id)
    de_cfg = config.get("de", {})

    adata = ad.read_h5ad(_get_adata_path(exp_id))
    _update_job(job_id, progress=20)

    de_config = DECfg(
        method=de_cfg.get("method", "wilcoxon"),
        min_logfc=de_cfg.get("min_logfc", 0.25),
        min_pct=de_cfg.get("min_pct", 0.1),
        max_pvalue=de_cfg.get("max_pvalue", 0.05),
    )

    cluster_key = "leiden" if "leiden" in adata.obs else "hdbscan"
    adata, de_result = run_differential_expression(adata, de_config, cluster_key)
    _update_job(job_id, progress=80)

    adata.write_h5ad(_get_adata_path(exp_id))
    _save_results(exp_id, "de", de_result.to_dict())


def _run_biomarker_step(exp_id: int, job_id: int):
    from app.pipelines.biomarkers.biomarker_engine import BiomarkerConfig as BMCfg, run_biomarker_discovery
    from app.models.biomarker import Biomarker

    config = _get_pipeline_config(exp_id)
    bm_cfg = config.get("biomarkers", {})

    adata = ad.read_h5ad(_get_adata_path(exp_id))
    _update_job(job_id, progress=10)

    # Load DE results
    de_results_path = Path(settings.results_dir) / str(exp_id) / "de_results.json"
    de_data = json.loads(de_results_path.read_text())
    de_markers = de_data.get("markers", {})

    bm_config = BMCfg(
        top_n=bm_cfg.get("top_n", 50),
        min_adjusted_pvalue=bm_cfg.get("min_adjusted_pvalue", 0.05),
        min_log_fold_change=bm_cfg.get("min_log_fold_change", 0.5),
        min_expression_pct=bm_cfg.get("min_expression_pct", 0.1),
        target_cluster=bm_cfg.get("target_cluster"),
        comparison_cluster=bm_cfg.get("comparison_cluster"),
    )

    cluster_key = "leiden" if "leiden" in adata.obs else "hdbscan"
    bm_result = run_biomarker_discovery(adata, de_markers, bm_config, cluster_key)
    _update_job(job_id, progress=70)

    # Save to database
    session = SyncSession()
    try:
        # Clear old biomarkers for this experiment
        session.query(Biomarker).filter(Biomarker.experiment_id == exp_id).delete()

        for c in bm_result.candidates:
            bm = Biomarker(
                gene_name=c.gene,
                cluster_id=c.cluster_id,
                rank=c.rank,
                biomarker_score=round(c.biomarker_score, 4),
                effect_size=round(c.effect_size, 4),
                log_fold_change=round(c.log_fold_change, 4),
                adjusted_pvalue=c.adjusted_pvalue,
                auc=round(c.auc, 4),
                sensitivity=round(c.sensitivity, 4),
                specificity=round(c.specificity, 4),
                precision_score=round(c.precision, 4),
                recall_score=round(c.recall, 4),
                f1=round(c.f1, 4),
                expression_prevalence=round(c.expression_prevalence, 4),
                cluster_specificity=round(c.cluster_specificity, 4),
                category=c.category,
                experiment_id=exp_id,
            )
            session.add(bm)

        session.commit()
    finally:
        session.close()

    _update_experiment(exp_id, n_biomarkers=len(bm_result.candidates), status="completed")
    _save_results(exp_id, "biomarkers", bm_result.to_dict())

    # Generate manifest
    _generate_manifest(exp_id, config)


def _generate_manifest(exp_id: int, config: dict):
    """Generate the reproducibility manifest."""
    import sys
    import platform

    manifest = {
        "experiment_id": exp_id,
        "software_version": "1.0.0",
        "python_version": sys.version,
        "platform": platform.platform(),
        "pipeline_config": config,
        "execution_timestamp": datetime.now(timezone.utc).isoformat(),
    }

    _update_experiment(exp_id, manifest=json.dumps(manifest))
    _save_results(exp_id, "manifest", manifest)
