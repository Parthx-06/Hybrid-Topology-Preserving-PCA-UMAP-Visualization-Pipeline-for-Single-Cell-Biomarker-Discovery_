import React from 'react';
import {
  Play,
  FileDown,
  Moon,
  Sun,
  CheckCircle,
  Database,
  Search,
  Server,
  ChevronDown,
} from 'lucide-react';
import { DatasetCohort, ExperimentMetadata } from '../types';
import { DATASET_COHORTS } from '../services/mockData';

interface HeaderProps {
  experiment: ExperimentMetadata;
  selectedCohortId: string;
  onSelectCohort: (cohortId: string) => void;
  isRunning: boolean;
  onOpenPipelineRunner: () => void;
  onExportReport: () => void;
  onOpenCommandPalette: () => void;
  onOpenTelemetry: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  experiment,
  selectedCohortId,
  onSelectCohort,
  isRunning,
  onOpenPipelineRunner,
  onExportReport,
  onOpenCommandPalette,
  onOpenTelemetry,
  theme,
  onToggleTheme,
}) => {
  const currentCohort = DATASET_COHORTS.find((c) => c.id === selectedCohortId) || DATASET_COHORTS[0];

  return (
    <header className="header" id="main-header" style={{ height: '70px', padding: '0 24px' }}>
      {/* Active Experiment & Dataset Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Dataset Cohort Selector */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {experiment.name}
            </span>

            {/* Interactive Cohort Dropdown */}
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={selectedCohortId}
                onChange={(e) => onSelectCohort(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid var(--border-glow)',
                  color: 'var(--cyan-400)',
                  fontWeight: 700,
                  fontSize: '11px',
                  padding: '3px 24px 3px 10px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {DATASET_COHORTS.map((c) => (
                  <option key={c.id} value={c.id} style={{ background: '#0f172a', color: '#fff' }}>
                    {c.shortLabel} ({c.cell_count.toLocaleString()} cells)
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                color="var(--cyan-400)"
                style={{ position: 'absolute', right: '8px', pointerEvents: 'none' }}
              />
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', gap: '8px' }}>
            <span>{currentCohort.organ} &bull; {currentCohort.technology}</span>
            <span>&bull;</span>
            <span style={{ color: 'var(--text-secondary)' }}>{experiment.cell_count.toLocaleString()} cells ({experiment.gene_count.toLocaleString()} genes)</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Command Palette Trigger */}
        <button
          className="btn btn-outline"
          onClick={onOpenCommandPalette}
          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          title="Open Command Palette (Ctrl+K)"
        >
          <Search size={13} color="var(--cyan-400)" />
          <span>Search</span>
          <kbd style={{ padding: '1px 5px', fontSize: '10px', background: 'var(--bg-tertiary)', borderRadius: '3px', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
            Ctrl K
          </kbd>
        </button>

        {/* Worker & System Health Telemetry Pill */}
        <div
          onClick={onOpenTelemetry}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '11px',
            color: 'var(--emerald-400)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          title="View System Telemetry & Distributed Worker Cluster"
        >
          <Server size={12} />
          <span>Worker: US-East-1A &bull; Ready</span>
        </div>

        {/* Run / Launch Pipeline Modal */}
        <button
          id="btn-run-pipeline"
          className="btn btn-primary"
          onClick={onOpenPipelineRunner}
          disabled={isRunning}
          style={{ padding: '7px 14px', fontSize: '12px' }}
        >
          <Play size={13} fill="currentColor" />
          <span>Launch Pipeline</span>
        </button>

        {/* Export HTML Report */}
        <button
          id="btn-export-report"
          className="btn btn-secondary"
          onClick={onExportReport}
          style={{ padding: '7px 12px', fontSize: '12px' }}
        >
          <FileDown size={13} />
          <span>Export Report</span>
        </button>

        {/* Theme Toggle */}
        <button
          id="btn-toggle-theme"
          className="btn btn-outline"
          onClick={onToggleTheme}
          style={{ padding: '7px 10px', borderRadius: '8px' }}
          title="Toggle Dark / Light mode"
        >
          {theme === 'dark' ? <Sun size={14} color="var(--amber-400)" /> : <Moon size={14} />}
        </button>

        {/* User Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--cyan-500), var(--indigo-600))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
            marginLeft: '4px',
          }}
          title="Lead Computational Biologist"
        >
          CB
        </div>
      </div>
    </header>
  );
};
