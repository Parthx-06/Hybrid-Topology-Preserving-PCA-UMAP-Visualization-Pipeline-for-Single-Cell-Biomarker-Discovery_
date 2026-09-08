# =============================================================================
# Experiment API Router
# =============================================================================
from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.dataset import Dataset
from app.models.experiment import Experiment
from app.models.job import AnalysisJob
from app.models.biomarker import Biomarker
from app.models.user import User
from app.schemas.experiment import (
    BiomarkerListResponse,
    BiomarkerResponse,
    ExperimentCreateRequest,
    ExperimentListResponse,
    ExperimentResponse,
    JobResponse,
    PipelineStatusResponse,
)

router = APIRouter(prefix="/experiments", tags=["Experiments"])


@router.post("", response_model=ExperimentResponse, status_code=201)
async def create_experiment(
    body: ExperimentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new experiment for a dataset."""
    # Verify dataset
    result = await db.execute(
        select(Dataset).where(Dataset.id == body.dataset_id, Dataset.owner_id == current_user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Dataset not found")

    exp = Experiment(
        name=body.name,
        description=body.description,
        dataset_id=body.dataset_id,
        owner_id=current_user.id,
        pipeline_config=body.pipeline_config.model_dump_json(),
    )
    db.add(exp)
    await db.flush()
    await db.refresh(exp)
    return exp


@router.get("", response_model=ExperimentListResponse)
async def list_experiments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all experiments."""
    result = await db.execute(
        select(Experiment)
        .where(Experiment.owner_id == current_user.id)
        .order_by(Experiment.created_at.desc())
    )
    exps = result.scalars().all()
    return ExperimentListResponse(experiments=exps, total=len(exps))


@router.get("/{experiment_id}", response_model=ExperimentResponse)
async def get_experiment(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get experiment details."""
    exp = await _get_experiment(experiment_id, current_user.id, db)
    return exp


@router.post("/{experiment_id}/run/{step}")
async def run_pipeline_step(
    experiment_id: int,
    step: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run a specific pipeline step (qc, preprocess, pca, umap, cluster, de, biomarkers, full)."""
    valid_steps = {"qc", "preprocess", "pca", "umap", "cluster", "de", "biomarkers", "full"}
    if step not in valid_steps:
        raise HTTPException(status_code=400, detail=f"Invalid step. Choose from: {valid_steps}")

    exp = await _get_experiment(experiment_id, current_user.id, db)

    # Create job record
    if step == "full":
        steps_to_run = ["qc", "preprocess", "pca", "umap", "cluster", "de", "biomarkers"]
    else:
        steps_to_run = [step]

    jobs = []
    for s in steps_to_run:
        job = AnalysisJob(experiment_id=exp.id, step=s, status="pending")
        db.add(job)
        jobs.append(job)

    await db.flush()
    for j in jobs:
        await db.refresh(j)

    # Dispatch to Celery
    from app.workers.tasks import run_analysis_step
    for j in jobs:
        task = run_analysis_step.delay(j.id, exp.id, j.step)
        j.task_id = task.id
    await db.flush()

    exp.status = "running"
    await db.flush()

    return {
        "message": f"Pipeline step(s) dispatched",
        "jobs": [{"id": j.id, "step": j.step, "task_id": j.task_id} for j in jobs],
    }


@router.get("/{experiment_id}/status", response_model=PipelineStatusResponse)
async def get_pipeline_status(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get pipeline execution status."""
    exp = await _get_experiment(experiment_id, current_user.id, db)
    result = await db.execute(
        select(AnalysisJob)
        .where(AnalysisJob.experiment_id == exp.id)
        .order_by(AnalysisJob.created_at)
    )
    jobs = result.scalars().all()

    return PipelineStatusResponse(
        experiment_id=exp.id,
        experiment_name=exp.name,
        overall_status=exp.status,
        steps=[JobResponse.model_validate(j) for j in jobs],
    )


@router.get("/{experiment_id}/results/{step}")
async def get_step_results(
    experiment_id: int,
    step: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get results for a specific pipeline step."""
    exp = await _get_experiment(experiment_id, current_user.id, db)

    results_dir = settings.results_path / str(exp.id)
    results_file = results_dir / f"{step}_results.json"

    try:
        import aiofiles
        async with aiofiles.open(results_file, "r") as f:
            content = await f.read()
        return json.loads(content)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Results for step '{step}' not available yet")


@router.get("/{experiment_id}/biomarkers", response_model=BiomarkerListResponse)
async def get_biomarkers(
    experiment_id: int,
    cluster_id: int | None = None,
    top_n: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get ranked biomarkers for an experiment."""
    exp = await _get_experiment(experiment_id, current_user.id, db)

    query = select(Biomarker).where(Biomarker.experiment_id == exp.id)
    if cluster_id is not None:
        query = query.where(Biomarker.cluster_id == cluster_id)
    query = query.order_by(Biomarker.rank).limit(top_n)

    result = await db.execute(query)
    markers = result.scalars().all()

    return BiomarkerListResponse(
        biomarkers=[BiomarkerResponse.model_validate(m) for m in markers],
        total=len(markers),
    )


@router.get("/{experiment_id}/manifest")
async def get_manifest(
    experiment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the reproducibility manifest."""
    exp = await _get_experiment(experiment_id, current_user.id, db)
    if not exp.manifest:
        raise HTTPException(status_code=404, detail="Manifest not yet generated")
    return json.loads(exp.manifest)


# ---- Helpers ----
async def _get_experiment(
    experiment_id: int, owner_id: int, db: AsyncSession
) -> Experiment:
    result = await db.execute(
        select(Experiment).where(Experiment.id == experiment_id, Experiment.owner_id == owner_id)
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp
