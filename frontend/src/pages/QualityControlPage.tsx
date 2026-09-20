import React, { useState } from 'react';
import { QCSummary } from '../types';
import { QCPlots } from '../charts/QCPlots';
import { ShieldCheck, AlertCircle, Filter, CheckCircle2, Sliders } from 'lucide-react';

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
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const handleUpdate = (type: 'counts' | 'genes' | 'mito', value: number) => {
    if (type === 'counts') setMinCounts(value);
    if (type === 'genes') setMinGenes(value);
    if (type === 'mito') setMaxMito(value);
    setAppliedSuccess(false);
  };

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      onApplyQC(minCounts, minGenes, maxMito);
      setIsApplying(false);
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 3500);
    }, 400);
  };

  // Simulated dynamic cell retention calculation
  const countsLoss = Math.max(0, Math.round((minCounts - 500) * 0.15));
  const genesLoss = Math.max(0, Math.round((minGenes - 200) * 0.25));
  const mitoLoss = Math.max(0, Math.round((15 - maxMito) * 18));
  const totalDropped = Math.min(qc.cells_before - 500, countsLoss + genesLoss + mitoLoss);
  const estimatedCells = Math.max(500, qc.cells_before - totalDropped);
  const retainedPct = ((estimatedCells / qc.cells_before) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--emerald-400)" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Single-Cell Quality Control &amp; Outlier Filtering
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Filter out low-quality damaged cells, empty droplets, and cell doublets using transcript library size, detected gene diversity, and mitochondrial ratio.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {appliedSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--emerald-400)', fontSize: '12px', fontWeight: 600 }}>
                <CheckCircle2 size={15} />
                <span>Filters Applied Successfully!</span>
              </div>
            )}
            <button
              className="btn btn-primary"
              onClick={handleApply}
              disabled={isApplying}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Filter size={14} />
              <span>{isApplying ? 'Re-filtering...' : 'Apply Filters & Update'}</span>
            </button>
          </div>
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
              {totalDropped.toLocaleString()}
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

      {/* Outlier Breakdown Table */}
      <div className="glass-card">
        <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
          Cellular Outlier Breakdown Analysis
        </h4>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Classification Filter</th>
                <th>Threshold Applied</th>
                <th>Exclusion Mechanism</th>
                <th>Estimated Droplets Dropped</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Low Library Size</td>
                <td className="mono">&lt; {minCounts} UMI counts</td>
                <td>Ambient RNA &amp; empty droplets</td>
                <td className="mono" style={{ color: 'var(--rose-400)' }}>{countsLoss.toLocaleString()}</td>
                <td><span className="badge badge-rose">Excluded</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Low Gene Diversity</td>
                <td className="mono">&lt; {minGenes} genes</td>
                <td>Poor capture efficiency</td>
                <td className="mono" style={{ color: 'var(--rose-400)' }}>{genesLoss.toLocaleString()}</td>
                <td><span className="badge badge-rose">Excluded</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Mitochondrial Transcript Stress</td>
                <td className="mono">&gt; {maxMito}% mitochondrial</td>
                <td>Membrane lysis / apoptotic stress</td>
                <td className="mono" style={{ color: 'var(--rose-400)' }}>{mitoLoss.toLocaleString()}</td>
                <td><span className="badge badge-rose">Excluded</span></td>
              </tr>
              <tr style={{ background: 'rgba(16, 185, 129, 0.05)', fontWeight: 700 }}>
                <td style={{ color: 'var(--emerald-400)' }}>Passed High-Quality Cells</td>
                <td className="mono">All filters satisfied</td>
                <td>Validated single-cell transcriptome</td>
                <td className="mono" style={{ color: 'var(--emerald-400)' }}>{estimatedCells.toLocaleString()}</td>
                <td><span className="badge badge-emerald">Retained</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

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
          <strong style={{ color: 'var(--text-primary)' }}>Bioinformatics QC Standard:</strong> Droplets with mitochondrial read fractions &gt; 10% frequently represent lysed cells with compromised cell membranes where cytoplasmic mRNA leaked out. Droplets with fewer than 500 detected genes represent ambient RNA contamination.
        </div>
      </div>
    </div>
  );
};
