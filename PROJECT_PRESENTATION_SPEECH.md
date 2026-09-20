# CellMap BioAnalytics — Project Presentation Speech & Architectural Blueprint

> **Presentation Guide**: This document contains a comprehensive, paragraph-by-paragraph spoken presentation script explaining how the CellMap BioAnalytics platform functions end-to-end, which specific files implement each analysis, and the scientific rationale behind each pipeline stage.

---

## 🎙️ Spoken Presentation Script (Paragraph-by-Paragraph)

### **Paragraph 1: The Opening & High-Level Mission**
*"Good morning, respected professors, evaluators, and colleagues. Today, I am proud to present **CellMap BioAnalytics** — an enterprise-grade, topology-preserving single-cell analytical platform engineered for biomarker discovery. In modern genomics, single-cell RNA sequencing produces massive datasets containing tens of thousands of cells across more than twenty thousand gene dimensions. Standard visualization algorithms like naive UMAP or t-SNE often distort global spatial distances, resulting in biological misinterpretations. Our platform introduces a novel **Hybrid PCA-UMAP pipeline** that bridges local cellular neighborhood resolution with true global manifold geometry. The entire architecture is organized as a decoupled, production-ready full-stack system: a high-performance **FastAPI** Python backend coupled with an interactive **React 19 and Vite** frontend, orchestrated through containerized microservices ready for cloud deployment on Render."*

---

### **Paragraph 2: Backend Architecture & Configuration Foundation**
*"To understand how the system executes under the hood, we begin at the core backend foundation located in `backend/app/main.py`. This file serves as the main application entry point, configuring asynchronous lifecycle events, CORS middleware with dynamic regex matching for cloud domains, and mounting REST routers. Centralized configuration is handled in `backend/app/core/config.py` using Pydantic Settings, managing everything from file storage directories to JWT token lifespans. Meanwhile, `backend/app/core/database.py` manages our asynchronous database engine using SQLAlchemy 2.0. It automatically detects whether we are running locally on SQLite or in the cloud on Render PostgreSQL, dynamically normalizing connection strings to `postgresql+asyncpg` so the application connects seamlessly in both development and production environments."*

---

### **Paragraph 3: Stage 1 — Data Ingestion & Quality Control (QC Engine)**
*"Our analytical pipeline begins with raw count matrix ingestion. When an `.h5ad` AnnData or 10x Genomics matrix is uploaded via `backend/app/api/datasets.py`, it triggers our automated Quality Control pipeline implemented in `backend/app/pipelines/quality_control/qc_engine.py`. Here, we assess biological validity by computing library size distributions, total gene counts per cell, and mitochondrial expression ratios. Dying cells or empty droplets exhibiting excessive mitochondrial reads (typically $>15\%$) or abnormally low gene counts ($<500$) are filtered out using adaptive statistical thresholds. On the client side, this analysis is visualized interactively within `frontend/src/pages/QualityControlPage.tsx`, where researchers can adjust violin plot cutoffs and preview cell retention curves in real time."*

---

### **Paragraph 4: Stage 2 — Dimensionality Reduction (PCA Engine)**
*"Once the dataset is normalized and log-transformed using Scanpy, it transitions into linear dimensionality reduction in `backend/app/pipelines/dimensionality_reduction/pca_engine.py`. This engine performs highly optimized Principal Component Analysis using ARPACK singular value decomposition. Rather than guessing the number of components, our engine computes cumulative variance explained and evaluates an automated elbow-point heuristic to isolate the top informative biological axes (typically 30 to 50 principal components), filtering out high-dimensional technical noise. The resulting variance spectra and scree plots provide researchers with mathematical confidence regarding how much total variance is captured before non-linear projection."*

---

### **Paragraph 5: Stage 3 — The Novel Hybrid Topology UMAP Engine**
*"The core scientific breakthrough of our project lies in `backend/app/pipelines/dimensionality_reduction/umap_engine.py`. Traditional UMAP creates local fuzzy simplicial sets that can fracture large-scale lineage trajectories. To overcome this, we implemented a **Dual-Objective Optimization Framework**:*

$$\mathcal{L}_{\text{total}} = \lambda \cdot \mathcal{L}_{\text{global}} + (1 - \lambda) \cdot \mathcal{L}_{\text{local}}$$

*By tuning the balancing weight $\lambda$, our pipeline preserves both fine-grained nearest-neighbor clusters and macro-level inter-cluster Euclidean trajectories. Inside `umap_engine.py`, we rigorously evaluate this through a quantitative metric suite:*
1. ***Trustworthiness* and *Continuity* via Scikit-Learn to evaluate neighborhood preservation.**
2. ***Global Distance Correlation (Spearman rank)* across pairwise distances to measure global manifold fidelity.**
3. ***Execution Latency tracking in milliseconds*.**
*This multi-metric benchmark allows researchers to empirically verify that our hybrid embedding outperforms standard t-SNE and raw UMAP."*

---

### **Paragraph 6: Stage 4 — Clustering & Cellular Phenotyping**
*"With high-fidelity low-dimensional coordinates established, the pipeline advances to unsupervised cell clustering in `backend/app/pipelines/clustering/clustering_engine.py`. We build a shared nearest-neighbor (SNN) graph and apply the **Leiden and Louvain graph community detection algorithms** to segment cells into distinct phenotypes without imposing arbitrary cluster shapes. These clusters are rendered in `frontend/src/pages/ClusterExplorerPage.tsx` and `frontend/src/pages/EmbeddingExplorerPage.tsx`. Researchers can interactively inspect cells via `frontend/src/components/CellInspectorDrawer.tsx`, view gene co-expression overlays using `frontend/src/charts/DualGeneCoexpression.tsx`, and compare multi-cluster distributions on dot plots via `frontend/src/charts/MarkerDotPlot.tsx`."*

---

### **Paragraph 7: Stage 5 — Differential Expression & Biomarker Discovery**
*"The definitive translational outcome of this pipeline is finding disease-specific genetic targets, handled in `backend/app/pipelines/differential_expression/de_engine.py`. This module executes statistical hypothesis testing (Wilcoxon rank-sum and Welch's t-test) comparing each cluster against the background population, adjusting p-values with Benjamini-Hochberg False Discovery Rate (FDR) control. The resulting statistics — $\log_2(\text{Fold Change})$ and $-\log_{10}(\text{Adjusted } p\text{-value})$ — power our interactive Volcano Plot in `frontend/src/charts/VolcanoPlot.tsx`. In `frontend/src/pages/BiomarkerDiscoveryPage.tsx`, candidate biomarkers are ranked by biological specificity, complemented by pathway enrichment cards in `frontend/src/components/PathwayEnrichmentCard.tsx` linking identified genes directly to Reactome and GO molecular pathways."*

---

### **Paragraph 8: Asynchronous Task Management & Scalability**
*"Because processing single-cell matrices with millions of data points is computationally demanding, long-running analyses must never block HTTP API threads. In `backend/app/workers/celery_app.py` and `backend/app/workers/tasks.py`, we integrate Celery for distributed background task execution. An intelligent feature we implemented in `celery_app.py` is **auto-detecting broker connectivity**: if a distributed Redis instance is present, tasks queue asynchronously across worker pools; if running in a lightweight environment or cloud free-tier, Celery automatically falls back to eager in-process execution, guaranteeing that the pipeline never crashes due to missing queue infrastructure."*

---

### **Paragraph 9: Clinical Governance, Provenance & Cloud Deployment**
*"In biomedical software, scientific reproducibility is non-negotiable. Our application includes a dedicated Governance & Provenance module in `frontend/src/pages/ProvenanceReportPage.tsx` and `backend/app/api/reports.py`. Every executed pipeline run generates an immutable audit ledger complete with cryptographic SHA-256 parameter manifests, algorithm random seeds, and software container versions compliant with FDA 21 CFR Part 11 validation guidelines. Furthermore, for deployment, we configured `render.yaml`, updated `docker/Dockerfile.backend` for dynamic port binding, and provided SPA fallback rules in `_redirects` so the entire platform can be deployed to Render with a single click."*

---

### **Paragraph 10: The Closing Summary**
*"In summary, **CellMap BioAnalytics** represents a complete end-to-end synergy of rigorous algorithmic data science and modern software engineering. It takes raw high-dimensional genomic reads, cleans them through statistical QC, retains global and local geometry through our novel hybrid UMAP engine, uncovers distinct cell types via community detection, isolates high-confidence biomarker genes with statistical significance, and seals the pipeline with cryptographically reproducible provenance. Thank you very much for your time, and I am now ready to answer questions or demonstrate the live platform."*

---

## 📊 Comprehensive Architecture & File Mapping Matrix

| Stage | Pipeline Analysis Performed | Primary Backend Code | Primary Frontend Code |
| :--- | :--- | :--- | :--- |
| **Ingestion & DB** | `.h5ad` AnnData upload, metadata validation, user sessions | `backend/app/api/datasets.py`<br>`backend/app/core/database.py` | `frontend/src/pages/OverviewPage.tsx`<br>`frontend/src/services/api.ts` |
| **Quality Control** | Cell library size, total genes, mitochondrial % thresholds | `backend/app/pipelines/quality_control/qc_engine.py` | `frontend/src/pages/QualityControlPage.tsx` |
| **Linear Dim. Red.** | SVD, cumulative variance spectra, elbow-point selection | `backend/app/pipelines/dimensionality_reduction/pca_engine.py` | `frontend/src/pages/EmbeddingExplorerPage.tsx` |
| **Non-Linear Dim. Red.** | Hybrid UMAP, Dual-Objective loss ($\lambda$), Trustworthiness, Spearman correlation | `backend/app/pipelines/dimensionality_reduction/umap_engine.py` | `frontend/src/charts/EmbeddingScatter.tsx` |
| **Clustering** | Shared Nearest Neighbor (SNN), Leiden & Louvain community detection | `backend/app/pipelines/clustering/clustering_engine.py` | `frontend/src/pages/ClusterExplorerPage.tsx`<br>`frontend/src/charts/MarkerDotPlot.tsx` |
| **Biomarker Discovery** | Wilcoxon rank-sum, Benjamini-Hochberg FDR, volcano scatter | `backend/app/pipelines/differential_expression/de_engine.py` | `frontend/src/pages/BiomarkerDiscoveryPage.tsx`<br>`frontend/src/charts/VolcanoPlot.tsx` |
| **Asynchronous Engine** | Celery worker queue, redis connection with auto-eager fallback | `backend/app/workers/celery_app.py`<br>`backend/app/workers/tasks.py` | `frontend/src/components/PipelineRunnerModal.tsx` |
| **Clinical Provenance** | Cryptographic SHA-256 manifest, FDA 21 CFR Part 11 audit, HTML export | `backend/app/api/reports.py` | `frontend/src/pages/ProvenanceReportPage.tsx` |
| **Cloud Deployment** | Render Blueprint, Docker dynamic port binding, SPA rewrites | `render.yaml`<br>`docker/Dockerfile.backend` | `frontend/public/_redirects`<br>`RENDER_DEPLOYMENT.md` |
