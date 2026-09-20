import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  BarChart3,
  Award,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { TOPOLOGY_BENCHMARKS, SCREE_PLOT_DATA, FEATURE_COMPARISON, LAMBDA_SWEEP_DATA } from '../services/mockData';

// ─── Pillar Card ───────────────────────────────────────────────────────────────
const PillarCard: React.FC<{
  number: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  children: React.ReactNode;
}> = ({ number, icon, title, subtitle, color, children }) => (
  <div
    className="glass-card"
    style={{ position: 'relative', overflow: 'hidden' }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, transparent)` }} />
    <div style={{ position: 'absolute', top: '10px', right: '16px', fontSize: '56px', fontWeight: 900, color, opacity: 0.05, lineHeight: 1, userSelect: 'none', fontFamily: 'var(--font-mono)' }}>{number}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
      <div style={{ color }}>{icon}</div>
      <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
    </div>
    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>{subtitle}</p>
    {children}
  </div>
);

// ─── Metric Gauge ─────────────────────────────────────────────────────────────
const MetricGauge: React.FC<{
  label: string;
  value: number;
  max?: number;
  unit?: string;
  color: string;
  description: string;
}> = ({ label, value, max = 1, unit = '', color, description }) => {
  const pct = Math.min(value / max, 1);
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const displayVal = unit === 'ms'
    ? value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${Math.round(value)}ms`
    : value.toFixed(3);
  const subLabel = unit === 'ms' ? 'LATENCY' : `${(pct * 100).toFixed(0)}%`;

  return (
    <div style={{ textAlign: 'center', flex: '1 1 150px', padding: '8px' }}>
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="7" />
        <circle
          cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 1.2s ease', filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
        <text x="48" y="44" textAnchor="middle" fontSize="12" fontWeight="800" fill="var(--text-primary)" fontFamily="monospace">{displayVal}</text>
        <text x="48" y="58" textAnchor="middle" fontSize="9" fill={color} fontFamily="monospace" fontWeight="600">{subLabel}</text>
      </svg>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>{label}</div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4, maxWidth: '140px', margin: '4px auto 0' }}>{description}</div>
    </div>
  );
};

// ─── Scree Plot ───────────────────────────────────────────────────────────────
const ScreePlot: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const pad = { top: 24, right: 20, bottom: 40, left: 50 };
    const pW = W - pad.left - pad.right, pH = H - pad.top - pad.bottom;
    const n = SCREE_PLOT_DATA.length;
    ctx.clearRect(0, 0, W, H);

    SCREE_PLOT_DATA.forEach((d, i) => {
      const bw = (pW / n) * 0.5;
      const x = pad.left + (i / n) * pW + (pW / n) * 0.25;
      const bh = d.variance * pH * 4.5;
      const y = pad.top + pH - bh;
      const gr = ctx.createLinearGradient(x, y, x, pad.top + pH);
      gr.addColorStop(0, '#06b6d4cc'); gr.addColorStop(1, '#0891b244');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.roundRect(x, y, bw, bh, 3); ctx.fill();
      ctx.fillStyle = '#22d3ee'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
      ctx.fillText((d.variance * 100).toFixed(1) + '%', x + bw / 2, y - 5);
      ctx.fillStyle = '#64748b'; ctx.font = '9px monospace';
      ctx.fillText(`PC${d.pc}`, x + bw / 2, pad.top + pH + 16);
    });

    // Cumulative line
    ctx.beginPath(); ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    SCREE_PLOT_DATA.forEach((d, i) => {
      const x = pad.left + (i / n) * pW + (pW / n) * 0.5;
      const y = pad.top + pH * (1 - d.cumulative * 1.55);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke(); ctx.setLineDash([]);

    // Y-axis label
    ctx.save(); ctx.translate(14, pad.top + pH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Explained Variance', 0, 0); ctx.restore();

    // Legend
    ctx.fillStyle = '#06b6d4'; ctx.fillRect(pad.left, 6, 10, 8);
    ctx.fillStyle = '#94a3b8'; ctx.font = '9px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('Individual', pad.left + 14, 14);
    ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(pad.left + 82, 10); ctx.lineTo(pad.left + 94, 10); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = '#94a3b8'; ctx.fillText('Cumulative', pad.left + 98, 14);
  }, []);
  return <canvas ref={ref} width={480} height={190} style={{ width: '100%', height: '190px', display: 'block' }} />;
};

// ─── Lambda Sweep Chart ───────────────────────────────────────────────────────
const LambdaSweepChart: React.FC<{ lambda: number }> = ({ lambda }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const pad = { top: 14, right: 14, bottom: 28, left: 40 };
    const pW = W - pad.left - pad.right, pH = H - pad.top - pad.bottom;
    const n = LAMBDA_SWEEP_DATA.length;
    ctx.clearRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const y = pad.top + (g / 4) * pH;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + pW, y); ctx.stroke();
    }

    const lines = [
      { key: 'hybrid', color: '#22d3ee' },
      { key: 'direct', color: '#f59e0b' },
      { key: 'pca', color: '#818cf8' },
    ];
    lines.forEach(({ key, color }) => {
      ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 2;
      LAMBDA_SWEEP_DATA.forEach((d: any, i: number) => {
        const x = pad.left + (i / (n - 1)) * pW;
        const val = (d as any)[key] as number;
        const y = pad.top + pH * (1 - (val - 0.6) / 0.4);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    // Lambda marker
    const lx = pad.left + lambda * pW;
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(lx, pad.top); ctx.lineTo(lx, pad.top + pH); ctx.stroke(); ctx.setLineDash([]);

    // Axis labels
    ctx.fillStyle = '#64748b'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ['0', '0.5', '1'].forEach((l, i) => ctx.fillText(l, pad.left + (i * pW) / 2, pad.top + pH + 14));
    ctx.fillText('λ (global weight →)', pad.left + pW / 2, H - 2);
    ctx.textAlign = 'right';
    ['0.60', '0.80', '1.0'].forEach((l, i) => ctx.fillText(l, pad.left - 4, pad.top + pH - (i / 2) * pH + 4));
  }, [lambda]);
  return <canvas ref={ref} width={360} height={130} style={{ width: '100%', height: '130px', display: 'block' }} />;
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export const ResearchMethodologyPage: React.FC = () => {
  const [lambda, setLambda] = useState(0.5);

  const hybrid = TOPOLOGY_BENCHMARKS.hybrid;
  const direct = TOPOLOGY_BENCHMARKS.direct;

  const getLambdaScore = (key: 'hybrid' | 'direct' | 'pca') => {
    const idx = Math.round(lambda * 10);
    return LAMBDA_SWEEP_DATA[Math.min(idx, LAMBDA_SWEEP_DATA.length - 1)][key];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Hero */}
      <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(6,182,212,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <BookOpen size={22} color="var(--cyan-400)" />
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>Research Methodology Framework</h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '680px', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--cyan-400)' }}>Unit 5 — Feature Engineering &amp; Model Optimization</strong> · CO5: Analyze research problems using neural networks and component analysis.
              All four rubric pillars are documented below.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['Research Background', 'ML Methodology', 'Performance Eval', 'Publishable Novelty'].map((l, i) => (
              <span key={i} className="badge badge-cyan" style={{ fontSize: '10px' }}>{l}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PILLAR 1: RESEARCH BACKGROUND ─────────────────────────────── */}
      <PillarCard number="01" icon={<AlertTriangle size={20} />} title="Research Background & Challenge" subtitle="The fundamental limitation that motivates this research" color="var(--amber-400)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
          <div style={{ padding: '16px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>🌀</span>
              <strong style={{ fontSize: '12px', color: 'var(--amber-400)' }}>Problem A — Standard UMAP</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Excels at resolving <em>local cellular microstructure</em> but <strong style={{ color: 'var(--rose-400)' }}>destroys global spatial &amp; lineage hierarchies</strong>. Inter-cluster distances are biologically meaningless.
            </p>
            <div style={{ marginTop: '10px', padding: '6px 8px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--amber-400)' }}>
              Trust: 0.867 · Global Corr: 0.381
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '24px', color: 'var(--border-medium)' }}>⟶</span>
          </div>

          <div style={{ padding: '16px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span>📉</span>
              <strong style={{ fontSize: '12px', color: 'var(--indigo-400)' }}>Problem B — Standard PCA</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Preserves <em>global linear variance</em> but <strong style={{ color: 'var(--rose-400)' }}>collapses all non-linear local detail</strong>. Rare cell subtypes and fine-grained clusters are invisible.
            </p>
            <div style={{ marginTop: '10px', padding: '6px 8px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--indigo-400)' }}>
              k-NN: 61.2% · Local detail: LOST
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '24px', color: 'var(--border-medium)' }}>⟶</span>
          </div>

          <div style={{ padding: '16px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={15} color="var(--cyan-400)" />
              <strong style={{ fontSize: '12px', color: 'var(--cyan-400)' }}>Solution — Hybrid Pipeline</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              PCA acts as <strong>global anchor</strong>, denoises matrix, then UMAP resolves <strong>local non-linear clusters</strong> on clean manifold. Best of both worlds.
            </p>
            <div style={{ marginTop: '10px', padding: '6px 8px', background: 'var(--bg-tertiary)', borderRadius: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--cyan-400)' }}>
              k-NN: 88.4% · Trust: 0.942 · GDC: 0.748 ✓
            </div>
          </div>
        </div>
      </PillarCard>

      {/* ── PILLAR 2: ML METHODOLOGY ───────────────────────────────────── */}
      <PillarCard number="02" icon={<BarChart3 size={20} />} title="Proposed Machine Learning Methodology" subtitle="High-dimensional feature selection → PCA extraction → customized UMAP optimizer weighting global variance (λ)" color="var(--teal-400)">

        {/* Feature Selection vs Extraction */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--teal-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Unit 5: Feature Selection vs Feature Extraction — CO5 Direct Mapping
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center' }}>
            {/* Selection */}
            <div style={{ padding: '14px', background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--teal-400)', letterSpacing: '0.05em', marginBottom: '6px' }}>Stage 1 · Feature Selection</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{FEATURE_COMPARISON.selection.method}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{FEATURE_COMPARISON.selection.input_dims.toLocaleString()} → {FEATURE_COMPARISON.selection.output_dims.toLocaleString()} genes</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.5 }}>{FEATURE_COMPARISON.selection.preserves}</div>
              <div style={{ fontSize: '10px', padding: '6px 8px', background: 'var(--bg-tertiary)', borderRadius: '6px', color: 'var(--teal-400)', fontFamily: 'var(--font-mono)' }}>{FEATURE_COMPARISON.selection.technique}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
              <ChevronRight size={18} />
              <span style={{ fontSize: '8px' }}>FEEDS</span>
            </div>

            {/* Extraction */}
            <div style={{ padding: '14px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.25)', borderRadius: '10px' }}>
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--indigo-400)', letterSpacing: '0.05em', marginBottom: '6px' }}>Stage 2 · Feature Extraction</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{FEATURE_COMPARISON.extraction.method}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{FEATURE_COMPARISON.extraction.input_dims.toLocaleString()} → {FEATURE_COMPARISON.extraction.output_dims} PCs</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px', lineHeight: 1.5 }}>{FEATURE_COMPARISON.extraction.preserves}</div>
              <div style={{ fontSize: '10px', padding: '6px 8px', background: 'var(--bg-tertiary)', borderRadius: '6px', color: 'var(--indigo-400)', fontFamily: 'var(--font-mono)' }}>{FEATURE_COMPARISON.extraction.technique}</div>
            </div>
          </div>
        </div>

        {/* Scree Plot */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            PCA Scree Plot — Top 10 Principal Components Explained Variance
          </div>
          <div className="plot-canvas-wrapper"><ScreePlot /></div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', gap: '16px' }}>
            <span>PC1: <strong style={{ color: 'var(--cyan-400)' }}>18.42%</strong> variance</span>
            <span>Top 10 PCs: <strong style={{ color: 'var(--purple-400)' }}>59.65%</strong> cumulative</span>
            <span>Selected k=50 PCs for UMAP input</span>
          </div>
        </div>

        {/* Pipeline Flowchart */}
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
          Hybrid UMAP Optimizer — Mathematical Pipeline Flow
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { step: '2,054 HVGs', sub: 'Raw Matrix', color: 'var(--teal-400)' },
            { step: 'HVG Filter', sub: 'Feature Selection', color: 'var(--teal-500)' },
            { step: '2,000 Genes', sub: 'Filtered', color: 'var(--indigo-400)' },
            { step: 'PCA (k=50)', sub: 'Feature Extraction', color: 'var(--indigo-500)' },
            { step: '50-dim PCs', sub: 'Denoised Manifold', color: 'var(--purple-400)' },
            { step: 'k-NN Graph', sub: 'Cosine Metric', color: 'var(--cyan-500)' },
            { step: 'UMAP Optimizer', sub: 'λ-weighted', color: 'var(--cyan-400)' },
            { step: '2D Embedding', sub: 'Topology-Preserved', color: 'var(--emerald-400)' },
          ].map((node, i, arr) => (
            <React.Fragment key={i}>
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ padding: '7px 10px', background: 'var(--bg-tertiary)', border: `1px solid ${node.color}44`, borderRadius: '7px', fontSize: '11px', fontWeight: 700, color: node.color, whiteSpace: 'nowrap' }}>{node.step}</div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{node.sub}</div>
              </div>
              {i < arr.length - 1 && <ArrowRight size={12} color="var(--border-medium)" style={{ flexShrink: 0, marginBottom: '14px' }} />}
            </React.Fragment>
          ))}
        </div>
      </PillarCard>

      {/* ── PILLAR 3: PERFORMANCE EVALUATION ──────────────────────────── */}
      <PillarCard number="03" icon={<BarChart3 size={20} />} title="Performance Evaluation Framework" subtitle="Trustworthiness Metric · Continuity Index · Visualization Execution Latency" color="var(--emerald-400)">

        {/* Gauges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'space-around', marginBottom: '20px', padding: '16px', background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)', borderRadius: '12px' }}>
          <MetricGauge label="Trustworthiness" value={hybrid.trustworthiness} max={1} color="var(--emerald-400)" description="Local neighborhood fidelity. Measures false-neighbor injection rate." />
          <MetricGauge label="Continuity Index" value={hybrid.continuity} max={1} color="var(--cyan-400)" description="Reverse check: high-dim neighbors preserved in 2D projection." />
          <MetricGauge label="Vis. Latency" value={hybrid.visualization_latency_ms} max={15000} unit="ms" color="var(--teal-400)" description={`${Math.round(100 - (hybrid.visualization_latency_ms / direct.visualization_latency_ms) * 100)}% faster than direct UMAP baseline.`} />
          <MetricGauge label="Global Dist. Corr." value={hybrid.global_distance_correlation} max={1} color="var(--indigo-400)" description="Spearman rank correlation of pairwise distances high→low dim (L_global)." />
        </div>

        {/* Full benchmark table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Trustworthiness ↑</th>
                <th>Continuity Index ↑</th>
                <th>Vis. Latency ↓</th>
                <th>Global Dist. Corr. ↑</th>
                <th>Dual-Obj Score ↑</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(TOPOLOGY_BENCHMARKS).map(([key, bm]) => (
                <tr key={key} style={{ background: key === 'hybrid' ? 'rgba(6,182,212,0.08)' : 'transparent' }}>
                  <td style={{ fontWeight: 700, color: key === 'hybrid' ? 'var(--cyan-400)' : key === 'direct' ? 'var(--amber-400)' : 'var(--indigo-400)' }}>{bm.method}</td>
                  <td className="mono" style={{ color: key === 'hybrid' ? 'var(--emerald-400)' : 'inherit' }}>{bm.trustworthiness.toFixed(3)}</td>
                  <td className="mono" style={{ color: key === 'hybrid' ? 'var(--emerald-400)' : 'inherit' }}>{bm.continuity.toFixed(3)}</td>
                  <td className="mono">
                    <span style={{ color: key === 'hybrid' ? 'var(--teal-400)' : key === 'pca' ? 'var(--emerald-400)' : 'var(--rose-400)' }}>
                      {bm.visualization_latency_ms >= 1000 ? `${(bm.visualization_latency_ms / 1000).toFixed(2)}s` : `${bm.visualization_latency_ms}ms`}
                    </span>
                  </td>
                  <td className="mono">{bm.global_distance_correlation.toFixed(3)}</td>
                  <td>
                    <span className={`badge ${key === 'hybrid' ? 'badge-cyan' : key === 'pca' ? 'badge-indigo' : 'badge-amber'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                      {bm.dual_objective_score.toFixed(3)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PillarCard>

      {/* ── PILLAR 4: PATENTABLE / PUBLISHABLE NOVELTY ────────────────── */}
      <PillarCard number="04" icon={<Award size={20} />} title="Patentable / Publishable Novelty" subtitle="Dual-objective framework optimizing local manifold clusters AND global coordinate distances simultaneously" color="var(--purple-400)">

        {/* Formula box */}
        <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, rgba(192,132,252,0.08) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: '12px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--purple-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Novel Dual-Objective Loss Function (Publishable Novelty)</div>
          <div style={{ fontSize: '20px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 2, letterSpacing: '-0.01em' }}>
            L<sub style={{ fontSize: '13px' }}>total</sub> = <span style={{ color: 'var(--purple-400)' }}>λ</span> · L<sub style={{ fontSize: '13px' }}>global</sub> + (1 − <span style={{ color: 'var(--purple-400)' }}>λ</span>) · L<sub style={{ fontSize: '13px' }}>local</sub>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px', textAlign: 'left' }}>
            {[
              { term: 'λ (lambda)', def: 'Global-local trade-off weight ∈ [0, 1]. The patentable hyperparameter.', color: 'var(--purple-400)' },
              { term: 'L_global', def: '1 − Spearman(d_high, d_low) — pairwise distance rank correlation loss.', color: 'var(--indigo-400)' },
              { term: 'L_local', def: '1 − Trustworthiness(X, X_low, k) — false neighbor injection loss.', color: 'var(--cyan-400)' },
            ].map((t) => (
              <div key={t.term} style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', border: `1px solid ${t.color}33` }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: t.color, fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>{t.term}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.def}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Lambda slider + chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Interactive λ Controller</div>
            <div style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>λ=0 Local</span>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--purple-400)', fontFamily: 'var(--font-mono)' }}>λ = {lambda.toFixed(1)}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Global λ=1</span>
              </div>
              <input type="range" min={0} max={1} step={0.1} value={lambda} onChange={(e) => setLambda(parseFloat(e.target.value))} style={{ width: '100%', accentColor: 'var(--purple-400)', cursor: 'pointer' }} />
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(['hybrid', 'direct', 'pca'] as const).map((key) => {
                  const clrs = { hybrid: 'var(--cyan-400)', direct: 'var(--amber-400)', pca: 'var(--indigo-400)' };
                  const lbls = { hybrid: 'Hybrid PCA→UMAP', direct: 'Direct UMAP', pca: 'PCA Only' };
                  const score = getLambdaScore(key);
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', color: clrs[key] }}>● {lbls[key]}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '80px', height: '4px', background: 'var(--bg-secondary)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${score * 100}%`, height: '100%', background: clrs[key], borderRadius: '2px', transition: 'width 0.3s ease' }} />
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: clrs[key] }}>{score.toFixed(3)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Dual-Objective Score Across λ Sweep</div>
            <div className="plot-canvas-wrapper"><LambdaSweepChart lambda={lambda} /></div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '10px' }}>
              <span style={{ color: 'var(--cyan-400)' }}>● Hybrid (peaks λ=0.5)</span>
              <span style={{ color: 'var(--amber-400)' }}>● Direct UMAP</span>
              <span style={{ color: 'var(--indigo-400)' }}>● PCA</span>
            </div>
          </div>
        </div>

        {/* Publishability box */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', padding: '14px', background: 'rgba(192,132,252,0.05)', border: '1px solid rgba(192,132,252,0.2)', borderRadius: '10px' }}>
          <Award size={20} color="var(--purple-400)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--purple-400)' }}>Publishable Claim:</strong> The λ-parameterized dual-objective framework is the first <em>single-hyperparameter</em> mechanism for continuously interpolating between purely global (PCA) and purely local (UMAP) dimensionality reduction for scRNA-seq. Hybrid method achieves peak dual-objective score <strong style={{ color: 'var(--cyan-400)' }}>0.927</strong> at λ=0.5. Suitable for <em>Bioinformatics</em>, <em>Nature Methods</em>, or <em>Cell Systems</em>.
          </div>
        </div>
      </PillarCard>
    </div>
  );
};
