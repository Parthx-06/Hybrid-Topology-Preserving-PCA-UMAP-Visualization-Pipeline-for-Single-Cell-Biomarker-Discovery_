import React, { useState } from 'react';
import { DotPlotItem } from '../types';

interface MarkerDotPlotProps {
  data: DotPlotItem[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export const MarkerDotPlot: React.FC<MarkerDotPlotProps> = ({
  data,
  title = 'Canonical Marker Gene Expression Across Identified Populations (DotPlot)',
  subtitle = 'Dot size represents percentage of cells expressing the gene; Color intensity represents mean expression level.',
  height = 360,
}) => {
  const [hoveredCell, setHoveredCell] = useState<{
    gene: string;
    cluster: string;
    fraction: number;
    mean: number;
    x: number;
    y: number;
  } | null>(null);

  if (!data || data.length === 0) {
    return <div className="glass-card" style={{ padding: '20px' }}>No DotPlot data available.</div>;
  }

  // Extract unique clusters
  const clusters = data[0].clusters.map((c) => ({
    id: c.cluster_id,
    name: c.cluster_name,
  }));

  const genes = data.map((d) => d.gene_symbol);

  // Layout geometry
  const margin = { top: 40, right: 140, bottom: 80, left: 160 };
  const width = Math.max(700, genes.length * 48 + margin.left + margin.right);
  const rowHeight = 44;
  const colWidth = 48;
  const plotHeight = clusters.length * rowHeight;
  const svgHeight = plotHeight + margin.top + margin.bottom;

  // Max radius of dots
  const maxRadius = 14;

  // Color interpolator for mean expression: dark slate -> teal -> cyan -> vibrant fuchsia
  const getColor = (mean: number): string => {
    const norm = Math.min(1, Math.max(0, mean / 5.0));
    if (norm < 0.1) return 'rgba(100, 116, 139, 0.3)';
    if (norm < 0.35) return `rgba(20, 184, 166, ${0.4 + norm * 0.8})`;
    if (norm < 0.75) return `rgba(6, 182, 212, ${0.7 + norm * 0.3})`;
    return `rgba(236, 72, 153, ${0.85 + (norm - 0.75) * 0.6})`;
  };

  return (
    <div className="glass-card" style={{ padding: '20px', position: 'relative' }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{subtitle}</div>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <svg width={width} height={svgHeight} style={{ display: 'block', margin: '0 auto' }}>
          {/* Background grid lines */}
          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {clusters.map((c, rIdx) => (
              <line
                key={`h-${rIdx}`}
                x1={0}
                y1={rIdx * rowHeight + rowHeight / 2}
                x2={genes.length * colWidth}
                y2={rIdx * rowHeight + rowHeight / 2}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="3 3"
              />
            ))}
            {genes.map((g, cIdx) => (
              <line
                key={`v-${cIdx}`}
                x1={cIdx * colWidth + colWidth / 2}
                y1={0}
                x2={cIdx * colWidth + colWidth / 2}
                y2={plotHeight}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="3 3"
              />
            ))}

            {/* Row Labels (Cluster Names) */}
            {clusters.map((c, rIdx) => (
              <text
                key={c.id}
                x={-14}
                y={rIdx * rowHeight + rowHeight / 2 + 4}
                textAnchor="end"
                fill="var(--text-secondary)"
                fontSize="12px"
                fontWeight="600"
              >
                {c.name}
              </text>
            ))}

            {/* Column Labels (Gene Symbols) */}
            {genes.map((gene, cIdx) => (
              <text
                key={gene}
                x={cIdx * colWidth + colWidth / 2}
                y={plotHeight + 20}
                textAnchor="end"
                transform={`rotate(-45, ${cIdx * colWidth + colWidth / 2}, ${plotHeight + 20})`}
                fill="var(--text-primary)"
                fontSize="11px"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {gene}
              </text>
            ))}

            {/* Matrix of Dots */}
            {data.map((item, cIdx) => {
              return item.clusters.map((cStat, rIdx) => {
                const cx = cIdx * colWidth + colWidth / 2;
                const cy = rIdx * rowHeight + rowHeight / 2;
                // Radius proportional to sqrt of fraction
                const radius = Math.max(2, Math.sqrt(cStat.fraction_expressed) * maxRadius);
                const color = getColor(cStat.mean_expression);

                return (
                  <circle
                    key={`${item.gene_symbol}-${cStat.cluster_id}`}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={color}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth={0.75}
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredCell({
                        gene: item.gene_symbol,
                        cluster: cStat.cluster_name,
                        fraction: cStat.fraction_expressed,
                        mean: cStat.mean_expression,
                        x: cx + margin.left,
                        y: cy + margin.top,
                      });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              });
            })}
          </g>

          {/* Legends on Right Side */}
          <g transform={`translate(${margin.left + genes.length * colWidth + 24}, ${margin.top})`}>
            {/* Percent Expressed Legend */}
            <text x={0} y={10} fill="var(--text-muted)" fontSize="11px" fontWeight="700">
              % Expressed
            </text>
            {[0.1, 0.5, 1.0].map((frac, idx) => {
              const r = Math.sqrt(frac) * maxRadius;
              const y = 30 + idx * 24;
              return (
                <g key={frac}>
                  <circle cx={14} cy={y} r={r} fill="none" stroke="var(--cyan-400)" strokeWidth={1} />
                  <text x={34} y={y + 4} fill="var(--text-secondary)" fontSize="10px" className="mono">
                    {Math.round(frac * 100)}%
                  </text>
                </g>
              );
            })}

            {/* Mean Expression Color Bar */}
            <text x={0} y={120} fill="var(--text-muted)" fontSize="11px" fontWeight="700">
              Mean Expression
            </text>
            <defs>
              <linearGradient id="dotPlotGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(100, 116, 139, 0.4)" />
                <stop offset="35%" stopColor="rgba(20, 184, 166, 0.8)" />
                <stop offset="70%" stopColor="rgba(6, 182, 212, 1)" />
                <stop offset="100%" stopColor="rgba(236, 72, 153, 1)" />
              </linearGradient>
            </defs>
            <rect x={10} y={135} width={12} height={60} fill="url(#dotPlotGradient)" rx={2} />
            <text x={28} y={142} fill="var(--text-secondary)" fontSize="10px" className="mono">
              High (5.0)
            </text>
            <text x={28} y={192} fill="var(--text-secondary)" fontSize="10px" className="mono">
              Low (0.0)
            </text>
          </g>
        </svg>
      </div>

      {/* Interactive Tooltip */}
      {hoveredCell && (
        <div
          style={{
            position: 'absolute',
            left: hoveredCell.x + 10,
            top: hoveredCell.y - 45,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid var(--border-glow)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div style={{ fontWeight: 700, color: 'var(--cyan-400)' }}>
            {hoveredCell.gene} &bull; {hoveredCell.cluster}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Expressed in: <strong style={{ color: '#fff' }}>{(hoveredCell.fraction * 100).toFixed(1)}%</strong> of cells
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            Mean Expression: <strong style={{ color: 'var(--emerald-400)' }}>{hoveredCell.mean.toFixed(2)}</strong> log(UMI)
          </div>
        </div>
      )}
    </div>
  );
};
