import React, { useState, useEffect, useRef } from 'react';
import { Search, Compass, Dna, Play, FileText, Moon, Sun, ArrowRight, X } from 'lucide-react';
import { DATASET_COHORTS } from '../services/mockData';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: any) => void;
  onSelectCohort: (cohortId: string) => void;
  onOpenPipelineRunner: () => void;
  onToggleTheme: () => void;
  theme: 'dark' | 'light';
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectCohort,
  onOpenPipelineRunner,
  onToggleTheme,
  theme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Build searchable commands
  const allCommands = [
    { id: 'tab-overview', title: 'Go to Overview Dashboard', category: 'Navigation', icon: Compass, action: () => onNavigateTab('overview') },
    { id: 'tab-qc', title: 'Go to Quality Control & Filtering', category: 'Navigation', icon: Compass, action: () => onNavigateTab('qc') },
    { id: 'tab-embeddings', title: 'Go to Embedding Explorer (Hybrid UMAP / PCA)', category: 'Navigation', icon: Compass, action: () => onNavigateTab('embeddings') },
    { id: 'tab-clusters', title: 'Go to Cluster Explorer & Marker DotPlot', category: 'Navigation', icon: Compass, action: () => onNavigateTab('clusters') },
    { id: 'tab-biomarkers', title: 'Go to Biomarker Discovery & GSEA', category: 'Navigation', icon: Compass, action: () => onNavigateTab('biomarkers') },
    { id: 'tab-genes', title: 'Go to Gene Expression Lookup', category: 'Navigation', icon: Dna, action: () => onNavigateTab('genes') },
    { id: 'tab-methodology', title: 'Go to Research Methodology Paper', category: 'Navigation', icon: FileText, action: () => onNavigateTab('methodology') },
    { id: 'tab-reports', title: 'Go to 21 CFR Part 11 Provenance Report', category: 'Navigation', icon: FileText, action: () => onNavigateTab('reports') },
    { id: 'action-pipeline', title: 'Launch Production Pipeline Orchestrator', category: 'Actions', icon: Play, action: () => { onClose(); onOpenPipelineRunner(); } },
    { id: 'action-theme', title: `Toggle Theme (Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode)`, category: 'System', icon: theme === 'dark' ? Sun : Moon, action: () => { onToggleTheme(); onClose(); } },
    // Cohorts
    ...DATASET_COHORTS.map((c) => ({
      id: `cohort-${c.id}`,
      title: `Switch Study Cohort: ${c.name} (${c.organ})`,
      category: 'Study Cohorts',
      icon: Dna,
      action: () => { onSelectCohort(c.id); onClose(); },
    })),
  ];

  const filteredCommands = allCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '100px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: '580px',
          padding: 0,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '1px solid var(--border-glow)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-secondary)',
          }}
        >
          <Search size={18} color="var(--cyan-400)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, jump to page, search cohort, or run pipeline..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <kbd
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              fontSize: '11px',
              color: 'var(--text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No commands matching "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color={isSelected ? 'var(--cyan-400)' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 500, color: 'var(--text-primary)' }}>
                        {cmd.title}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {cmd.category}
                      </div>
                    </div>
                  </div>
                  {isSelected && <ArrowRight size={14} color="var(--cyan-400)" />}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--bg-tertiary)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span>Use &uarr; &darr; to navigate</span>
          <span>&crarr; to select</span>
        </div>
      </div>
    </div>
  );
};
