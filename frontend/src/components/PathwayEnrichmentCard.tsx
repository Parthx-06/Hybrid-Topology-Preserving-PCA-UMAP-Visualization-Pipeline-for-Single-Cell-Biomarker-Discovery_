import React, { useState } from 'react';
import { Layers, ExternalLink, HelpCircle } from 'lucide-react';
import { PathwayEnrichment } from '../types';

interface PathwayEnrichmentCardProps {
  pathways: PathwayEnrichment[];
  selectedClusterId: number;
  clusterName?: string;
}

export const PathwayEnrichmentCard: React.FC<PathwayEnrichmentCardProps> = ({
  pathways,
  selectedClusterId,
  clusterName = 'Active Subpopulation',
}) => {
  const [selectedPathway, setSelectedPathway] = useState<PathwayEnrichment | null>(null);

  const filteredPathways = pathways.filter(
    (p) => p.cluster_id === selectedClusterId
  );

  const displayList = filteredPathways.length > 0 ? filteredPathways : pathways.slice(0, 4);

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--indigo-400)" />
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Gene Set Enrichment Analysis (GSEA & Hallmark Pathways)
            </h3>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Overrepresentation of canonical biological pathways in Cluster {selectedClusterId} ({clusterName})
          </div>
        </div>

        <span className="badge badge-indigo" style={{ fontSize: '11px' }}>
          MSigDB v2024.1 + KEGG
        </span>
      </div>

      {/* Pathway Enrichment Bar Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {displayList.map((pw) => {
          // Calculate -log10(p_adj)
          const negLogP = Math.min(25, -Math.log10(pw.p_value_adj || 1e-15));
          const maxLogP = 25;
          const barPct = Math.min(100, (negLogP / maxLogP) * 100);

          return (
            <div
              key={pw.pathway_id}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
              }}
              onClick={() => setSelectedPathway(pw)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: pw.source === 'MSigDB Hallmark' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.15)',
                      color: pw.source === 'MSigDB Hallmark' ? 'var(--indigo-400)' : 'var(--cyan-400)',
                      fontWeight: 700,
                    }}
                  >
                    {pw.source}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {pw.pathway_name}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--emerald-400)', fontWeight: 600 }}>
                    p_adj = {pw.p_value_adj.toExponential(2)}
                  </span>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    -log₁₀(p) = {negLogP.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Progress bar representing significance */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden', marginBottom: '8px' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${barPct}%`,
                    background: 'linear-gradient(90deg, var(--indigo-500), var(--cyan-400))',
                  }}
                />
              </div>

              {/* Overlapping leading-edge genes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Enriched Leading-Edge Genes:</span>
                {pw.overlap_genes.map((g) => (
                  <span
                    key={g}
                    className="mono"
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'var(--bg-tertiary)',
                      color: 'var(--cyan-300)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
