import React from 'react';
import { QCSummary } from '../types';

interface QCPlotsProps {
  qc: QCSummary;
  minCountsCutoff: number;
  minGenesCutoff: number;
  maxMitoCutoff: number;
  onUpdateCutoff: (type: 'counts' | 'genes' | 'mito', value: number) => void;
}

export const QCPlots: React.FC<QCPlotsProps> = ({
  qc,
  minCountsCutoff,
  minGenesCutoff,
  maxMitoCutoff,
  onUpdateCutoff,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 3 Metric Filter Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Total UMI Counts */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total Counts (UMIs)
            </span>
            <span style={{ fontSize: '12px', color: 'var(--cyan-400)', fontWeight: 700 }}>
              Median: {qc.median_counts.toLocaleString()}
            </span>
          </div>

          <div style={{ height: '70px', background: '#070a12', borderRadius: '6px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '0 8px 4px' }}>
            {/* Simulated histogram bars */}
            {[10, 25, 45, 80, 95, 85, 60, 40, 25, 15, 8, 4].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: i < 2 ? '#f43f5e' : 'var(--cyan-500)',
                  margin: '0 2px',
                  borderRadius: '2px 2px 0 0',
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Min Cutoff:</span>
            <input
              type="range"
              min="500"
              max="2500"
              step="100"
              value={minCountsCutoff}
              onChange={(e) => onUpdateCutoff('counts', parseInt(e.target.value))}
              style={{ width: '130px', accentColor: 'var(--cyan-500)' }}
            />
            <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan-400)' }}>
              {minCountsCutoff}
            </span>
          </div>
        </div>

        {/* Detected Genes */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Detected Genes / Cell
            </span>
            <span style={{ fontSize: '12px', color: 'var(--teal-400)', fontWeight: 700 }}>
              Median: {qc.median_genes.toLocaleString()}
            </span>
          </div>

          <div style={{ height: '70px', background: '#070a12', borderRadius: '6px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '0 8px 4px' }}>
            {[12, 35, 70, 90, 85, 75, 55, 38, 20, 10, 5].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: i < 1 ? '#f43f5e' : 'var(--teal-500)',
                  margin: '0 2px',
                  borderRadius: '2px 2px 0 0',
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Min Cutoff:</span>
            <input
              type="range"
              min="200"
              max="800"
              step="50"
              value={minGenesCutoff}
              onChange={(e) => onUpdateCutoff('genes', parseInt(e.target.value))}
              style={{ width: '130px', accentColor: 'var(--teal-500)' }}
            />
            <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--teal-400)' }}>
              {minGenesCutoff}
            </span>
          </div>
        </div>

        {/* Mitochondrial % */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Mitochondrial Reads %
            </span>
            <span style={{ fontSize: '12px', color: 'var(--amber-400)', fontWeight: 700 }}>
              Median: {qc.median_mito_pct}%
            </span>
          </div>

          <div style={{ height: '70px', background: '#070a12', borderRadius: '6px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '0 8px 4px' }}>
            {[90, 75, 50, 30, 18, 12, 8, 5, 3, 2].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  background: i > 6 ? '#f43f5e' : 'var(--indigo-500)',
                  margin: '0 2px',
                  borderRadius: '2px 2px 0 0',
                  opacity: 0.85,
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max Cutoff:</span>
            <input
              type="range"
              min="5"
              max="20"
              step="1"
              value={maxMitoCutoff}
              onChange={(e) => onUpdateCutoff('mito', parseInt(e.target.value))}
              style={{ width: '130px', accentColor: 'var(--amber-500)' }}
            />
            <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--amber-400)' }}>
              {maxMitoCutoff}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
