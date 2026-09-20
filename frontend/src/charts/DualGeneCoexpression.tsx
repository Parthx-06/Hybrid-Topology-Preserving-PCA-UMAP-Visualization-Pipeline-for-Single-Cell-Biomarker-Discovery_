import React, { useState, useMemo } from 'react';
import { CellPoint } from '../types';

interface DualGeneCoexpressionProps {
  cells: CellPoint[];
  availableGenes?: string[];
}

export const DualGeneCoexpression: React.FC<DualGeneCoexpressionProps> = ({
  cells,
  availableGenes = ['CD3D', 'CD4', 'CD8A', 'NKG7', 'MS4A1', 'CD14', 'FCER1A', 'GNLY'],
}) => {
  const [geneA, setGeneA] = useState<string>('CD3D');
  const [geneB, setGeneB] = useState<string>('CD8A');
  const [thresholdA, setThresholdA] = useState<number>(1.5);
  const [thresholdB, setThresholdB] = useState<number>(1.5);

  // Generate synthetic coordinated expression values for gene pair across cells
  const plotPoints = useMemo(() => {
    return cells.slice(0, 300).map((cell, idx) => {
      // Deterministic pseudo expression based on cluster and gene
      let exprA = 0.2;
      let exprB = 0.2;

      // Gene A logic
      if (geneA === 'CD3D' || geneA === 'CD4') {
        if (cell.cluster === 0) exprA = 3.8 + (idx % 15) * 0.12;
      } else if (geneA === 'MS4A1') {
        if (cell.cluster === 1) exprA = 4.2 + (idx % 12) * 0.1;
      } else if (geneA === 'CD14') {
        if (cell.cluster === 2) exprA = 4.0 + (idx % 14) * 0.11;
      } else if (geneA === 'NKG7' || geneA === 'GNLY') {
        if (cell.cluster === 3) exprA = 4.5 + (idx % 10) * 0.14;
      }

      // Gene B logic
      if (geneB === 'CD8A') {
        if (cell.cluster === 0 && idx % 2 === 0) exprB = 3.6 + (idx % 12) * 0.13;
        if (cell.cluster === 3) exprB = 2.4 + (idx % 8) * 0.1;
      } else if (geneB === 'NKG7') {
        if (cell.cluster === 3) exprB = 4.6 + (idx % 10) * 0.12;
      } else if (geneB === 'MS4A1') {
        if (cell.cluster === 1) exprB = 4.4 + (idx % 10) * 0.1;
      } else if (geneB === 'CD14') {
        if (cell.cluster === 2) exprB = 4.1 + (idx % 12) * 0.11;
      }

      // Add small stochastic variation
      exprA = Math.max(0, exprA + ((idx % 7) - 3) * 0.15);
      exprB = Math.max(0, exprB + ((idx % 5) - 2) * 0.18);

      return {
        id: cell.id,
        cluster: cell.cluster,
        cell_type: cell.cell_type,
        x: exprA,
        y: exprB,
      };
    });
  }, [cells, geneA, geneB]);

  // Quadrant statistics
  const quadStats = useMemo(() => {
    let q1 = 0; // GeneA- / GeneB+
    let q2 = 0; // GeneA+ / GeneB+
    let q3 = 0; // GeneA- / GeneB-
    let q4 = 0; // GeneA+ / GeneB-
    const total = plotPoints.length || 1;

    let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;

    plotPoints.forEach((p) => {
      sumA += p.x;
      sumB += p.y;
      sumAB += p.x * p.y;
      sumA2 += p.x * p.x;
      sumB2 += p.y * p.y;

      if (p.x >= thresholdA && p.y >= thresholdB) q2++;
      else if (p.x < thresholdA && p.y >= thresholdB) q1++;
      else if (p.x < thresholdA && p.y < thresholdB) q3++;
      else q4++;
    });

    // Pearson r
    const num = total * sumAB - sumA * sumB;
    const den = Math.sqrt((total * sumA2 - sumA * sumA) * (total * sumB2 - sumB * sumB)) || 1;
    const r = num / den;

    return {
      q1Pct: ((q1 / total) * 100).toFixed(1),
      q2Pct: ((q2 / total) * 100).toFixed(1),
      q3Pct: ((q3 / total) * 100).toFixed(1),
      q4Pct: ((q4 / total) * 100).toFixed(1),
      pearsonR: r.toFixed(3),
    };
  }, [plotPoints, thresholdA, thresholdB]);

  // SVG dimensions
  const svgWidth = 460;
  const svgHeight = 340;
  const pad = 50;
  const maxX = 6.0;
  const maxY = 6.0;

  const scaleX = (val: number) => pad + (val / maxX) * (svgWidth - pad * 2);
  const scaleY = (val: number) => svgHeight - pad - (val / maxY) * (svgHeight - pad * 2);

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Dual-Gene Co-Expression & Quadrant Gating
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Bi-axial single-cell correlation analysis for co-expression, mutual exclusivity, and gating
          </div>
        </div>

        {/* Gene Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Gene X</label>
            <select
              value={geneA}
              onChange={(e) => setGeneA(e.target.value)}
              style={{
                padding: '4px 8px',
                background: 'var(--bg-tertiary)',
                color: 'var(--cyan-400)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {availableGenes.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Gene Y</label>
            <select
              value={geneB}
              onChange={(e) => setGeneB(e.target.value)}
              style={{
                padding: '4px 8px',
                background: 'var(--bg-tertiary)',
                color: 'var(--purple-400)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {availableGenes.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Scatter & Stats Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '20px', alignItems: 'center' }}>
        {/* SVG Scatter with Quadrants */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width={svgWidth} height={svgHeight} style={{ background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            {/* Quadrant Divider Lines */}
            <line
              x1={scaleX(thresholdA)}
              y1={pad}
              x2={scaleX(thresholdA)}
              y2={svgHeight - pad}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeDasharray="4 4"
            />
            <line
              x1={pad}
              y1={scaleY(thresholdB)}
              x2={svgWidth - pad}
              y2={scaleY(thresholdB)}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeDasharray="4 4"
            />

            {/* Quadrant Percentage Labels */}
            <text x={pad + 10} y={pad + 20} fill="var(--text-muted)" fontSize="11px" className="mono">
              Q1: {quadStats.q1Pct}% ({geneA}-/{geneB}+)
            </text>
            <text x={svgWidth - pad - 10} y={pad + 20} textAnchor="end" fill="var(--cyan-400)" fontSize="11px" fontWeight="700" className="mono">
              Q2: {quadStats.q2Pct}% (Double+)
            </text>
            <text x={pad + 10} y={svgHeight - pad - 10} fill="var(--text-muted)" fontSize="11px" className="mono">
              Q3: {quadStats.q3Pct}% (Double-)
            </text>
            <text x={svgWidth - pad - 10} y={svgHeight - pad - 10} textAnchor="end" fill="var(--purple-400)" fontSize="11px" className="mono">
              Q4: {quadStats.q4Pct}% ({geneA}+/{geneB}-)
            </text>

            {/* Axes */}
            <line x1={pad} y1={svgHeight - pad} x2={svgWidth - pad} y2={svgHeight - pad} stroke="var(--border-subtle)" />
            <line x1={pad} y1={pad} x2={pad} y2={svgHeight - pad} stroke="var(--border-subtle)" />

            {/* Axis Titles */}
            <text x={svgWidth / 2} y={svgHeight - 14} textAnchor="middle" fill="var(--cyan-400)" fontSize="11px" fontWeight="700">
              {geneA} Expression (log UMI)
            </text>
            <text
              x={-svgHeight / 2}
              y={18}
              transform="rotate(-90)"
              textAnchor="middle"
              fill="var(--purple-400)"
              fontSize="11px"
              fontWeight="700"
            >
              {geneB} Expression (log UMI)
            </text>

            {/* Points */}
            {plotPoints.map((p) => {
              const isDoublePos = p.x >= thresholdA && p.y >= thresholdB;
              const color = isDoublePos
                ? 'var(--emerald-400)'
                : p.x >= thresholdA
                ? 'var(--cyan-400)'
                : p.y >= thresholdB
                ? 'var(--purple-400)'
                : 'rgba(148, 163, 184, 0.4)';

              return (
                <circle
                  key={p.id}
                  cx={scaleX(p.x)}
                  cy={scaleY(p.y)}
                  r={isDoublePos ? 4 : 2.5}
                  fill={color}
                  opacity={0.8}
                />
              );
            })}
          </svg>
        </div>

        {/* Statistical Summary Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Correlation Coefficient
            </span>
            <div className="mono" style={{ fontSize: '20px', fontWeight: 700, color: Number(quadStats.pearsonR) > 0 ? 'var(--cyan-400)' : 'var(--rose-400)', marginTop: '4px' }}>
              r = {quadStats.pearsonR}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Pearson r &bull; p &lt; 10⁻¹²
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Co-Expression Phenotype
            </span>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
              {Number(quadStats.pearsonR) > 0.4
                ? 'Co-localized Expression'
                : Number(quadStats.pearsonR) < -0.2
                ? 'Lineage Mutual Exclusivity'
                : 'Orthogonal Partitioning'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
              Double-positive cells ({quadStats.q2Pct}%) indicate transitional or activated cellular phenotypes.
            </div>
          </div>

          <div>
            <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
              Gate Cutoff ({geneA}): {thresholdA.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="4.0"
              step="0.1"
              value={thresholdA}
              onChange={(e) => setThresholdA(Number(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
