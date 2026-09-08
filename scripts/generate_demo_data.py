# =============================================================================
# Synthetic scRNA-seq Demo Dataset Generator
# =============================================================================
"""
Generates a reproducible synthetic single-cell RNA-seq dataset simulating
5 cell populations: T cells, B cells, Monocytes, NK cells, Dendritic cells.

Each population has distinct marker genes and metadata.

Usage:
    python scripts/generate_demo_data.py
"""
import sys
from pathlib import Path

import anndata as ad
import numpy as np
import pandas as pd
import scipy.sparse as sp

SEED = 42
np.random.seed(SEED)

# ---- Configuration ----
CELL_TYPES = {
    "T_cell": {"n_cells": 1500, "markers": ["CD3D", "CD3E", "CD3G", "CD4", "CD8A", "CD8B", "TRAC", "IL7R", "LEF1", "TCF7"]},
    "B_cell": {"n_cells": 1000, "markers": ["CD19", "MS4A1", "CD79A", "CD79B", "PAX5", "BANK1", "BLK", "CD22", "IGHM", "IGHD"]},
    "Monocyte": {"n_cells": 800, "markers": ["CD14", "LYZ", "S100A8", "S100A9", "VCAN", "FCN1", "CD68", "CSF1R", "ITGAM", "FCGR3A"]},
    "NK_cell": {"n_cells": 600, "markers": ["NKG7", "GNLY", "KLRD1", "KLRB1", "NCAM1", "GZMB", "PRF1", "FCGR3A", "KLRK1", "CD160"]},
    "Dendritic_cell": {"n_cells": 400, "markers": ["FCER1A", "CLEC10A", "CD1C", "ITGAX", "HLA-DRA", "HLA-DQA1", "BATF3", "IRF8", "LILRA4", "IL3RA"]},
}

N_BACKGROUND_GENES = 2000
N_BATCHES = 3
CONDITIONS = ["healthy", "disease"]


def generate_demo_data(output_path: str = "data/demo_dataset.h5ad"):
    """Generate the synthetic scRNA-seq dataset."""
    print("=" * 60)
    print("CellMap BioAnalytics — Demo Dataset Generator")
    print("=" * 60)

    # Collect all marker gene names
    all_markers = set()
    for info in CELL_TYPES.values():
        all_markers.update(info["markers"])
    all_markers = sorted(all_markers)

    # Background genes
    bg_genes = [f"GENE_{i:04d}" for i in range(N_BACKGROUND_GENES)]
    all_genes = all_markers + bg_genes
    n_genes = len(all_genes)
    gene_to_idx = {g: i for i, g in enumerate(all_genes)}

    # Total cells
    total_cells = sum(info["n_cells"] for info in CELL_TYPES.values())
    print(f"\nTotal cells: {total_cells}")
    print(f"Total genes: {n_genes}")
    print(f"Cell types: {list(CELL_TYPES.keys())}")

    # Initialize sparse expression matrix
    rows, cols, vals = [], [], []
    cell_types = []
    cell_names = []
    cell_idx = 0

    for ct_name, ct_info in CELL_TYPES.items():
        n = ct_info["n_cells"]
        print(f"  Generating {n} {ct_name} cells...")

        for _ in range(n):
            cell_names.append(f"cell_{cell_idx:05d}")
            cell_types.append(ct_name)

            # Background expression: sparse, low-level
            n_expressed_bg = np.random.binomial(len(bg_genes), 0.08)
            bg_indices = np.random.choice(len(bg_genes), n_expressed_bg, replace=False)
            for bi in bg_indices:
                gene_idx = gene_to_idx[bg_genes[bi]]
                count = np.random.negative_binomial(2, 0.3)
                if count > 0:
                    rows.append(cell_idx)
                    cols.append(gene_idx)
                    vals.append(count)

            # Marker gene expression: higher for own markers
            for marker in all_markers:
                gene_idx = gene_to_idx[marker]
                if marker in ct_info["markers"]:
                    # High expression for own markers
                    count = np.random.negative_binomial(10, 0.15)
                    if count > 0:
                        rows.append(cell_idx)
                        cols.append(gene_idx)
                        vals.append(count)
                else:
                    # Low/no expression for other markers
                    if np.random.random() < 0.05:
                        count = np.random.negative_binomial(1, 0.5)
                        if count > 0:
                            rows.append(cell_idx)
                            cols.append(gene_idx)
                            vals.append(count)

            # Add some mitochondrial genes
            for mt_gene in ["MT-CO1", "MT-CO2", "MT-ND1", "MT-ND2", "MT-ATP6"]:
                if mt_gene not in gene_to_idx:
                    continue
                count = np.random.negative_binomial(3, 0.3)
                if count > 0:
                    rows.append(cell_idx)
                    cols.append(gene_to_idx[mt_gene])
                    vals.append(count)

            cell_idx += 1

    # Add mitochondrial genes to gene list
    mt_genes = ["MT-CO1", "MT-CO2", "MT-ND1", "MT-ND2", "MT-ATP6"]
    for mg in mt_genes:
        if mg not in gene_to_idx:
            gene_to_idx[mg] = len(all_genes)
            all_genes.append(mg)
    n_genes = len(all_genes)

    # Re-generate MT expression now that genes are in the list
    # (already handled above for genes in the list)

    # Build sparse matrix
    X = sp.csr_matrix(
        (vals, (rows, cols)),
        shape=(total_cells, n_genes),
        dtype=np.float32,
    )

    print(f"\nMatrix shape: {X.shape}")
    print(f"Sparsity: {1.0 - X.nnz / (X.shape[0] * X.shape[1]):.2%}")

    # Metadata
    batches = np.random.choice([f"batch_{i}" for i in range(N_BATCHES)], total_cells)
    conditions = np.random.choice(CONDITIONS, total_cells, p=[0.6, 0.4])
    donors = np.random.choice([f"donor_{i}" for i in range(6)], total_cells)

    obs = pd.DataFrame(
        {
            "cell_type": cell_types,
            "batch": batches,
            "condition": conditions,
            "donor": donors,
            "n_counts": np.array(X.sum(axis=1)).flatten().astype(int),
        },
        index=cell_names,
    )

    var = pd.DataFrame(index=all_genes)
    var["is_marker"] = [g in all_markers for g in all_genes]
    var["is_mitochondrial"] = [g.startswith("MT-") for g in all_genes]

    # Create AnnData
    adata = ad.AnnData(X=X, obs=obs, var=var)

    # Save
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)
    adata.write_h5ad(output)

    print(f"\nDataset saved to: {output}")
    print(f"Cell type distribution:")
    for ct, count in obs["cell_type"].value_counts().items():
        print(f"  {ct}: {count}")

    print(f"\nBatch distribution:")
    for b, count in obs["batch"].value_counts().items():
        print(f"  {b}: {count}")

    print(f"\nCondition distribution:")
    for c, count in obs["condition"].value_counts().items():
        print(f"  {c}: {count}")

    print("\n[SUCCESS] Demo dataset generated successfully!")
    return adata


if __name__ == "__main__":
    output = sys.argv[1] if len(sys.argv) > 1 else "data/demo_dataset.h5ad"
    generate_demo_data(output)
