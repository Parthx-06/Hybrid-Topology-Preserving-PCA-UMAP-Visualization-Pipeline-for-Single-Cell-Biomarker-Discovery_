import React from 'react';
import { BiomarkerItem } from '../types';
import { ROCCurve } from '../charts/ROCCurve';
import { X, Award, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BiomarkerModalProps {
  biomarker: BiomarkerItem | null;
  onClose: () => void;
}

export const BiomarkerModal: React.FC<BiomarkerModalProps> = ({
  biomarker,
  onClose,
}) => {
  if (!biomarker) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
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
          maxWidth: '680px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-medium)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {biomarker.gene_symbol}
              </h3>
              <span className="badge badge-cyan">{biomarker.prioritization_category}</span>
              <span className="badge badge-emerald">Rank #{biomarker.rank}</span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Specific Candidate Marker for{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{biomarker.cluster_name || `Cluster ${biomarker.cluster_id}`}</strong>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body: Left ROC Curve, Right Score Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div>
            <ROCCurve
              geneSymbol={biomarker.gene_symbol}
              auc={biomarker.roc_auc}
              clusterName={biomarker.cluster_name}
              specificity={biomarker.specificity}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Composite Score Breakdown (Score: {biomarker.composite_score.toFixed(3)})
            </div>

            {/* Score bars */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ROC-AUC (w=0.25)</span>
                <span className="mono" style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>{biomarker.roc_auc.toFixed(3)}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px' }}>
                <div style={{ width: `${biomarker.roc_auc * 100}%`, height: '100%', background: 'var(--cyan-500)', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>log₂ Fold Change (w=0.25)</span>
                <span className="mono" style={{ color: 'var(--indigo-400)', fontWeight: 600 }}>{biomarker.log2_fc.toFixed(2)}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px' }}>
                <div style={{ width: `${Math.min(100, (biomarker.log2_fc / 5) * 100)}%`, height: '100%', background: 'var(--indigo-500)', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Specificity Index (w=0.15)</span>
                <span className="mono" style={{ color: 'var(--emerald-400)', fontWeight: 600 }}>{(biomarker.specificity * 100).toFixed(1)}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px' }}>
                <div style={{ width: `${biomarker.specificity * 100}%`, height: '100%', background: 'var(--emerald-500)', borderRadius: '3px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>FDR Significance (w=0.20)</span>
                <span className="mono" style={{ color: 'var(--amber-400)', fontWeight: 600 }}>P-adj: {biomarker.p_value_adj.toExponential(2)}</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px' }}>
                <div style={{ width: '95%', height: '100%', background: 'var(--amber-500)', borderRadius: '3px' }} />
              </div>
            </div>

            <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                <CheckCircle2 size={14} color="var(--emerald-400)" />
                <span>{biomarker.validation_status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              navigator.clipboard.writeText(`${biomarker.gene_symbol} (AUC: ${biomarker.roc_auc}, FC: ${biomarker.log2_fc}, Score: ${biomarker.composite_score})`);
              alert(`Copied biomarker metadata for ${biomarker.gene_symbol} to clipboard!`);
            }}
          >
            Copy Citation
          </button>
        </div>
      </div>
    </div>
  );
};
