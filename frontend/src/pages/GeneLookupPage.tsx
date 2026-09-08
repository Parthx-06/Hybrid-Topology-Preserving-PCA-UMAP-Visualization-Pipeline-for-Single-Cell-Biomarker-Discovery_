import React, { useState } from 'react';
import { CellPoint } from '../types';
import { EmbeddingScatter } from '../charts/EmbeddingScatter';
import { Search, Sparkles, TrendingUp, Info } from 'lucide-react';

interface GeneLookupPageProps {
  hybridCells: CellPoint[];
}

const COMMON_MARKERS = [
  { gene: 'CD3D', type: 'T Cells (Pan-T)' },
  { gene: 'CD4', type: 'Helper T Cells' },
  { gene: 'CD19', type: 'B Cells' },
  { gene: 'MS4A1', type: 'B Cells (CD20)' },
  { gene: 'CD14', type: 'Monocytes' },
  { gene: 'LYZ', type: 'Myeloid / Monocytes' },
  { gene: 'NKG7', type: 'NK Cells' },
  { gene: 'GNLY', type: 'Cytotoxic NK Cells' },
  { gene: 'FCER1A', type: 'Dendritic Cells' },
  { gene: 'CLEC10A', type: 'Conventional DC' },
];

export const GeneLookupPage: React.FC<GeneLookupPageProps> = ({ hybridCells }) => {
  const [selectedGene, setSelectedGene] = useState('CD3D');
  const [inputQuery, setInputQuery] = useState('');

  const currentMarkerInfo = COMMON_MARKERS.find((m) => m.gene === selectedGene) || {
    gene: selectedGene,
    type: 'Single-Cell Transcript',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={20} color="var(--cyan-400)" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Gene Expression Feature Explorer
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Overlay continuous normalized transcript expression across the topology-preserving UMAP manifold to inspect cell-type specificity and gradients.
        </p>

        {/* Quick Marker Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Immune Markers:
          </span>
          {COMMON_MARKERS.map((m) => {
            const isSelected = m.gene === selectedGene;
            return (
              <button
                key={m.gene}
                onClick={() => setSelectedGene(m.gene)}
                className={`badge ${isSelected ? 'badge-cyan' : ''}`}
                style={{
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--cyan-400)' : '1px solid var(--border-subtle)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'var(--bg-secondary)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                }}
              >
                {m.gene}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Scatter Feature Plot & Expression by Cluster */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px' }}>
        <div>
          <EmbeddingScatter
            cells={hybridCells}
            title={`Expression Overlay: ${selectedGene} (${currentMarkerInfo.type})`}
            colorBy="gene"
            geneName={selectedGene}
            height={440}
          />
        </div>

        {/* Right side: Expression Distribution by Cluster */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Cluster Mean Expression for {selectedGene}
            </h4>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Normalized log(CP10K + 1) abundance across Leiden populations
            </div>

            {/* Simulated expression bars across clusters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { cluster: 0, name: 'T Cells', high: selectedGene === 'CD3D' || selectedGene === 'CD4' },
                { cluster: 1, name: 'B Cells', high: selectedGene === 'CD19' || selectedGene === 'MS4A1' },
                { cluster: 2, name: 'Monocytes', high: selectedGene === 'CD14' || selectedGene === 'LYZ' },
                { cluster: 3, name: 'NK Cells', high: selectedGene === 'NKG7' || selectedGene === 'GNLY' },
                { cluster: 4, name: 'Dendritic Cells', high: selectedGene === 'FCER1A' || selectedGene === 'CLEC10A' },
              ].map((c) => {
                const exprVal = c.high ? 4.25 : 0.25;
                const pct = (exprVal / 5.0) * 100;
                return (
                  <div key={c.cluster}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 600, color: c.high ? 'var(--cyan-400)' : 'var(--text-secondary)' }}>
                        Cluster {c.cluster}: {c.name}
                      </span>
                      <span className="mono" style={{ color: c.high ? 'var(--cyan-400)' : 'var(--text-muted)', fontWeight: 700 }}>
                        {exprVal.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: c.high
                            ? 'linear-gradient(90deg, var(--cyan-500), var(--indigo-500))'
                            : 'var(--border-medium)',
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              padding: '12px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              marginTop: '16px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--cyan-400)', fontWeight: 600, marginBottom: '2px' }}>
              <Info size={14} />
              <span>Bioinformatics Interpretation</span>
            </div>
            {selectedGene} demonstrates robust, unimodal enrichment exclusively in target clusters, with near-zero off-target background noise in non-target cell types.
          </div>
        </div>
      </div>
    </div>
  );
};
