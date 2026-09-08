import React from 'react';

interface ROCCurveProps {
  geneSymbol: string;
  auc: number;
  clusterName?: string;
  specificity?: number;
}

export const ROCCurve: React.FC<ROCCurveProps> = ({
  geneSymbol,
  auc,
  clusterName = 'Target Cluster',
  specificity = 0.92,
}) => {
  const width = 280;
  const height = 240;
  const pad = 35;

  // Generate synthetic smooth curve based on AUC
  // A curve that starts at (0,0) and arches up to (1,1) with integral equal to AUC
  const points: { x: number; y: number }[] = [];
  const power = Math.max(0.1, (1 - auc) / auc); // steeper for higher AUC

  for (let i = 0; i <= 20; i++) {
    const fpr = i / 20; // 1 - specificity
    const tpr = Math.min(1.0, Math.pow(fpr, power));
    points.push({
      x: pad + fpr * (width - pad * 2),
      y: height - pad - tpr * (height - pad * 2),
    });
  }

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <div style={{ background: '#080c16', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            ROC Curve: <span style={{ color: 'var(--cyan-400)' }}>{geneSymbol}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            vs {clusterName}
          </div>
        </div>
        <div
          style={{
            padding: '3px 8px',
            background: 'rgba(6, 182, 212, 0.15)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 800,
            color: 'var(--cyan-400)',
          }}
        >
          AUC = {auc.toFixed(3)}
        </div>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {/* Diagonal chance line */}
        <line
          x1={pad}
          y1={height - pad}
          x2={width - pad}
          y2={pad}
          stroke="rgba(255,255,255,0.2)"
          strokeDasharray="3 3"
        />

        {/* Axes */}
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(255,255,255,0.3)" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="rgba(255,255,255,0.3)" />

        {/* Labels */}
        <text x={width / 2} y={height - 6} fill="#94a3b8" fontSize="10" textAnchor="middle">
          False Positive Rate (1 - Specificity)
        </text>
        <text
          x={10}
          y={height / 2}
          fill="#94a3b8"
          fontSize="10"
          textAnchor="middle"
          transform={`rotate(-90 10 ${height / 2})`}
        >
          True Positive Rate (Sensitivity)
        </text>

        {/* ROC Path */}
        <path d={pathD} fill="none" stroke="#06b6d4" strokeWidth="2.5" />

        {/* Current working point */}
        <circle
          cx={pad + (1 - specificity) * (width - pad * 2)}
          cy={height - pad - Math.min(1.0, Math.pow(1 - specificity, power)) * (height - pad * 2)}
          r="4"
          fill="#fbbf24"
        />
      </svg>
    </div>
  );
};
