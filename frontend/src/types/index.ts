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
}

export interface TopologyBenchmark {
  method: string;
  knn_preservation: number;
  trustworthiness: number;
  continuity: number;
  runtime_seconds: number;
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
}

export interface ClusterSummary {
  id: number;
  name: string;
  cell_count: number;
  percentage: number;
  dominant_markers: string[];
  batch_entropy: number;
}

export interface QCSummary {
  cells_before: number;
  cells_after: number;
  genes_before: number;
  genes_after: number;
  median_counts: number;
  median_genes: number;
  median_mito_pct: number;
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
