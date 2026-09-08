# =============================================================================
# Experiment Model
# =============================================================================
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="created")  # created|running|completed|failed

    # Pipeline configuration (stored as JSON string)
    pipeline_config: Mapped[str] = mapped_column(Text, nullable=True)

    # Result summary
    n_clusters: Mapped[int] = mapped_column(Integer, nullable=True)
    n_biomarkers: Mapped[int] = mapped_column(Integer, nullable=True)
    topology_score: Mapped[float] = mapped_column(Float, nullable=True)

    # Results file paths (JSON)
    results_paths: Mapped[str] = mapped_column(Text, nullable=True)

    # Analysis manifest (JSON)
    manifest: Mapped[str] = mapped_column(Text, nullable=True)

    # Foreign keys
    dataset_id: Mapped[int] = mapped_column(ForeignKey("datasets.id"), nullable=False)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    # Relationships
    dataset = relationship("Dataset", back_populates="experiments")
    owner = relationship("User", back_populates="experiments")
    jobs = relationship("AnalysisJob", back_populates="experiment", lazy="selectin")
    biomarkers = relationship("Biomarker", back_populates="experiment", lazy="selectin")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<Experiment id={self.id} name={self.name} status={self.status}>"
