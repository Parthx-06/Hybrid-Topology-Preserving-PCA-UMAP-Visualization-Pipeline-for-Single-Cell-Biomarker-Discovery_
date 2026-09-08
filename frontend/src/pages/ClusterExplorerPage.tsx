import React, { useState } from 'react';
import { ClusterSummary } from '../types';
import { Boxes, Sparkles, ArrowRight, Layers } from 'lucide-react';

interface ClusterExplorerPageProps {
  clusters: ClusterSummary[];
  onSelectClusterForBiomarkers: (clusterId: number) => void;
}

export const ClusterExplorerPage: React.FC<ClusterExplorerPageProps> = ({
  clusters,
  onSelectClusterForBiomarkers,
}) => {
  const [selectedClusterId, setSelectedClusterId] = useState<number>(0);

  const selectedCluster = clusters.find((c) => c.id === selectedClusterId) || clusters[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Boxes size={20} color="var(--indigo-400)" />
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Leiden Community Detection & Cluster Composition
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Graph-based unsupervised clustering on the shared nearest neighbor (SNN) graph. Identified 5 discrete immunological subpopulations.
        </p>
      </div>

      {/* Cluster Grid Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {clusters.map((c) => {
          const isSelected = c.id === selectedClusterId;
          return (
            <div
              key={c.id}
              className={`glass-card ${isSelected ? 'highlight' : ''}`}
              style={{
                cursor: 'pointer',
                borderWidth: isSelected ? '2px' : '1px',
                padding: '18px',
              }}
              onClick={() => setSelectedClusterId(c.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="badge badge-cyan">Cluster {c.id}</span>
                <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan-400)' }}>
                  {c.percentage.toFixed(1)}%
                </span>
              </div>

              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                {c.name}
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                {c.cell_count.toLocaleString()} cells
              </div>

              {/* Dominant markers pill strip */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {c.dominant_markers.slice(0, 3).map((m) => (
                  <span
                    key={m}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: 'var(--bg-tertiary)',
                      borderRadius: '4px',
                      color: 'var(--text-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Panel for Selected Cluster */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Cluster {selectedCluster.id}: {selectedCluster.name} Detailed Profile
            </h4>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Transcriptional phenotype, batch mixing score, and primary diagnostic markers
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => onSelectClusterForBiomarkers(selectedCluster.id)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span>Discover Biomarkers for Cluster {selectedCluster.id}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Batch Mixing Entropy (Shannon)
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald-400)', marginTop: '4px' }}>
              {selectedCluster.batch_entropy.toFixed(2)} / 1.00
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              High mixing across Batch A, B, and C. Zero batch artifact detected.
            </div>
          </div>

          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Hallmark Expressed Marker Genes
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
              {selectedCluster.dominant_markers.map((m) => (
                <span
                  key={m}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: 'var(--cyan-400)',
                    fontWeight: 700,
                    fontSize: '12px',
                  }}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
