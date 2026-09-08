# =============================================================================
# Biomarker Model
# =============================================================================
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Biomarker(Base):
    __tablename__ = "biomarkers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    gene_name: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    cluster_id: Mapped[int] = mapped_column(Integer, nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)

    # Scores breakdown
    biomarker_score: Mapped[float] = mapped_column(Float, nullable=False)
    effect_size: Mapped[float] = mapped_column(Float, nullable=True)
    log_fold_change: Mapped[float] = mapped_column(Float, nullable=True)
    adjusted_pvalue: Mapped[float] = mapped_column(Float, nullable=True)
    auc: Mapped[float] = mapped_column(Float, nullable=True)
    sensitivity: Mapped[float] = mapped_column(Float, nullable=True)
    specificity: Mapped[float] = mapped_column(Float, nullable=True)
    precision_score: Mapped[float] = mapped_column(Float, nullable=True)
    recall_score: Mapped[float] = mapped_column(Float, nullable=True)
    f1: Mapped[float] = mapped_column(Float, nullable=True)
    expression_prevalence: Mapped[float] = mapped_column(Float, nullable=True)
    cluster_specificity: Mapped[float] = mapped_column(Float, nullable=True)

    # Categories
    category: Mapped[str] = mapped_column(String(128), nullable=True)

    # Foreign key
    experiment_id: Mapped[int] = mapped_column(ForeignKey("experiments.id"), nullable=False)
    experiment = relationship("Experiment", back_populates="biomarkers")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<Biomarker gene={self.gene_name} cluster={self.cluster_id} score={self.biomarker_score:.3f}>"
