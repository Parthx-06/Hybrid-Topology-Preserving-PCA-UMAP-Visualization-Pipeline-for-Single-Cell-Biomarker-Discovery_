import pytest
from anndata import AnnData
from app.pipelines.qc.qc_pipeline import QCConfig, run_qc
from app.pipelines.preprocessing.normalization import PreprocessingConfig, preprocess_data


def test_qc_pipeline(synthetic_adata: AnnData):
    config = QCConfig(
        min_genes=1,
        min_counts=5,
        max_mito_pct=80.0,
    )
    filtered_adata, metrics = run_qc(synthetic_adata, config)

    assert filtered_adata.n_obs > 0
    assert "pct_counts_mito" in filtered_adata.obs.columns
    assert "n_genes_by_counts" in filtered_adata.obs.columns
    assert metrics.cells_before == 100
    assert metrics.cells_after <= 100


def test_preprocessing_normalization(synthetic_adata: AnnData):
    # Run QC first
    filtered_adata, _ = run_qc(synthetic_adata, QCConfig(min_genes=1))
    
    prep_config = PreprocessingConfig(
        target_sum=1e4,
        log1p=True,
        highly_variable_genes=True,
        n_top_genes=30,
        scale=True,
    )
    processed_adata = preprocess_data(filtered_adata, prep_config)

    assert "highly_variable" in processed_adata.var.columns
    assert processed_adata.var["highly_variable"].sum() <= 30
