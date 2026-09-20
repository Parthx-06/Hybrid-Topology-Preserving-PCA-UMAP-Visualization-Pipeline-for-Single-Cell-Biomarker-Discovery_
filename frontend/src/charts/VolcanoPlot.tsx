import React, { useState } from 'react';
import { VOLCANO_GENES, VolcanoGeneItem } from '../services/mockData';

interface VolcanoPlotProps {
  onSelectGene?: (gene: string) => void;
  selectedGene?: string | null;
}

export const VolcanoPlot: React.FC<VolcanoPlotProps> = ({
  onSelectGene,
  selectedGene,
}) => {
  const [log2fcCutoff, setLog2fcCutoff] = useState(1.5);
  const [hoveredGene, setHoveredGene] = useState<{
    gene: string;
    log2fc: number;
    pvalue: number;
    x: number;
    y: number;
  } | null>(null);

  // SVG Coordinate mapping
  const width = 600;
  const height = 340;
  const pad = 45;

  const minFC = -2.5;
  const maxFC = 5.0;
  const maxNegLogP = 60; // -log10(1e-60)

  const toScreenX = (fc: number) =>
    pad + ((fc - minFC) / (maxFC - minFC)) * (width - pad * 2);
  const toScreenY = (negLogP: number) =>
    height - pad - (Math.min(negLogP, maxNegLogP) / maxNegLogP) * (height - pad * 2);

  return (
    <div className="glass-card" style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Differential Expression Volcano Plot
          </h4>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Significance (-log₁₀ P-adj) vs Magnitude (log₂ Fold Change)
          </div>
        </div>

        {/* FC Cutoff slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          <span style={{ color: 'var(--text-muted)' }}>|log₂FC| ≥</span>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.25"
            value={log2fcCutoff}
            onChange={(e) => setLog2fcCutoff(parseFloat(e.target.value))}
            style={{ width: '80px', accentColor: 'var(--cyan-500)' }}
          />
          <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>{log2fcCutoff}</span>
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', background: '#070a12', borderRadius: '8px' }}
        >
          {/* Grid lines */}
          <line
            x1={toScreenX(0)}
            y1={pad}
            x2={toScreenX(0)}
            y2={height - pad}
            stroke="rgba(255,255,255,0.15)"
            strokeDasharray="4 4"
          />
          <line
            x1={toScreenX(log2fcCutoff)}
            y1={pad}
            x2={toScreenX(log2fcCutoff)}
            y2={height - pad}
            stroke="rgba(6, 182, 212, 0.4)"
            strokeDasharray="3 3"
          />
          <line
            x1={toScreenX(-log2fcCutoff)}
            y1={pad}
            x2={toScreenX(-log2fcCutoff)}
            y2={height - pad}
            stroke="rgba(244, 63, 94, 0.4)"
            strokeDasharray="3 3"
          />

          {/* Axes */}
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(255,255,255,0.2)" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="rgba(255,255,255,0.2)" />

          {/* Axis Labels */}
          <text x={width / 2} y={height - 12} fill="#94a3b8" fontSize="11" textAnchor="middle">
            log₂ Fold Change
          </text>
          <text
            x={15}
            y={height / 2}
            fill="#94a3b8"
            fontSize="11"
            textAnchor="middle"
            transform={`rotate(-90 15 ${height / 2})`}
          >
            -log₁₀(P-adj)
          </text>

          {/* Points */}
          {VOLCANO_GENES.map((g: VolcanoGeneItem) => {
            const negLogP = -Math.log10(Math.max(g.pvalue_adj, 1e-58));
            const sx = toScreenX(g.log2fc);
            const sy = toScreenY(negLogP);
            const isSignificant = g.log2fc >= log2fcCutoff && negLogP >= 1.3;
            const isDown = g.log2fc <= -log2fcCutoff && negLogP >= 1.3;
            const isSelected = selectedGene === g.gene;

            let fill = '#475569';
            if (isSignificant) fill = '#06b6d4';
            if (isDown) fill = '#f43f5e';
            if (isSelected) fill = '#fbbf24';

            return (
              <g key={g.gene}>
                <circle
                  cx={sx}
                  cy={sy}
                  r={isSelected ? 7 : isSignificant ? 5 : 3.5}
                  fill={fill}
                  opacity={isSignificant || isDown ? 0.9 : 0.4}
                  stroke={isSelected ? '#ffffff' : 'none'}
                  strokeWidth="2"
                  style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={() =>
                    setHoveredGene({
                      gene: g.gene,
                      log2fc: g.log2fc,
                      pvalue: g.pvalue_adj,
                      x: sx,
                      y: sy,
                    })
                  }
                  onMouseLeave={() => setHoveredGene(null)}
                  onClick={() => onSelectGene && onSelectGene(g.gene)}
                />
                {/* Labels for high-ranking candidate markers */}
                {isSignificant && g.is_marker && (
                  <text
                    x={sx + 6}
                    y={sy - 4}
                    fill="#e2e8f0"
                    fontSize="10"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {g.gene}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredGene && (
          <div
            className="plot-tooltip"
            style={{
              position: 'absolute',
              left: `${hoveredGene.x + 10}px`,
              top: `${hoveredGene.y - 15}px`,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--cyan-400)' }}>{hoveredGene.gene}</div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
              log₂FC: <strong>{hoveredGene.log2fc.toFixed(2)}</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
              P-adj: <strong>{hoveredGene.pvalue.toExponential(2)}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
