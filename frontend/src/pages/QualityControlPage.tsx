import React, { useState } from 'react';
import { QCSummary } from '../types';
import { QCPlots } from '../charts/QCPlots';
import { ShieldCheck, AlertCircle, Filter, RefreshCw } from 'lucide-react';

interface QualityControlPageProps {
  qc: QCSummary;
  onApplyQC: (minCounts: number, minGenes: number, maxMito: number) => void;
}

export const QualityControlPage: React.FC<QualityControlPageProps> = ({
  qc,
  onApplyQC,
}) => {
  const [minCounts, setMinCounts] = useState(1000);
  const [minGenes, setMinGenes] = useState(500);
  const [maxMito, setMaxMito] = useState(10);
  const [isApplying, setIsApplying] = useState(false);

  const handleUpdate = (type: 'counts' | 'genes' | 'mito', value: number) => {
    if (type === 'counts') setMinCounts(value);
    if (type === 'genes') setMinGenes(value);
    if (type === 'mito') setMaxMito(value);
  };

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyQC(minCounts, minGenes, maxMito);
      setIsApplying(false);
    }, 600);
  };

  // Simulated dynamic cell retention calculation
  const retainedPct = Math.max(75, 96 - (minCounts - 1000) * 0.01 - (minGenes - 500) * 0.02 - (10 - maxMito) * 0.5);
  const estimatedCells = Math.round((qc.cells_before * retainedPct) / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--emerald-400)" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Single-Cell Quality Control & Filtering
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Filter out low-quality damaged cells, empty droplets, and cell doublets using transcript library size, detected gene diversity, and mitochondrial ratio.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleApply}
            disabled={isApplying}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Filter size={14} />
            <span>{isApplying ? 'Filtering...' : 'Apply Filters & Update'}</span>
          </button>
        </div>

        {/* Filter Impact Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginTop: '20px',
            padding: '16px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Initial Raw Cells</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {qc.cells_before.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Retained Cells</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--cyan-400)' }}>
              {estimatedCells.toLocaleString()} ({retainedPct.toFixed(1)}%)
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Removed Low-Quality Droplets</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--rose-400)' }}>
              {(qc.cells_before - estimatedCells).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>High-Confidence Genes</div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--emerald-400)' }}>
              {qc.genes_after.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* QC Interactive Plots & Sliders */}
      <QCPlots
        qc={qc}
        minCountsCutoff={minCounts}
        minGenesCutoff={minGenes}
        maxMitoCutoff={maxMito}
        onUpdateCutoff={handleUpdate}
      />

      {/* Scientific Guidelines Alert */}
      <div
        style={{
          display: 'flex',
          gap: '14px',
          padding: '16px',
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '10px',
          alignItems: 'flex-start',
        }}
      >
        <AlertCircle size={18} color="var(--cyan-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Bioinformatics QC Guideline:</strong> Cells with mitochondrial read fractions &gt; 10% frequently represent lysed cells with compromised membranes where cytoplasmic mRNA leaked out. Cells with fewer than 500 detected genes represent ambient RNA or empty droplets.
        </div>
      </div>
    </div>
  );
};
