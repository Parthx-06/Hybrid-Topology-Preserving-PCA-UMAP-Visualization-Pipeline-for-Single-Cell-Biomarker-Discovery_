import React from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Compass,
  Boxes,
  Dna,
  Search,
  FileText,
  Activity,
  Cpu,
  Database,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'qc'
  | 'embeddings'
  | 'clusters'
  | 'biomarkers'
  | 'genes'
  | 'reports';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  cellCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  cellCount,
}) => {
  const navItems = [
    { id: 'overview' as NavTab, label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'qc' as NavTab, label: 'Quality Control', icon: ShieldCheck, badge: 'Pass' },
    { id: 'embeddings' as NavTab, label: 'Embedding Explorer', icon: Compass, badge: 'Hybrid' },
    { id: 'clusters' as NavTab, label: 'Cell Clusters', icon: Boxes, badge: '5 Types' },
    { id: 'biomarkers' as NavTab, label: 'Biomarker Discovery', icon: Dna, badge: 'Ranked' },
    { id: 'genes' as NavTab, label: 'Gene Expression', icon: Search, badge: null },
    { id: 'reports' as NavTab, label: 'Report & Provenance', icon: FileText, badge: 'SHA-256' },
  ];

  return (
    <aside className="sidebar" id="main-sidebar">
      {/* Brand Header */}
      <div
        style={{
          padding: '22px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--cyan-500), var(--indigo-500))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.4)',
          }}
        >
          <Activity size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.02em', color: '#fff' }}>
            CellMap <span style={{ color: 'var(--cyan-400)' }}>Bio</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Single-Cell Discovery v1.0
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-muted)',
            padding: '8px 12px 4px',
          }}
        >
          Analysis Pipeline
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                color: isActive ? 'var(--cyan-400)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                borderLeft: isActive ? '3px solid var(--cyan-400)' : '3px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={17} color={isActive ? 'var(--cyan-400)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: isActive ? 'rgba(6, 182, 212, 0.25)' : 'var(--bg-tertiary)',
                    color: isActive ? 'var(--cyan-300)' : 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Hardware / Engine Status Box */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Cpu size={14} color="var(--emerald-400)" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Topology Engine Ready
          </span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Active Cells:</span>
          <span style={{ color: 'var(--cyan-400)', fontWeight: 600 }}>{cellCount.toLocaleString()}</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          <span>Spectral Solver:</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>ARPACK (k=50)</span>
        </div>
      </div>
    </aside>
  );
};
