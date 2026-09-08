import pytest
from anndata import AnnData
from app.pipelines.preprocessing.normalization import PreprocessingConfig, preprocess_data
from app.pipelines.dimensionality_reduction.pca_engine import PCAConfig, run_pca
from app.pipelines.dimensionality_reduction.umap_engine import UMAPConfig, run_hybrid_umap
from app.pipelines.clustering.cluster_engine import ClusterConfig, run_clustering
from app.pipelines.differential_expression.de_engine import DEConfig, run_differential_expression
from app.pipelines.biomarkers.biomarker_engine import BiomarkerConfig, discover_biomarkers


def test_clustering_de_biomarker_pipeline(synthetic_adata: AnnData):
    # Preprocess + PCA + UMAP
    prep = preprocess_data(synthetic_adata, PreprocessingConfig(highly_variable_genes=False, scale=True))
    prep, _ = run_pca(prep, PCAConfig(n_components=10))
    prep, _ = run_hybrid_umap(prep, UMAPConfig(n_neighbors=5, pca_components=10))

    # Clustering
    cl_cfg = ClusterConfig(resolution=0.5, method="leiden")
    prep, cl_res = run_clustering(prep, cl_cfg)

    assert "leiden" in prep.obs.columns
    assert len(cl_res.clusters) > 0

    # Differential Expression
    de_cfg = DEConfig(method="wilcoxon", min_cells=2)
    de_results = run_differential_expression(prep, de_cfg)

    assert len(de_results) > 0
    first_cl = list(de_results.keys())[0]
    assert len(de_results[first_cl].results) > 0

    # Biomarker Discovery
    bio_cfg = BiomarkerConfig(min_auc=0.5, top_n_per_cluster=5)
    bio_results = discover_biomarkers(prep, de_results, bio_cfg)

    assert len(bio_results) > 0
    for cand in bio_results:
        assert cand.roc_auc >= 0.0
        assert 0.0 <= cand.composite_score <= 1.0
