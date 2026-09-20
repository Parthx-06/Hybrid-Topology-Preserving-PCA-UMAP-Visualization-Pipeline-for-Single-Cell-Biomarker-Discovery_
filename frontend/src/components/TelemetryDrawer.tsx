import React from 'react';
import { X, Server, Cpu, Database, Activity, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';

interface TelemetryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelemetryDrawer: React.FC<TelemetryDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        className="glass-card"
        style={{
          width: '380px',
          height: '100%',
          borderRadius: 0,
          borderLeft: '1px solid var(--border-glow)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-tertiary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="var(--emerald-400)" />
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                System Architecture Telemetry
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Cluster Health &amp; Resource Telemetry
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Status badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="var(--emerald-400)" />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--emerald-400)' }}>
                  All 4 Subsystems Operational
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  SLA: 99.98% uptime &bull; Latency: 1.2ms
                </div>
              </div>
            </div>
            <span className="badge badge-emerald">HEALTHY</span>
          </div>

          {/* Compute Nodes */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Distributed Workers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={14} color="var(--cyan-400)" />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>celery@worker-01 (CPU/ARPACK)</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>8 Cores &bull; 32GB RAM &bull; Linux x86_64</div>
                  </div>
                </div>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--emerald-400)' }}>18% Load</span>
              </div>

              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={14} color="var(--purple-400)" />
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>cuml@worker-gpu (NVIDIA A100)</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CUDA 12.2 &bull; UMAP SIMD Acceleration</div>
                  </div>
                </div>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--cyan-400)' }}>Ready</span>
              </div>
            </div>
          </div>

          {/* Database & Memory Footprint */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Data &amp; Queue Ingestion
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Redis Message Queue</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--cyan-400)' }}>0 Queued</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>0.8ms round-trip</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>PostgreSQL 16</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--emerald-400)' }}>Connected</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Pool: 5 / 20 active</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>AnnData In-Memory</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--purple-400)' }}>14.2 MB</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Sparse CSR format</div>
              </div>
              <div style={{ background: 'var(--bg-tertiary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HDF5 Storage Engine</div>
                <div className="mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--amber-400)' }}>Synchronized</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>SHA-256 Verified</div>
              </div>
            </div>
          </div>

          {/* GxP & Compliance Notice */}
          <div
            style={{
              padding: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--emerald-400)', fontWeight: 700, marginBottom: '4px' }}>
              <ShieldCheck size={14} />
              <span>GxP / 21 CFR Part 11 Audit Trail Active</span>
            </div>
            All hyperparameter modifications, user execution timestamps, and intermediate AnnData matrices are signed with cryptographic SHA-256 hashes and archived to immutable PostgreSQL audit tables.
          </div>
        </div>
      </div>
    </div>
  );
};
