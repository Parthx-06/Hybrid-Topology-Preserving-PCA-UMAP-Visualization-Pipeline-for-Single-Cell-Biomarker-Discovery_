# =============================================================================
# Analysis Job Model
# =============================================================================
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AnalysisJob(Base):
    __tablename__ = "analysis_jobs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_id: Mapped[str] = mapped_column(String(256), nullable=True)  # Celery task ID
    step: Mapped[str] = mapped_column(String(64), nullable=False)  # qc|preprocess|pca|umap|cluster|de|biomarkers
    status: Mapped[str] = mapped_column(String(32), default="pending")  # pending|running|completed|failed|cancelled
    progress: Mapped[float] = mapped_column(Float, default=0.0)  # 0-100

    # Error info
    error_message: Mapped[str] = mapped_column(Text, nullable=True)

    # Timing
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    runtime_seconds: Mapped[float] = mapped_column(Float, nullable=True)

    # Foreign key
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id"), nullable=False)
    experiment = relationship("Experiment", back_populates="jobs")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<AnalysisJob id={self.id} step={self.step} status={self.status}>"
