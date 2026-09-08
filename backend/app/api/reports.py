# =============================================================================
# Report API Router
# =============================================================================
from __future__ import annotations

import json
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import HTMLResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.biomarker import Biomarker
from app.models.dataset import Dataset
from app.models.experiment import Experiment
from app.models.user import User
from app.services.report_service import generate_html_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{experiment_id}/html", response_class=HTMLResponse)
async def get_html_report(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and return an HTML bioinformatics report for an experiment."""
    # Fetch experiment
    result = await db.execute(
        select(Experiment).where(
            Experiment.id == experiment_id, Experiment.owner_id == current_user.id
        )
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")

    # Fetch dataset
    ds_result = await db.execute(
        select(Dataset).where(Dataset.id == exp.dataset_id)
    )
    dataset = ds_result.scalar_one_or_none()

    # Read step results if available
    results_dir = settings.results_path / str(exp.id)

    def load_json(name: str):
        p = results_dir / f"{name}_results.json"
        if p.exists():
            try:
                return json.loads(p.read_text())
            except Exception:
                return None
        return None

    qc_res = load_json("qc")
    pca_res = load_json("pca")
    umap_res = load_json("umap")
    cluster_res = load_json("cluster")

    # Fetch biomarkers from DB
    bio_result = await db.execute(
        select(Biomarker)
        .where(Biomarker.experiment_id == exp.id)
        .order_by(Biomarker.rank)
        .limit(50)
    )
    markers = bio_result.scalars().all()
    marker_dicts = [
        {
            "gene_symbol": m.gene_symbol,
            "cluster_id": m.cluster_id,
            "rank": m.rank,
            "composite_score": m.composite_score,
            "log2_fc": m.log2_fc,
            "p_value_adj": m.p_value_adj,
            "roc_auc": m.roc_auc,
            "specificity": m.specificity,
            "prioritization_category": m.prioritization_category,
        }
        for m in markers
    ]

    manifest = json.loads(exp.manifest) if exp.manifest else None

    html = generate_html_report(
        experiment=exp,
        dataset=dataset,
        qc_results=qc_res,
        pca_results=pca_res,
        umap_results=umap_res,
        cluster_results=cluster_res,
        biomarkers=marker_dicts,
        manifest=manifest,
    )

    return HTMLResponse(content=html)
