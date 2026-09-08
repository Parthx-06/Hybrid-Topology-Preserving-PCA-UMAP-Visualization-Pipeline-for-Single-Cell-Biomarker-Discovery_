# =============================================================================
# Pytest Fixtures for CellMap BioAnalytics
# =============================================================================
import pytest
import numpy as np
import pandas as pd
import scipy.sparse as sp
from anndata import AnnData


@pytest.fixture
def synthetic_adata():
    """Create a minimal AnnData object for unit testing pipelines."""
    np.random.seed(42)
    n_obs = 100
    n_vars = 50

    # Counts matrix with Poisson noise and distinct cell types
    X = np.random.poisson(lam=2.0, size=(n_obs, n_vars)).astype(np.float32)
    # Give first 50 cells high expression in genes 0..5 (Cluster 0)
    X[:50, :5] += np.random.poisson(lam=15.0, size=(50, 5))
    # Give last 50 cells high expression in genes 5..10 (Cluster 1)
    X[50:, 5:10] += np.random.poisson(lam=15.0, size=(50, 5))

    obs = pd.DataFrame(
        {
            "cell_id": [f"CELL_{i:04d}" for i in range(n_obs)],
            "batch": ["batch1"] * 50 + ["batch2"] * 50,
            "true_type": ["TypeA"] * 50 + ["TypeB"] * 50,
        },
        index=[f"CELL_{i:04d}" for i in range(n_obs)],
    )

    gene_names = [f"GENE_{i:03d}" for i in range(n_vars)]
    gene_names[0] = "CD3D"
    gene_names[1] = "CD4"
    gene_names[5] = "CD19"
    gene_names[6] = "MS4A1"
    gene_names[10] = "MT-CO1"  # Mito gene
    gene_names[11] = "MT-ND1"  # Mito gene
    gene_names[12] = "RPS3"    # Ribosomal gene

    var = pd.DataFrame(
        {"gene_symbol": gene_names},
        index=gene_names,
    )

    adata = AnnData(X=sp.csr_matrix(X), obs=obs, var=var)
    return adata
