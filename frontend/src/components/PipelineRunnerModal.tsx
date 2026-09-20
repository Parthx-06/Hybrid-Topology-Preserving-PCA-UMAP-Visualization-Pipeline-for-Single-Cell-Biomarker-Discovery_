import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Terminal,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Database,
  X,
  RefreshCw,
} from 'lucide-react';
import { PipelineConfig, PipelineLogEntry, PipelineStep } from '../types';
import { DEFAULT_PIPELINE_CONFIG } from '../services/mockData';

interface PipelineRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
  onPipelineCompleted: () => void;
}

export const PipelineRunnerModal: React.FC<PipelineRunnerModalProps> = ({
  isOpen,
  onClose,
  datasetName,
  onPipelineCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'console'>('params');
  const [config, setConfig] = useState<PipelineConfig>(DEFAULT_PIPELINE_CONFIG);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('Idle');
  const [logs, setLogs] = useState<PipelineLogEntry[]>([]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleBottomRef.current) {
      consoleBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  const handleStartPipeline = () => {
    setIsRunning(true);
    setActiveTab('console');
    setProgress(0);
    setLogs([]);

    const timestamp = () => new Date().toISOString().substring(11, 19);

    const logSequence: Array<{
      delay: number;
      pct: number;
      step: string;
      entry: PipelineLogEntry;
    }> = [
      {
        delay: 200,
        pct: 5,
        step: 'Initializing Environment',
        entry: {
          timestamp: timestamp(),
          level: 'INFO',
          message: `[CellMap Orchestrator] Initializing compute session for cohort: ${datasetName}`,
        },
      },
      {
        delay: 500,
        pct: 15,
        step: 'Quality Control',
        entry: {
          timestamp: timestamp(),
          level: 'EXEC',
          message: `[Step 1/7 QC] Applying filters: min_counts>=${config.qc_min_counts}, min_genes>=${config.qc_min_genes}, max_mito<=${config.qc_max_mito}%.`,
          step: 'qc',
        },
      },
      {
        delay: 900,
        pct: 22,
        step: 'Quality Control',
        entry: {
          timestamp: timestamp(),
          level: 'SUCCESS',
          message: `[Step 1/7 QC] 93.1% cells passed filtering. Apoptotic/doublet droplets eliminated.`,
          step: 'qc',
        },
      },
      {
        delay: 1300,
        pct: 32,
        step: 'Normalization & HVG',
        entry: {
          timestamp: timestamp(),
          level: 'EXEC',
          message: `[Step 2/7 Preprocess] Size-factor normalization (target_sum=1e4) + log1p variance stabilization.`,
          step: 'preprocess',
        },
      },
      {
        delay: 1700,
        pct: 42,
        step: 'Normalization & HVG',
        entry: {
          timestamp: timestamp(),
          level: 'SUCCESS',
          message: `[Step 2/7 Preprocess] Selected top ${config.n_top_genes} Highly Variable Genes (HVGs) via Seurat v3 dispersion.`,
          step: 'preprocess',
        },
      },
      {
        delay: 2200,
        pct: 55,
        step: 'Spectral PCA Decomposition',
        entry: {
          timestamp: timestamp(),
          level: 'EXEC',
          message: `[Step 3/7 PCA] Computing truncated SVD with ARPACK solver (K=${config.n_pcs} principal components).`,
          step: 'pca',
        },
      },
      {
        delay: 2600,
        pct: 65,
        step: 'Spectral PCA Decomposition',
        entry: {
          timestamp: timestamp(),
          level: 'SUCCESS',
          message: `[Step 3/7 PCA] Explained variance ratio: top 30 PCs capture 78.4% cumulative biological variance.`,
          step: 'pca',
        },
      },
      {
        delay: 3100,
        pct: 75,
        step: 'Topology-Preserving UMAP',
        entry: {
          timestamp: timestamp(),
          level: 'EXEC',
          message: `[Step 4/7 Hybrid UMAP] Constructing k-NN graph (k=${config.k_neighbors}) on spectral manifold. min_dist=${config.umap_min_dist}.`,
          step: 'umap',
        },
      },
      {
        delay: 3700,
        pct: 82,
        step: 'Topology-Preserving UMAP',
        entry: {
          timestamp: timestamp(),
          level: 'SUCCESS',
          message: `[Step 4/7 Hybrid UMAP] Manifold converged! k-NN preservation: 88.4% | Trustworthiness: 0.942 | Continuity: 0.961.`,
          step: 'umap',
        },
      },
      {
        delay: 4200,
        pct: 88,
        step: 'Leiden Community Partitioning',
        entry: {
          timestamp: timestamp(),
          level: 'EXEC',
          message: `[Step 5/7 Clustering] Optimizing modularity on fuzzy simplicial graph with resolution=${config.leiden_resolution}.`,
          step: 'cluster',
        },
      },
      {
        delay: 4700,
        pct: 92,
        step: 'Differential Expression',
        entry: {
          timestamp: timestamp(),
          level: 'EXEC',
          message: `[Step 6/7 DE] Running ${config.de_method === 'wilcoxon' ? 'Wilcoxon Rank-Sum test' : "Welch's t-test"} with Benjamini-Hochberg FDR correction.`,
          step: 'de',
        },
      },
      {
        delay: 5200,
        pct: 98,
        step: 'Biomarker Prioritization & GSEA',
        entry: {
          timestamp: timestamp(),
          level: 'EXEC',
          message: `[Step 7/7 Biomarkers] Computing composite ROC-AUC scoring, target specificity, and MSigDB Hallmark pathway enrichment.`,
          step: 'biomarkers',
        },
      },
      {
        delay: 5700,
        pct: 100,
        step: 'Completed',
        entry: {
          timestamp: timestamp(),
          level: 'SUCCESS',
          message: `[CellMap Orchestrator] Pipeline run finished successfully in 5.48s. Manifest SHA-256 locked.`,
        },
      },
    ];

    logSequence.forEach((item) => {
      setTimeout(() => {
        setLogs((prev) => [...prev, item.entry]);
        setProgress(item.pct);
        setCurrentStep(item.step);
        if (item.pct === 100) {
          setIsRunning(false);
          onPipelineCompleted();
        }
      }, item.delay);
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg), 0 0 35px rgba(6, 182, 212, 0.25)',
          border: '1px solid var(--border-glow)',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--cyan-500), var(--indigo-500))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Play size={16} fill="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Production Pipeline Orchestration
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Target Cohort: <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>{datasetName}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Tab switchers */}
            <button
              className={`btn ${activeTab === 'params' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => setActiveTab('params')}
            >
              <Sliders size={13} />
              <span>Hyperparameters</span>
            </button>
            <button
              className={`btn ${activeTab === 'console' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={() => setActiveTab('console')}
            >
              <Terminal size={13} />
              <span>Execution Terminal</span>
              {isRunning && <RefreshCw size={11} className="spin" />}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress Bar Strip */}
        <div style={{ background: 'var(--bg-tertiary)', padding: '8px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              Step: <strong style={{ color: 'var(--cyan-400)' }}>{currentStep}</strong>
            </span>
            <span className="mono" style={{ color: isRunning ? 'var(--cyan-400)' : 'var(--emerald-400)', fontWeight: 700 }}>
              {progress}%
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--cyan-500), var(--emerald-400))',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, minHeight: '340px' }}>
          {activeTab === 'params' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Tune pipeline parameters for quality control, spectral embedding, k-NN graph construction, and differential expression.
              </div>

              {/* QC & Filtering Section */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyan-400)', marginBottom: '12px' }}>
                  1. Quality Control & Normalization
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Min UMI Counts ({config.qc_min_counts})
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="2000"
                      step="50"
                      value={config.qc_min_counts}
                      onChange={(e) => setConfig({ ...config, qc_min_counts: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Min Detected Genes ({config.qc_min_genes})
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="1000"
                      step="25"
                      value={config.qc_min_genes}
                      onChange={(e) => setConfig({ ...config, qc_min_genes: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Max Mitochondrial % ({config.qc_max_mito}%)
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="25"
                      step="0.5"
                      value={config.qc_max_mito}
                      onChange={(e) => setConfig({ ...config, qc_max_mito: Number(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Dimensionality Reduction & Graph */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--indigo-400)', marginBottom: '12px' }}>
                  2. Hybrid Dimensionality Reduction & Graph
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Top HVGs ({config.n_top_genes})
                    </label>
                    <input
                      type="number"
                      value={config.n_top_genes}
                      onChange={(e) => setConfig({ ...config, n_top_genes: Number(e.target.value) })}
                      style={{ width: '100%', padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      PCA Components ({config.n_pcs})
                    </label>
                    <input
                      type="number"
                      value={config.n_pcs}
                      onChange={(e) => setConfig({ ...config, n_pcs: Number(e.target.value) })}
                      style={{ width: '100%', padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      k-NN Neighbors ({config.k_neighbors})
                    </label>
                    <input
                      type="number"
                      value={config.k_neighbors}
                      onChange={(e) => setConfig({ ...config, k_neighbors: Number(e.target.value) })}
                      style={{ width: '100%', padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Leiden Resolution ({config.leiden_resolution})
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={config.leiden_resolution}
                      onChange={(e) => setConfig({ ...config, leiden_resolution: Number(e.target.value) })}
                      style={{ width: '100%', padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Differential Expression */}
              <div
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '14px',
                }}
              >
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--emerald-400)', marginBottom: '12px' }}>
                  3. Differential Expression & Biomarker Ranking
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      Hypothesis Test
                    </label>
                    <select
                      value={config.de_method}
                      onChange={(e) => setConfig({ ...config, de_method: e.target.value as any })}
                      style={{ width: '100%', padding: '6px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    >
                      <option value="wilcoxon">Wilcoxon Rank-Sum (Non-parametric)</option>
                      <option value="t-test">Welch's Two-Sample t-Test</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                      FDR Benjamini-Hochberg Cutoff
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={config.fdr_threshold}
                      onChange={(e) => setConfig({ ...config, fdr_threshold: Number(e.target.value) })}
                      style={{ width: '100%', padding: '4px 8px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', borderRadius: '4px' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Terminal Console View */
            <div
              style={{
                background: '#040711',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: '8px',
                padding: '14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                height: '340px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ color: 'var(--text-muted)', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }}>
                # CellMap BioAnalytics Distributed Worker Terminal v2.4.0 — worker-01 [ACTIVE]
              </div>
              {logs.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '20px', textAlign: 'center' }}>
                  No active pipeline execution. Click "Launch Pipeline Execution" below to start.
                </div>
              )}
              {logs.map((log, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                  <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>[{log.timestamp}]</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        log.level === 'SUCCESS'
                          ? 'var(--emerald-400)'
                          : log.level === 'EXEC'
                          ? 'var(--cyan-400)'
                          : log.level === 'WARN'
                          ? 'var(--amber-400)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {log.level}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>{log.message}</span>
                </div>
              ))}
              <div ref={consoleBottomRef} />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={12} color="var(--cyan-400)" />
              <span>Worker Node:</span> <strong style={{ color: 'var(--text-primary)' }}>celery@worker-01</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Database size={12} color="var(--emerald-400)" />
              <span>AnnData Cache:</span> <strong style={{ color: 'var(--text-primary)' }}>HDF5 CSR Sparse</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-outline" onClick={onClose} disabled={isRunning}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleStartPipeline}
              disabled={isRunning}
              style={{ minWidth: '180px' }}
            >
              {isRunning ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Computing Manifold...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Launch Pipeline Execution</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
