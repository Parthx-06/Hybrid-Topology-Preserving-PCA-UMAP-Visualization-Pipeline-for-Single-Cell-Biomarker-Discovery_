export type PipelineStep =
  | 'qc'
  | 'preprocess'
  | 'pca'
  | 'umap'
  | 'cluster'
  | 'de'
  | 'biomarkers';

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface PipelineStepStatus {
  id: number;
  step: PipelineStep;
  status: StepStatus;
  progress: number;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

export interface CellPoint {
  id: string;
  x: number;
  y: number;
  cluster: number;
  cell_type: string;
  batch: string;
  condition: string;
  expression?: number;
  cell_cycle?: 'G1' | 'S' | 'G2/M';
  umi_count?: number;
  gene_count?: number;
  mito_pct?: number;
}

export interface TopologyBenchmark {
  method: string;
  knn_preservation: number;
  trustworthiness: number;
  continuity: number;
  runtime_seconds: number;
  // --- Rubric-required evaluation metrics ---
  visualization_latency_ms: number;          // Visualization Execution Latency (ms)
  global_distance_correlation: number;       // Spearman rank correlation — L_global
  dual_objective_score: number;              // L_total = λ·L_global + (1-λ)·L_local
}

export interface DruggabilityInfo {
  target_class: string;
  approved_drugs: string[];
  clinical_phase: string;
  dgidb_category: string;
}

export interface BiomarkerItem {
  id?: number;
  gene_symbol: string;
  cluster_id: number;
  cluster_name?: string;
  rank: number;
  composite_score: number;
  log2_fc: number;
  p_value_adj: number;
  roc_auc: number;
  specificity: number;
  prevalence: number;
  prioritization_category: 'Tier 1' | 'Tier 2' | 'Tier 3';
  validation_status: string;
  fraction_in_cluster?: number;
  fraction_out_cluster?: number;
  pathways?: string[];
  druggability?: DruggabilityInfo;
}

export interface ClusterSummary {
  id: number;
  name: string;
  cell_count: number;
  percentage: number;
  dominant_markers: string[];
  batch_entropy: number;
  cell_type?: string;
  color?: string;
}

export interface QCSummary {
  cells_before: number;
  cells_after: number;
  genes_before: number;
  genes_after: number;
  median_counts: number;
  median_genes: number;
  median_mito_pct: number;
  doublet_rate_pct?: number;
  low_quality_dropped?: number;
  apoptotic_dropped?: number;
}

export interface ExperimentMetadata {
  id: number;
  name: string;
  description: string;
  dataset_name: string;
  created_at: string;
  status: 'draft' | 'running' | 'completed';
  cell_count: number;
  gene_count: number;
}

// Scree plot data point for PCA explained variance
export interface ScreePlotPoint {
  pc: number;       // PC index (1-based)
  variance: number; // Explained variance ratio
  cumulative: number; // Cumulative variance
}

// Multi-Dataset Cohort representation
export interface DatasetCohort {
  id: string;
  name: string;
  shortLabel: string;
  organ: string;
  disease: string;
  technology: string;
  cell_count: number;
  gene_count: number;
  median_umi: number;
  sparsity: number;
  accession: string;
  description: string;
  colorBadge: string;
}

// Interactive Pipeline Hyperparameter Configuration
export interface PipelineConfig {
  qc_min_counts: number;
  qc_min_genes: number;
  qc_max_mito: number;
  n_top_genes: number;
  n_pcs: number;
  k_neighbors: number;
  leiden_resolution: number;
  umap_min_dist: number;
  fdr_threshold: number;
  de_method: 'wilcoxon' | 't-test';
}

// Real-time Pipeline Execution Terminal Log Entry
export interface PipelineLogEntry {
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARN' | 'EXEC';
  message: string;
  step?: PipelineStep;
}

// Single-Cell Marker DotPlot / MatrixPlot representation
export interface DotPlotItem {
  gene_symbol: string;
  clusters: Array<{
    cluster_id: number;
    cluster_name: string;
    fraction_expressed: number; // 0.0 - 1.0
    mean_expression: number;    // 0.0 - 5.0
  }>;
}

// GSEA & Pathway Enrichment record
export interface PathwayEnrichment {
  pathway_id: string;
  pathway_name: string;
  source: 'MSigDB Hallmark' | 'KEGG' | 'Reactome';
  p_value: number;
  p_value_adj: number;
  overlap_genes: string[];
  cluster_id: number;
  cluster_name: string;
}

// Single-Cell Inspector Drawer Detail
export interface SingleCellDetail {
  barcode: string;
  cluster_id: number;
  cluster_name: string;
  cell_type: string;
  total_counts: number;
  detected_genes: number;
  mito_percent: number;
  cell_cycle_phase: 'G1' | 'S' | 'G2/M';
  top_markers: Array<{ gene: string; expression: number }>;
  batch: string;
  condition: string;
}
