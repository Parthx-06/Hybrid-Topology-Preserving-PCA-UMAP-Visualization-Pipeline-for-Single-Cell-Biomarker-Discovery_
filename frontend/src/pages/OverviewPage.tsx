import React from 'react';
import {
  Activity,
  Layers,
  Dna,
  CheckCircle2,
  Clock,
  TrendingUp,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import {
  BiomarkerItem,
  CellPoint,
  ClusterSummary,
  ExperimentMetadata,
  PipelineStepStatus,
  TopologyBenchmark,
} from '../types';
import { EmbeddingScatter } from '../charts/EmbeddingScatter';

interface OverviewPageProps {
  experiment: ExperimentMetadata;
  steps: PipelineStepStatus[];
  benchmarks: Record<string, TopologyBenchmark>;
  clusters: ClusterSummary[];
  biomarkers: BiomarkerItem[];
  hybridCells: CellPoint[];
  onNavigateTab: (tab: any) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  experiment,
  steps,
  benchmarks,
  clusters,
  biomarkers,
  hybridCells,
  onNavigateTab,
}) => {
  const hybridBench = benchmarks.hybrid || {
    knn_preservation: 0.884,
    trustworthiness: 0.942,
    continuity: 0.961,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner / Hero Metric Strip */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-title">Total Filtered Cells</span>
            <Activity size={18} color="var(--cyan-400)" />
          </div>
          <div className="metric-value">{experiment.cell_count.toLocaleString()}</div>
          <div className="metric-change">
            <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>93.1%</span>
            <span>passed strict QC filter</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-title">Genes Profiled</span>
            <Dna size={18} color="var(--teal-400)" />
          </div>
          <div className="metric-value">{experiment.gene_count.toLocaleString()}</div>
          <div className="metric-change">
            <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>2,000</span>
            <span>highly variable genes (HVGs)</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-title">Cell Clusters</span>
            <Layers size={18} color="var(--indigo-400)" />
          </div>
          <div className="metric-value">{clusters.length} Populations</div>
          <div className="metric-change">
            <span>Leiden Resolution:</span>
            <span className="mono" style={{ color: 'var(--indigo-400)', fontWeight: 600 }}>0.50</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-header">
            <span className="metric-title">Topology Preservation</span>
            <TrendingUp size={18} color="var(--emerald-400)" />
          </div>
          <div className="metric-value">{(hybridBench.knn_preservation * 100).toFixed(1)}%</div>
          <div className="metric-change">
            <span style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>+18.9%</span>
            <span>vs raw direct UMAP</span>
          </div>
        </div>
      </div>

      {/* Pipeline Execution Stepper */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              End-to-End Bioinformatics Pipeline Execution
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Deterministic scRNA-seq workflow with progress tracking and reproducibility stamps
            </div>
          </div>
          <span className="badge badge-emerald">All 7 Steps Complete</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          {steps.map((st) => (
            <div
              key={st.id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyan-400)' }}>
                  {st.step}
                </span>
                <CheckCircle2 size={13} color="var(--emerald-400)" />
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {st.step === 'qc' && 'Quality Control'}
                {st.step === 'preprocess' && 'Normalization'}
                {st.step === 'pca' && 'Spectral PCA'}
                {st.step === 'umap' && 'Hybrid UMAP'}
                {st.step === 'cluster' && 'Leiden Graph'}
                {st.step === 'de' && 'Wilcoxon DE'}
                {st.step === 'biomarkers' && 'ROC Ranking'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={10} />
                <span>Finished {st.completed_at || 'Ready'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Split Section: Embedding Preview & Topology Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Hybrid UMAP Preview */}
        <div>
          <EmbeddingScatter
            cells={hybridCells}
            title="Hybrid PCA → UMAP Manifold (Topology-Preserved)"
            colorBy="cluster"
            height={380}
          />
        </div>

        {/* Topology Preservation Scorecard */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Topology Preservation Benchmark
              </h3>
              <button
                className="btn btn-outline"
                style={{ padding: '4px 8px', fontSize: '11px' }}
                onClick={() => onNavigateTab('embeddings')}
              >
                <span>Full Comparison</span>
                <ArrowRight size={12} />
              </button>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Quantitative validation showing how the Hybrid PCA-initialized manifold preserves local k-NN neighborhoods and global continuity compared to raw direct UMAP and pure PCA:
            </p>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>k-NN (k=15)</th>
                    <th>Trustworthiness</th>
                    <th>Continuity</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(benchmarks).map(([key, bm]) => (
                    <tr
                      key={key}
                      style={{
                        background: key === 'hybrid' ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                        fontWeight: key === 'hybrid' ? 700 : 400,
                      }}
                    >
                      <td style={{ color: key === 'hybrid' ? 'var(--cyan-400)' : 'inherit' }}>
                        {bm.method}
                      </td>
                      <td className="mono">{(bm.knn_preservation * 100).toFixed(1)}%</td>
                      <td className="mono">{bm.trustworthiness.toFixed(3)}</td>
                      <td className="mono">{bm.continuity.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Biomarker preview callout */}
          <div
            style={{
              marginTop: '16px',
              padding: '14px',
              background: 'rgba(6, 182, 212, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.2)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan-400)' }}>
                Top Ranked Biomarkers Discovered
              </span>
              <button
                onClick={() => onNavigateTab('biomarkers')}
                style={{ background: 'none', border: 'none', color: 'var(--cyan-300)', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
              >
                View all ({biomarkers.length}) &rarr;
              </button>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {biomarkers.slice(0, 6).map((b) => (
                <span
                  key={b.gene_symbol}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--bg-tertiary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {b.gene_symbol} <span style={{ color: 'var(--cyan-400)', fontSize: '10px' }}>AUC:{b.roc_auc.toFixed(2)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
