import React, { useState } from 'react';
import { BiomarkerItem, PathwayEnrichment } from '../types';
import { VolcanoPlot } from '../charts/VolcanoPlot';
import { BiomarkerModal } from '../components/BiomarkerModal';
import { PathwayEnrichmentCard } from '../components/PathwayEnrichmentCard';
import { Dna, Search, Download, Filter, HelpCircle, Pill, ShieldCheck, Layers } from 'lucide-react';
import { PATHWAY_ENRICHMENT_DATA } from '../services/mockData';

interface BiomarkerDiscoveryPageProps {
  biomarkers: BiomarkerItem[];
  pathways?: PathwayEnrichment[];
  initialClusterId?: number | null;
}

export const BiomarkerDiscoveryPage: React.FC<BiomarkerDiscoveryPageProps> = ({
  biomarkers,
  pathways = PATHWAY_ENRICHMENT_DATA,
  initialClusterId = null,
}) => {
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<string>(
    initialClusterId !== null && initialClusterId !== undefined ? String(initialClusterId) : 'all'
  );
  const [minAuc, setMinAuc] = useState<number>(0.85);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [selectedBiomarker, setSelectedBiomarker] = useState<BiomarkerItem | null>(null);
  const [sortField, setSortField] = useState<'composite_score' | 'roc_auc' | 'log2_fc'>('composite_score');

  // Filter & Sort
  const filtered = biomarkers
    .filter((b) => {
      if (selectedClusterFilter !== 'all' && String(b.cluster_id) !== selectedClusterFilter) {
        return false;
      }
      if (tierFilter !== 'all' && b.prioritization_category !== tierFilter) {
        return false;
      }
      if (b.roc_auc < minAuc) return false;
      if (searchQuery && !b.gene_symbol.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => b[sortField] - a[sortField]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Gene_Symbol',
      'Cluster_ID',
      'Cluster_Name',
      'Rank',
      'Composite_Score',
      'Log2_FC',
      'Adj_P_Value',
      'ROC_AUC',
      'Specificity',
      'Prioritization_Tier',
      'Drug_Target_Class',
      'Approved_Drugs',
      'Clinical_Phase',
    ];
    const rows = filtered.map((b) => [
      b.gene_symbol,
      b.cluster_id,
      `"${b.cluster_name || `Cluster ${b.cluster_id}`}"`,
      b.rank,
      b.composite_score,
      b.log2_fc,
      b.p_value_adj,
      b.roc_auc,
      b.specificity,
      b.prioritization_category,
      `"${b.druggability?.target_class || 'N/A'}"`,
      `"${b.druggability?.approved_drugs?.join('; ') || 'Investigational'}"`,
      `"${b.druggability?.clinical_phase || 'Preclinical'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CellMap_Biomarker_Dossier_${selectedClusterFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeClusterId = selectedClusterFilter !== 'all' ? Number(selectedClusterFilter) : 0;
  const activeClusterName = biomarkers.find((b) => b.cluster_id === activeClusterId)?.cluster_name || `Cluster ${activeClusterId}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Dna size={20} color="var(--cyan-400)" />
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Multi-Criteria Single-Cell Biomarker Discovery &amp; Therapeutic Targetability
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Composite prioritization integrating Wilcoxon effect size, Benjamini-Hochberg FDR, cluster specificity, classification ROC-AUC, and DGIdb drug targetability.
            </p>
          </div>

          <button
            id="btn-export-biomarkers-csv"
            className="btn btn-primary"
            onClick={handleExportCSV}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Export Clinical Biomarker Dossier (CSV)</span>
          </button>
        </div>
      </div>

      {/* Differential Expression Volcano Plot */}
      <VolcanoPlot
        onSelectGene={(gene) => {
          const match = biomarkers.find((b) => b.gene_symbol === gene);
          if (match) setSelectedBiomarker(match);
        }}
        selectedGene={selectedBiomarker?.gene_symbol}
      />

      {/* Gene Set Enrichment Analysis (GSEA) for Active Cluster */}
      <PathwayEnrichmentCard
        pathways={pathways}
        selectedClusterId={activeClusterId}
        clusterName={activeClusterName}
      />

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Gene Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              className="form-input"
              placeholder="Search candidate gene symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          {/* Cluster filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Population:</span>
            <select
              className="form-select"
              value={selectedClusterFilter}
              onChange={(e) => setSelectedClusterFilter(e.target.value)}
            >
              <option value="all">All Populations</option>
              <option value="0">Cluster 0</option>
              <option value="1">Cluster 1</option>
              <option value="2">Cluster 2</option>
              <option value="3">Cluster 3</option>
              <option value="4">Cluster 4</option>
            </select>
          </div>

          {/* Tier Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tier:</span>
            <select
              className="form-select"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="all">All Tiers</option>
              <option value="Tier 1">Tier 1 (High Confidence)</option>
              <option value="Tier 2">Tier 2 (Emerging Candidate)</option>
              <option value="Tier 3">Tier 3 (Discovery)</option>
            </select>
          </div>

          {/* Min AUC Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Min ROC-AUC:</span>
            <input
              type="range"
              min="0.70"
              max="0.98"
              step="0.02"
              value={minAuc}
              onChange={(e) => setMinAuc(parseFloat(e.target.value))}
              style={{ width: '90px', accentColor: 'var(--cyan-500)' }}
            />
            <span className="mono" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyan-400)' }}>
              {minAuc.toFixed(2)}
            </span>
          </div>

          {/* Sorting */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sort:</span>
            <select
              className="form-select"
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
            >
              <option value="composite_score">Composite Score</option>
              <option value="roc_auc">ROC-AUC</option>
              <option value="log2_fc">Log2 Fold Change</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ranked Biomarkers Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Ranked Candidate Biomarkers ({filtered.length} Genes Evaluated)
          </h4>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Click any row to open the complete Target Dossier &amp; ROC Curve
          </span>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Gene Symbol</th>
                <th>Target Population</th>
                <th>Rank</th>
                <th>Composite Score</th>
                <th>log₂ Fold Change</th>
                <th>Adj P-Value (BH)</th>
                <th>ROC-AUC</th>
                <th>Specificity</th>
                <th>Druggability &amp; Clinical Phase</th>
                <th>Prioritization Tier</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr
                  key={`${b.gene_symbol}-${b.cluster_id}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedBiomarker(b)}
                >
                  <td style={{ fontWeight: 700, color: 'var(--cyan-400)', fontFamily: 'var(--font-mono)' }}>
                    {b.gene_symbol}
                  </td>
                  <td>
                    <span className="badge badge-indigo">
                      {b.cluster_name || `Cluster ${b.cluster_id}`}
                    </span>
                  </td>
                  <td className="mono">#{b.rank}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="mono" style={{ fontWeight: 700 }}>
                        {b.composite_score.toFixed(3)}
                      </span>
                      <div style={{ width: '50px', height: '5px', background: 'var(--bg-tertiary)', borderRadius: '3px' }}>
                        <div
                          style={{
                            width: `${b.composite_score * 100}%`,
                            height: '100%',
                            background: 'var(--cyan-500)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="mono">+{b.log2_fc.toFixed(2)}</td>
                  <td className="mono">{b.p_value_adj.toExponential(2)}</td>
                  <td>
                    <span
                      style={{
                        color: b.roc_auc >= 0.95 ? 'var(--emerald-400)' : 'var(--text-primary)',
                        fontWeight: 700,
                      }}
                      className="mono"
                    >
                      {b.roc_auc.toFixed(3)}
                    </span>
                  </td>
                  <td className="mono">{(b.specificity * 100).toFixed(0)}%</td>
                  <td>
                    {b.druggability ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {b.druggability.target_class}
                        </span>
                        <span style={{ fontSize: '10px', color: b.druggability.clinical_phase.includes('FDA') ? 'var(--emerald-400)' : 'var(--amber-400)' }}>
                          {b.druggability.clinical_phase}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Research Target</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        b.prioritization_category === 'Tier 1' ? 'badge-emerald' : 'badge-amber'
                      }`}
                    >
                      {b.prioritization_category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Biomarker Detail Modal */}
      <BiomarkerModal
        biomarker={selectedBiomarker}
        onClose={() => setSelectedBiomarker(null)}
      />
    </div>
  );
};
