import React, { useState, useEffect } from 'react';
import './index.css';

import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { QualityControlPage } from './pages/QualityControlPage';
import { EmbeddingExplorerPage } from './pages/EmbeddingExplorerPage';
import { ClusterExplorerPage } from './pages/ClusterExplorerPage';
import { BiomarkerDiscoveryPage } from './pages/BiomarkerDiscoveryPage';
import { GeneLookupPage } from './pages/GeneLookupPage';
import { ProvenanceReportPage } from './pages/ProvenanceReportPage';

import {
  BIOMARKERS_DATA,
  CLUSTERS_DATA,
  EMBEDDINGS_DATA,
  INITIAL_EXPERIMENT,
  INITIAL_PIPELINE_STEPS,
  QC_METRICS,
  TOPOLOGY_BENCHMARKS,
} from './services/mockData';

function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isRunning, setIsRunning] = useState(false);
  const [biomarkerClusterId, setBiomarkerClusterId] = useState<number | null>(null);

  // Theme toggling
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleRunPipeline = () => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 3000);
  };

  const handleExportReport = () => {
    window.open('/api/v1/reports/1/html', '_blank');
  };

  const handleSelectClusterForBiomarkers = (clusterId: number) => {
    setBiomarkerClusterId(clusterId);
    setCurrentTab('biomarkers');
  };

  const handleApplyQC = (minCounts: number, minGenes: number, maxMito: number) => {
    console.log('[CellMap] QC filters applied:', { minCounts, minGenes, maxMito });
  };

  const renderPage = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <OverviewPage
            experiment={INITIAL_EXPERIMENT}
            steps={INITIAL_PIPELINE_STEPS}
            benchmarks={TOPOLOGY_BENCHMARKS}
            clusters={CLUSTERS_DATA}
            biomarkers={BIOMARKERS_DATA}
            hybridCells={EMBEDDINGS_DATA.hybrid}
            onNavigateTab={setCurrentTab}
          />
        );

      case 'qc':
        return (
          <QualityControlPage
            qc={QC_METRICS}
            onApplyQC={handleApplyQC}
          />
        );

      case 'embeddings':
        return (
          <EmbeddingExplorerPage
            hybridCells={EMBEDDINGS_DATA.hybrid}
            directCells={EMBEDDINGS_DATA.direct}
            pcaCells={EMBEDDINGS_DATA.pca}
            benchmarks={TOPOLOGY_BENCHMARKS}
          />
        );

      case 'clusters':
        return (
          <ClusterExplorerPage
            clusters={CLUSTERS_DATA}
            onSelectClusterForBiomarkers={handleSelectClusterForBiomarkers}
          />
        );

      case 'biomarkers':
        return (
          <BiomarkerDiscoveryPage
            biomarkers={BIOMARKERS_DATA}
            initialClusterId={biomarkerClusterId}
          />
        );

      case 'genes':
        return <GeneLookupPage hybridCells={EMBEDDINGS_DATA.hybrid} />;

      case 'reports':
        return <ProvenanceReportPage experiment={INITIAL_EXPERIMENT} />;

      default:
        return null;
    }
  };

  // Page titles for header breadcrumbs
  const pageTitles: Record<NavTab, string> = {
    overview: 'Pipeline Dashboard',
    qc: 'Quality Control & Filtering',
    embeddings: 'Topology-Preserving Embedding Explorer',
    clusters: 'Leiden Cell Cluster Architecture',
    biomarkers: 'Multi-Criteria Biomarker Discovery',
    genes: 'Gene Expression Feature Explorer',
    reports: 'Provenance & Reproducibility Report',
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'biomarkers') setBiomarkerClusterId(null);
          setCurrentTab(tab);
        }}
        cellCount={INITIAL_EXPERIMENT.cell_count}
      />

      {/* Main Panel */}
      <div className="main-content">
        {/* Header */}
        <Header
          experiment={INITIAL_EXPERIMENT}
          isRunning={isRunning}
          onRunPipeline={handleRunPipeline}
          onExportReport={handleExportReport}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Page Content */}
        <div className="content-body">
          {/* Breadcrumb / Page Title */}
          <div
            style={{
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-muted)',
            }}
          >
            <span>CellMap BioAnalytics</span>
            <span style={{ color: 'var(--border-medium)' }}>/</span>
            <span>Experiment #{INITIAL_EXPERIMENT.id}</span>
            <span style={{ color: 'var(--border-medium)' }}>/</span>
            <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>
              {pageTitles[currentTab]}
            </span>
          </div>

          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default App;
