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
import { ResearchMethodologyPage } from './pages/ResearchMethodologyPage';

import { PipelineRunnerModal } from './components/PipelineRunnerModal';
import { CellInspectorDrawer } from './components/CellInspectorDrawer';
import { CommandPaletteModal } from './components/CommandPaletteModal';
import { TelemetryDrawer } from './components/TelemetryDrawer';

import {
  COHORTS_DATA_REGISTRY,
  DATASET_COHORTS,
  SAMPLE_CELL_DETAILS,
} from './services/mockData';
import { API_BASE } from './services/api';
import { CellPoint, SingleCellDetail } from './types';

function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [selectedCohortId, setSelectedCohortId] = useState<string>('pbmc3k');
  const [isRunning, setIsRunning] = useState(false);
  const [biomarkerClusterId, setBiomarkerClusterId] = useState<number | null>(null);

  // Modals & Drawers state
  const [isPipelineModalOpen, setIsPipelineModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [inspectorCell, setInspectorCell] = useState<SingleCellDetail | null>(null);

  // Dynamic Cohort Data Resolution
  const activeCohortData = COHORTS_DATA_REGISTRY[selectedCohortId] || COHORTS_DATA_REGISTRY['pbmc3k'];

  // Theme toggling
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleExportReport = () => {
    window.open(`${API_BASE}/reports/1/html`, '_blank');
  };

  const handleSelectClusterForBiomarkers = (clusterId: number) => {
    setBiomarkerClusterId(clusterId);
    setCurrentTab('biomarkers');
  };

  const handleApplyQC = (minCounts: number, minGenes: number, maxMito: number) => {
    console.log('[CellMap] QC filters applied:', { minCounts, minGenes, maxMito });
  };

  // Cell Click Inspector Handler
  const handleSelectCell = (cell: CellPoint) => {
    const existing = SAMPLE_CELL_DETAILS[cell.id];
    if (existing) {
      setInspectorCell(existing);
    } else {
      // Synthesize realistic single cell detail
      setInspectorCell({
        barcode: `AAAC${cell.id.toUpperCase().replace(/[^A-Z0-9]/g, '')}-1`,
        cluster_id: cell.cluster,
        cluster_name: cell.cell_type,
        cell_type: cell.cell_type,
        total_counts: cell.umi_count || 4820,
        detected_genes: cell.gene_count || 1240,
        mito_percent: cell.mito_pct || 3.4,
        cell_cycle_phase: cell.cell_cycle || 'G1',
        top_markers: [
          { gene: 'CD3D', expression: 4.8 },
          { gene: 'IL7R', expression: 3.9 },
          { gene: 'LEF1', expression: 3.1 },
        ],
        batch: cell.batch || 'Batch_01',
        condition: cell.condition || 'Healthy Control',
      });
    }
  };

  const renderPage = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <OverviewPage
            experiment={activeCohortData.experiment}
            steps={activeCohortData.steps}
            benchmarks={activeCohortData.benchmarks}
            clusters={activeCohortData.clusters}
            biomarkers={activeCohortData.biomarkers}
            hybridCells={activeCohortData.embeddings.hybrid}
            onNavigateTab={setCurrentTab}
            onSelectCell={handleSelectCell}
            onOpenPipelineRunner={() => setIsPipelineModalOpen(true)}
          />
        );

      case 'methodology':
        return <ResearchMethodologyPage />;

      case 'qc':
        return (
          <QualityControlPage
            qc={activeCohortData.qc}
            onApplyQC={handleApplyQC}
          />
        );

      case 'embeddings':
        return (
          <EmbeddingExplorerPage
            hybridCells={activeCohortData.embeddings.hybrid}
            directCells={activeCohortData.embeddings.direct}
            pcaCells={activeCohortData.embeddings.pca}
            benchmarks={activeCohortData.benchmarks}
            onSelectCell={handleSelectCell}
          />
        );

      case 'clusters':
        return (
          <ClusterExplorerPage
            clusters={activeCohortData.clusters}
            dotplotData={activeCohortData.dotplot}
            onSelectClusterForBiomarkers={handleSelectClusterForBiomarkers}
          />
        );

      case 'biomarkers':
        return (
          <BiomarkerDiscoveryPage
            biomarkers={activeCohortData.biomarkers}
            pathways={activeCohortData.pathways}
            initialClusterId={biomarkerClusterId}
          />
        );

      case 'genes':
        return <GeneLookupPage hybridCells={activeCohortData.embeddings.hybrid} />;

      case 'reports':
        return <ProvenanceReportPage experiment={activeCohortData.experiment} />;

      default:
        return null;
    }
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
        cellCount={activeCohortData.experiment.cell_count}
      />

      {/* Main Panel */}
      <div className="main-content">
        {/* Enterprise Header */}
        <Header
          experiment={activeCohortData.experiment}
          selectedCohortId={selectedCohortId}
          onSelectCohort={setSelectedCohortId}
          isRunning={isRunning}
          onOpenPipelineRunner={() => setIsPipelineModalOpen(true)}
          onExportReport={handleExportReport}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenTelemetry={() => setIsTelemetryOpen(true)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Dynamic Main Body Content */}
        <main className="page-content" id="main-content-region">
          {renderPage()}
        </main>
      </div>

      {/* Production Pipeline Orchestration Modal */}
      <PipelineRunnerModal
        isOpen={isPipelineModalOpen}
        onClose={() => setIsPipelineModalOpen(false)}
        datasetName={activeCohortData.cohort.name}
        onPipelineCompleted={() => {
          setIsRunning(false);
          console.log('[CellMap] Pipeline workflow completed.');
        }}
      />

      {/* Single-Cell Inspector Slide-Out Drawer */}
      <CellInspectorDrawer
        isOpen={Boolean(inspectorCell)}
        cell={inspectorCell}
        onClose={() => setInspectorCell(null)}
        onHighlightCluster={handleSelectClusterForBiomarkers}
      />

      {/* Command Palette Modal (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => {
          if (tab !== 'biomarkers') setBiomarkerClusterId(null);
          setCurrentTab(tab);
        }}
        onSelectCohort={setSelectedCohortId}
        onOpenPipelineRunner={() => setIsPipelineModalOpen(true)}
        onToggleTheme={handleToggleTheme}
        theme={theme}
      />

      {/* System & Worker Cluster Telemetry Drawer */}
      <TelemetryDrawer
        isOpen={isTelemetryOpen}
        onClose={() => setIsTelemetryOpen(false)}
      />
    </div>
  );
}

export default App;
