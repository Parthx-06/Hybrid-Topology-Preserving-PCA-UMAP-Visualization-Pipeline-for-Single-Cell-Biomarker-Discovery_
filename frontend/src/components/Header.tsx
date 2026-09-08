import React from 'react';
import { Play, FileDown, Moon, Sun, CheckCircle, Database } from 'lucide-react';
import { ExperimentMetadata } from '../types';

interface HeaderProps {
  experiment: ExperimentMetadata;
  isRunning: boolean;
  onRunPipeline: () => void;
  onExportReport: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  experiment,
  isRunning,
  onRunPipeline,
  onExportReport,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="header" id="main-header">
      {/* Active Experiment & Dataset Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {experiment.name}
            </span>
            <span className="badge badge-cyan">
              <Database size={10} style={{ marginRight: '4px' }} />
              {experiment.dataset_name}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {experiment.cell_count.toLocaleString()} cells &bull; {experiment.gene_count.toLocaleString()} genes profiled &bull; Leiden (res=0.5)
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '9999px',
            padding: '4px 10px',
            fontSize: '12px',
            color: 'var(--emerald-400)',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={13} />
          <span>Pipeline Synced</span>
        </div>

        {/* Run / Re-run Pipeline */}
        <button
          id="btn-run-pipeline"
          className="btn btn-primary"
          onClick={onRunPipeline}
          disabled={isRunning}
          style={{ cursor: isRunning ? 'not-allowed' : 'pointer' }}
        >
          <Play size={14} fill="currentColor" />
          <span>{isRunning ? 'Processing Manifold...' : 'Run Pipeline'}</span>
        </button>

        {/* Export HTML Report */}
        <button
          id="btn-export-report"
          className="btn btn-secondary"
          onClick={onExportReport}
        >
          <FileDown size={14} />
          <span>Export Report</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="btn-toggle-theme"
          className="btn btn-outline"
          onClick={onToggleTheme}
          style={{ padding: '8px 10px', borderRadius: '8px' }}
          title="Toggle Dark / Light mode"
        >
          {theme === 'dark' ? <Sun size={15} color="var(--amber-400)" /> : <Moon size={15} />}
        </button>

        {/* User Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px 4px 4px',
            background: 'var(--bg-tertiary)',
            borderRadius: '20px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--cyan-500), var(--emerald-500))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            SA
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Admin
          </span>
        </div>
      </div>
    </header>
  );
};
