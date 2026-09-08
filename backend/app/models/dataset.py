# =============================================================================
# Dataset Model
# =============================================================================
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_format: Mapped[str] = mapped_column(String(32), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    checksum: Mapped[str] = mapped_column(String(128), nullable=True)

    # Dataset statistics
    n_cells: Mapped[int] = mapped_column(Integer, nullable=True)
    n_genes: Mapped[int] = mapped_column(Integer, nullable=True)
    sparsity: Mapped[float] = mapped_column(Float, nullable=True)
    metadata_columns: Mapped[str] = mapped_column(Text, nullable=True)  # JSON list
    has_missing_values: Mapped[bool] = mapped_column(default=False)
    has_duplicate_genes: Mapped[bool] = mapped_column(default=False)

    # Ownership
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    owner = relationship("User", back_populates="datasets")

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    experiments = relationship("Experiment", back_populates="dataset", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Dataset id={self.id} name={self.name} cells={self.n_cells} genes={self.n_genes}>"
