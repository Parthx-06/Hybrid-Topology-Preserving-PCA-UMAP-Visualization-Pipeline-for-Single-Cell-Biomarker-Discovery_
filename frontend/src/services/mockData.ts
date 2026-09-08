import {
  BiomarkerItem,
  CellPoint,
  ClusterSummary,
  ExperimentMetadata,
  PipelineStepStatus,
  QCSummary,
  TopologyBenchmark,
} from '../types';

export const INITIAL_EXPERIMENT: ExperimentMetadata = {
  id: 1,
  name: 'PBMC Immune Profiling & Biomarker Discovery',
  description: 'Single-cell transcriptome profiling of 4,300 peripheral blood mononuclear cells with hybrid topology preservation.',
  dataset_name: 'PBMC_5Populations_v1.h5ad',
  created_at: '2026-09-08 14:30:00 UTC',
  status: 'completed',
  cell_count: 4300,
  gene_count: 2050,
};

export const INITIAL_PIPELINE_STEPS: PipelineStepStatus[] = [
  { id: 1, step: 'qc', status: 'completed', progress: 100, completed_at: '14:31:10' },
  { id: 2, step: 'preprocess', status: 'completed', progress: 100, completed_at: '14:32:04' },
  { id: 3, step: 'pca', status: 'completed', progress: 100, completed_at: '14:32:45' },
  { id: 4, step: 'umap', status: 'completed', progress: 100, completed_at: '14:34:12' },
  { id: 5, step: 'cluster', status: 'completed', progress: 100, completed_at: '14:34:55' },
  { id: 6, step: 'de', status: 'completed', progress: 100, completed_at: '14:36:20' },
  { id: 7, step: 'biomarkers', status: 'completed', progress: 100, completed_at: '14:37:05' },
];

export const TOPOLOGY_BENCHMARKS: Record<string, TopologyBenchmark> = {
  hybrid: {
    method: 'Hybrid PCA → UMAP (CellMap)',
    knn_preservation: 0.884,
    trustworthiness: 0.942,
    continuity: 0.961,
    runtime_seconds: 4.82,
  },
  direct: {
    method: 'Direct UMAP (Raw HVG)',
    knn_preservation: 0.695,
    trustworthiness: 0.867,
    continuity: 0.812,
    runtime_seconds: 14.35,
  },
  pca: {
    method: 'Principal Component Analysis (PC1 vs PC2)',
    knn_preservation: 0.612,
    trustworthiness: 0.915,
    continuity: 0.894,
    runtime_seconds: 0.64,
  },
};

export const CLUSTERS_DATA: ClusterSummary[] = [
  { id: 0, name: 'T Cells (CD4+/CD8+)', cell_count: 1500, percentage: 34.9, dominant_markers: ['CD3D', 'CD3E', 'CD4', 'CD8A'], batch_entropy: 0.89 },
  { id: 1, name: 'B Cells', cell_count: 1000, percentage: 23.3, dominant_markers: ['CD19', 'MS4A1', 'CD79A', 'BANK1'], batch_entropy: 0.85 },
  { id: 2, name: 'CD14+ Monocytes', cell_count: 800, percentage: 18.6, dominant_markers: ['CD14', 'LYZ', 'S100A8', 'VCAN'], batch_entropy: 0.91 },
  { id: 3, name: 'Natural Killer (NK) Cells', cell_count: 600, percentage: 13.9, dominant_markers: ['NKG7', 'GNLY', 'KLRD1', 'GZMB'], batch_entropy: 0.84 },
  { id: 4, name: 'Dendritic Cells (mDC/pDC)', cell_count: 400, percentage: 9.3, dominant_markers: ['FCER1A', 'CLEC10A', 'HLA-DRA', 'CD1C'], batch_entropy: 0.88 },
];

export const QC_METRICS: QCSummary = {
  cells_before: 4620,
  cells_after: 4300,
  genes_before: 2200,
  genes_after: 2050,
  median_counts: 3840,
  median_genes: 1240,
  median_mito_pct: 3.4,
};

// Generate realistic 2D points for all 3 embeddings
function generateCells(): {
  hybrid: CellPoint[];
  direct: CellPoint[];
  pca: CellPoint[];
} {
  const hybrid: CellPoint[] = [];
  const direct: CellPoint[] = [];
  const pca: CellPoint[] = [];

  const clusterCentersHybrid = [
    { x: -3.5, y: 1.2, name: 'T Cells', id: 0 },
    { x: 4.8, y: -2.1, name: 'B Cells', id: 1 },
    { x: 1.2, y: 5.4, name: 'CD14+ Monocytes', id: 2 },
    { x: -4.2, y: -3.8, name: 'NK Cells', id: 3 },
    { x: 2.5, y: 3.1, name: 'Dendritic Cells', id: 4 },
  ];

  const clusterCentersDirect = [
    { x: -5.1, y: 3.8, name: 'T Cells', id: 0 },
    { x: 6.2, y: -4.5, name: 'B Cells', id: 1 },
    { x: -1.0, y: -6.2, name: 'CD14+ Monocytes', id: 2 },
    { x: 2.1, y: 5.9, name: 'NK Cells', id: 3 },
    { x: 0.8, y: -1.2, name: 'Dendritic Cells', id: 4 },
  ];

  const clusterCentersPCA = [
    { x: -14.2, y: 3.1, name: 'T Cells', id: 0 },
    { x: 18.5, y: -8.4, name: 'B Cells', id: 1 },
    { x: 4.2, y: 16.2, name: 'CD14+ Monocytes', id: 2 },
    { x: -11.8, y: -9.5, name: 'NK Cells', id: 3 },
    { x: 7.1, y: 8.9, name: 'Dendritic Cells', id: 4 },
  ];

  const counts = [1500, 1000, 800, 600, 400];
  const batches = ['Batch_A', 'Batch_B', 'Batch_C'];
  const conditions = ['Control', 'Stimulated'];

  // Seeded pseudo-random generator
  let seed = 12345;
  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }
  function gaussian() {
    const u1 = rnd();
    const u2 = rnd();
    return Math.sqrt(-2.0 * Math.log(u1 + 1e-12)) * Math.cos(2.0 * Math.PI * u2);
  }

  // Downsample to 1,200 points for smooth canvas rendering
  const sampleCounts = [400, 280, 240, 180, 100];

  for (let c = 0; c < 5; c++) {
    const n = sampleCounts[c];
    for (let i = 0; i < n; i++) {
      const cellId = `CELL_${c}_${i}`;
      const batch = batches[Math.floor(rnd() * batches.length)];
      const condition = conditions[rnd() > 0.4 ? 1 : 0];

      // Hybrid UMAP point (well separated, continuous manifold)
      const hx = clusterCentersHybrid[c].x + gaussian() * 0.75;
      const hy = clusterCentersHybrid[c].y + gaussian() * 0.75;
      hybrid.push({
        id: cellId,
        x: Number(hx.toFixed(3)),
        y: Number(hy.toFixed(3)),
        cluster: c,
        cell_type: clusterCentersHybrid[c].name,
        batch,
        condition,
      });

      // Direct UMAP point (more fragmented)
      const dx = clusterCentersDirect[c].x + gaussian() * 1.1;
      const dy = clusterCentersDirect[c].y + gaussian() * 1.1;
      direct.push({
        id: cellId,
        x: Number(dx.toFixed(3)),
        y: Number(dy.toFixed(3)),
        cluster: c,
        cell_type: clusterCentersDirect[c].name,
        batch,
        condition,
      });

      // PCA point (linear variance)
      const px = clusterCentersPCA[c].x + gaussian() * 4.2;
      const py = clusterCentersPCA[c].y + gaussian() * 3.8;
      pca.push({
        id: cellId,
        x: Number(px.toFixed(3)),
        y: Number(py.toFixed(3)),
        cluster: c,
        cell_type: clusterCentersPCA[c].name,
        batch,
        condition,
      });
    }
  }

  return { hybrid, direct, pca };
}

export const EMBEDDINGS_DATA = generateCells();

export const BIOMARKERS_DATA: BiomarkerItem[] = [
  {
    gene_symbol: 'CD3D',
    cluster_id: 0,
    cluster_name: 'T Cells',
    rank: 1,
    composite_score: 0.965,
    log2_fc: 3.84,
    p_value_adj: 1.2e-48,
    roc_auc: 0.985,
    specificity: 0.94,
    prevalence: 0.92,
    prioritization_category: 'Tier 1',
    validation_status: 'Gold Standard Marker',
  },
  {
    gene_symbol: 'CD3E',
    cluster_id: 0,
    cluster_name: 'T Cells',
    rank: 2,
    composite_score: 0.948,
    log2_fc: 3.42,
    p_value_adj: 3.5e-44,
    roc_auc: 0.978,
    specificity: 0.92,
    prevalence: 0.89,
    prioritization_category: 'Tier 1',
    validation_status: 'Gold Standard Marker',
  },
  {
    gene_symbol: 'CD4',
    cluster_id: 0,
    cluster_name: 'T Cells',
    rank: 3,
    composite_score: 0.912,
    log2_fc: 2.89,
    p_value_adj: 2.1e-36,
    roc_auc: 0.945,
    specificity: 0.88,
    prevalence: 0.81,
    prioritization_category: 'Tier 1',
    validation_status: 'Validated',
  },
  {
    gene_symbol: 'CD19',
    cluster_id: 1,
    cluster_name: 'B Cells',
    rank: 1,
    composite_score: 0.972,
    log2_fc: 4.12,
    p_value_adj: 8.4e-52,
    roc_auc: 0.991,
    specificity: 0.96,
    prevalence: 0.94,
    prioritization_category: 'Tier 1',
    validation_status: 'Gold Standard Marker',
  },
  {
    gene_symbol: 'MS4A1',
    cluster_id: 1,
    cluster_name: 'B Cells',
    rank: 2,
    composite_score: 0.958,
    log2_fc: 3.95,
    p_value_adj: 5.2e-49,
    roc_auc: 0.982,
    specificity: 0.95,
    prevalence: 0.91,
    prioritization_category: 'Tier 1',
    validation_status: 'Gold Standard Marker (CD20)',
  },
  {
    gene_symbol: 'CD79A',
    cluster_id: 1,
    cluster_name: 'B Cells',
    rank: 3,
    composite_score: 0.924,
    log2_fc: 3.20,
    p_value_adj: 4.1e-40,
    roc_auc: 0.964,
    specificity: 0.91,
    prevalence: 0.88,
    prioritization_category: 'Tier 1',
    validation_status: 'Validated',
  },
  {
    gene_symbol: 'CD14',
    cluster_id: 2,
    cluster_name: 'CD14+ Monocytes',
    rank: 1,
    composite_score: 0.981,
    log2_fc: 4.45,
    p_value_adj: 1.1e-55,
    roc_auc: 0.994,
    specificity: 0.97,
    prevalence: 0.95,
    prioritization_category: 'Tier 1',
    validation_status: 'Gold Standard Marker',
  },
  {
    gene_symbol: 'LYZ',
    cluster_id: 2,
    cluster_name: 'CD14+ Monocytes',
    rank: 2,
    composite_score: 0.946,
    log2_fc: 3.65,
    p_value_adj: 6.3e-45,
    roc_auc: 0.975,
    specificity: 0.93,
    prevalence: 0.90,
    prioritization_category: 'Tier 1',
    validation_status: 'Validated',
  },
  {
    gene_symbol: 'S100A8',
    cluster_id: 2,
    cluster_name: 'CD14+ Monocytes',
    rank: 3,
    composite_score: 0.905,
    log2_fc: 3.10,
    p_value_adj: 9.8e-38,
    roc_auc: 0.951,
    specificity: 0.89,
    prevalence: 0.84,
    prioritization_category: 'Tier 1',
    validation_status: 'Validated',
  },
  {
    gene_symbol: 'NKG7',
    cluster_id: 3,
    cluster_name: 'NK Cells',
    rank: 1,
    composite_score: 0.968,
    log2_fc: 3.98,
    p_value_adj: 4.7e-50,
    roc_auc: 0.988,
    specificity: 0.94,
    prevalence: 0.93,
    prioritization_category: 'Tier 1',
    validation_status: 'Gold Standard Marker',
  },
  {
    gene_symbol: 'GNLY',
    cluster_id: 3,
    cluster_name: 'NK Cells',
    rank: 2,
    composite_score: 0.942,
    log2_fc: 3.52,
    p_value_adj: 1.8e-43,
    roc_auc: 0.971,
    specificity: 0.91,
    prevalence: 0.89,
    prioritization_category: 'Tier 1',
    validation_status: 'Validated',
  },
  {
    gene_symbol: 'FCER1A',
    cluster_id: 4,
    cluster_name: 'Dendritic Cells',
    rank: 1,
    composite_score: 0.959,
    log2_fc: 3.78,
    p_value_adj: 7.2e-46,
    roc_auc: 0.984,
    specificity: 0.95,
    prevalence: 0.91,
    prioritization_category: 'Tier 1',
    validation_status: 'Gold Standard Marker',
  },
  {
    gene_symbol: 'CLEC10A',
    cluster_id: 4,
    cluster_name: 'Dendritic Cells',
    rank: 2,
    composite_score: 0.928,
    log2_fc: 3.25,
    p_value_adj: 2.9e-39,
    roc_auc: 0.962,
    specificity: 0.92,
    prevalence: 0.86,
    prioritization_category: 'Tier 1',
    validation_status: 'Validated',
  },
  {
    gene_symbol: 'HLA-DRA',
    cluster_id: 4,
    cluster_name: 'Dendritic Cells',
    rank: 3,
    composite_score: 0.884,
    log2_fc: 2.65,
    p_value_adj: 8.5e-31,
    roc_auc: 0.925,
    specificity: 0.85,
    prevalence: 0.92,
    prioritization_category: 'Tier 2',
    validation_status: 'Novel Candidate',
  },
  {
    gene_symbol: 'VCAN',
    cluster_id: 2,
    cluster_name: 'CD14+ Monocytes',
    rank: 4,
    composite_score: 0.871,
    log2_fc: 2.45,
    p_value_adj: 1.4e-28,
    roc_auc: 0.915,
    specificity: 0.83,
    prevalence: 0.79,
    prioritization_category: 'Tier 2',
    validation_status: 'Novel Candidate',
  },
];

export const VOLCANO_GENES = [
  ...BIOMARKERS_DATA.map((b) => ({
    gene: b.gene_symbol,
    log2fc: b.log2_fc,
    pvalue_adj: b.p_value_adj,
    cluster: b.cluster_id,
    is_marker: true,
  })),
  // Additional non-significant or downregulated genes
  { gene: 'RPL13A', log2fc: 0.12, pvalue_adj: 0.65, cluster: 0, is_marker: false },
  { gene: 'GAPDH', log2fc: -0.05, pvalue_adj: 0.88, cluster: 0, is_marker: false },
  { gene: 'ACTB', log2fc: 0.18, pvalue_adj: 0.42, cluster: 0, is_marker: false },
  { gene: 'EEF1A1', log2fc: -0.22, pvalue_adj: 0.31, cluster: 0, is_marker: false },
  { gene: 'B2M', log2fc: 0.45, pvalue_adj: 0.08, cluster: 0, is_marker: false },
  { gene: 'MALAT1', log2fc: -0.15, pvalue_adj: 0.55, cluster: 0, is_marker: false },
  { gene: 'JUN', log2fc: -1.25, pvalue_adj: 0.002, cluster: 1, is_marker: false },
  { gene: 'FOS', log2fc: -1.48, pvalue_adj: 0.0004, cluster: 1, is_marker: false },
  { gene: 'DUSP1', log2fc: -1.10, pvalue_adj: 0.005, cluster: 2, is_marker: false },
];
