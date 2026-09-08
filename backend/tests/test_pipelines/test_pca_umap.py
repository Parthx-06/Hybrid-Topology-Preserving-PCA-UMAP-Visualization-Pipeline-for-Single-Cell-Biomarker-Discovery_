import pytest
from anndata import AnnData
from app.pipelines.dimensionality_reduction.pca_engine import PCAConfig, run_pca
from app.pipelines.dimensionality_reduction.umap_engine import UMAPConfig, run_hybrid_umap
from app.pipelines.preprocessing.normalization import PreprocessingConfig, preprocess_data


def test_pca_engine(synthetic_adata: AnnData):
    prep_data = preprocess_data(synthetic_adata, PreprocessingConfig(highly_variable_genes=False, scale=True))
    config = PCAConfig(n_components=10, random_state=42)
    adata_pca, result = run_pca(prep_data, config)

    assert "X_pca" in adata_pca.obsm
    assert adata_pca.obsm["X_pca"].shape[1] == 10
    assert len(result.explained_variance_ratio) == 10
    assert sum(result.explained_variance_ratio) <= 1.01


def test_umap_hybrid_engine(synthetic_adata: AnnData):
    prep_data = preprocess_data(synthetic_adata, PreprocessingConfig(highly_variable_genes=False, scale=True))
    prep_data, _ = run_pca(prep_data, PCAConfig(n_components=10, random_state=42))

    umap_cfg = UMAPConfig(n_neighbors=5, min_dist=0.1, n_components=2, pca_components=10, random_state=42)
    adata_umap, results = run_hybrid_umap(prep_data, umap_cfg)

    assert "hybrid" in results
    assert len(results["hybrid"].coordinates) == prep_data.n_obs
    assert len(results["hybrid"].coordinates[0]) == 2
    assert "knn_preservation" in results["hybrid"].topology_scores
    assert "trustworthiness" in results["hybrid"].topology_scores
