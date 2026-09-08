import React, { useRef, useEffect, useState } from 'react';
import { CellPoint } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Eye } from 'lucide-react';

interface EmbeddingScatterProps {
  cells: CellPoint[];
  title: string;
  colorBy: 'cluster' | 'batch' | 'condition' | 'gene';
  geneName?: string;
  height?: number;
  highlightCluster?: number | null;
  onSelectCluster?: (clusterId: number | null) => void;
}

const CLUSTER_COLORS = [
  '#06b6d4', // Cyan (T cells)
  '#a855f7', // Purple (B cells)
  '#10b981', // Emerald (Monocytes)
  '#f59e0b', // Amber (NK cells)
  '#ec4899', // Pink (Dendritic cells)
  '#3b82f6', // Blue
  '#6366f1', // Indigo
];

const BATCH_COLORS: Record<string, string> = {
  Batch_A: '#38bdf8',
  Batch_B: '#f43f5e',
  Batch_C: '#34d399',
};

const CONDITION_COLORS: Record<string, string> = {
  Control: '#06b6d4',
  Stimulated: '#f97316',
};

export const EmbeddingScatter: React.FC<EmbeddingScatterProps> = ({
  cells,
  title,
  colorBy,
  geneName,
  height = 420,
  highlightCluster = null,
  onSelectCluster,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{
    cell: CellPoint;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Compute bounding box
  const bounds = React.useMemo(() => {
    if (!cells.length) return { minX: -10, maxX: 10, minY: -10, maxY: 10 };
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    for (const c of cells) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    }
    const padX = (maxX - minX) * 0.1 || 1;
    const padY = (maxY - minY) * 0.1 || 1;
    return {
      minX: minX - padX,
      maxX: maxX + padX,
      minY: minY - padY,
      maxY: maxY + padY,
    };
  }, [cells]);

  // Transform data point to canvas coordinate
  const project = (x: number, y: number, width: number, h: number) => {
    const normX = (x - bounds.minX) / (bounds.maxX - bounds.minX);
    const normY = 1 - (y - bounds.minY) / (bounds.maxY - bounds.minY); // Flip Y

    const cx = width / 2;
    const cy = h / 2;

    const px = (normX * width - cx) * scale + cx + offset.x;
    const py = (normY * h - cy) * scale + cy + offset.y;
    return { px, py };
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, h);

    // Subtle coordinate grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw cells
    for (const cell of cells) {
      const { px, py } = project(cell.x, cell.y, width, h);

      // Check if within view
      if (px < -10 || px > width + 10 || py < -10 || py > h + 10) continue;

      let color = '#06b6d4';
      let opacity = 0.8;

      if (highlightCluster !== null && highlightCluster !== undefined) {
        opacity = cell.cluster === highlightCluster ? 0.95 : 0.15;
      }

      if (colorBy === 'cluster') {
        color = CLUSTER_COLORS[cell.cluster % CLUSTER_COLORS.length];
      } else if (colorBy === 'batch') {
        color = BATCH_COLORS[cell.batch] || '#38bdf8';
      } else if (colorBy === 'condition') {
        color = CONDITION_COLORS[cell.condition] || '#06b6d4';
      } else if (colorBy === 'gene') {
        // Mock continuous expression based on cluster markers
        let expr = 0.1;
        if (cell.cluster === 0 && (geneName === 'CD3D' || geneName === 'CD4')) expr = 0.95;
        if (cell.cluster === 1 && (geneName === 'CD19' || geneName === 'MS4A1')) expr = 0.95;
        if (cell.cluster === 2 && (geneName === 'CD14' || geneName === 'LYZ')) expr = 0.95;
        if (cell.cluster === 3 && (geneName === 'NKG7' || geneName === 'GNLY')) expr = 0.95;
        if (cell.cluster === 4 && (geneName === 'FCER1A' || geneName === 'CLEC10A')) expr = 0.95;
        color = `rgb(${Math.round(6 + expr * 240)}, ${Math.round(182 - expr * 50)}, ${Math.round(212 + expr * 40)})`;
      }

      ctx.fillStyle = color;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(px, py, scale > 1.5 ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  }, [cells, scale, offset, highlightCluster, colorBy, geneName, bounds]);

  // Handle canvas mouse events (Pan, Zoom, Tooltip)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Hover search (nearest cell)
    let closestCell: CellPoint | null = null;
    let minDist = 14; // pixels radius

    for (const c of cells) {
      const { px, py } = project(c.x, c.y, rect.width, rect.height);
      const dist = Math.hypot(px - mouseX, py - mouseY);
      if (dist < minDist) {
        minDist = dist;
        closestCell = c;
      }
    }

    if (closestCell) {
      setHoveredCell({
        cell: closestCell,
        screenX: mouseX,
        screenY: mouseY,
      });
    } else {
      setHoveredCell(null);
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleZoom = (factor: number) => {
    setScale((prev) => Math.min(Math.max(prev * factor, 0.5), 5.0));
  };

  const handleReset = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    if (onSelectCluster) onSelectCluster(null);
  };

  return (
    <div className="glass-card" style={{ padding: '16px', position: 'relative' }} ref={containerRef}>
      {/* Title Bar & Canvas Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {title}
          </h4>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            N = {cells.length.toLocaleString()} cells &bull; Color: {colorBy}
          </div>
        </div>

        {/* Zoom & Reset Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            className="btn btn-outline"
            style={{ padding: '5px 8px', borderRadius: '6px' }}
            onClick={() => handleZoom(1.25)}
            title="Zoom In"
          >
            <ZoomIn size={13} />
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: '5px 8px', borderRadius: '6px' }}
            onClick={() => handleZoom(0.8)}
            title="Zoom Out"
          >
            <ZoomOut size={13} />
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: '5px 8px', borderRadius: '6px' }}
            onClick={handleReset}
            title="Reset View"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Canvas Plot */}
      <div className="plot-canvas-wrapper" style={{ height: `${height}px` }}>
        <canvas
          ref={canvasRef}
          width={640}
          height={height}
          style={{ width: '100%', height: '100%', display: 'block', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            setIsDragging(false);
            setHoveredCell(null);
          }}
        />

        {/* Hover Tooltip */}
        {hoveredCell && (
          <div
            className="plot-tooltip"
            style={{
              left: `${hoveredCell.screenX + 12}px`,
              top: `${hoveredCell.screenY - 12}px`,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--cyan-400)', fontSize: '12px' }}>
              {hoveredCell.cell.id}
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>
              Type: <strong>{hoveredCell.cell.cell_type}</strong> (Cl {hoveredCell.cell.cluster})
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Batch: {hoveredCell.cell.batch} &bull; {hoveredCell.cell.condition}
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
              Coords: ({hoveredCell.cell.x}, {hoveredCell.cell.y})
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          marginTop: '12px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
        }}
      >
        {colorBy === 'cluster' &&
          ['T Cells (0)', 'B Cells (1)', 'Monocytes (2)', 'NK Cells (3)', 'Dendritic (4)'].map((name, idx) => (
            <div
              key={idx}
              onClick={() => onSelectCluster && onSelectCluster(highlightCluster === idx ? null : idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                opacity: highlightCluster === null || highlightCluster === idx ? 1 : 0.35,
                transition: 'opacity 0.2s',
              }}
            >
              <div
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: CLUSTER_COLORS[idx % CLUSTER_COLORS.length],
                }}
              />
              <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
            </div>
          ))}
      </div>
    </div>
  );
};
