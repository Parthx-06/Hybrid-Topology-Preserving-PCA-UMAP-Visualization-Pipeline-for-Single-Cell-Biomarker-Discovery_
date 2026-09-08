# =============================================================================
# CellMap BioAnalytics — Report Generation Service
# =============================================================================
"""
Generates executive-ready, publication-grade HTML bioinformatics reports
summarizing single-cell QC, PCA+UMAP embeddings, topology benchmarks,
clustering, and ranked candidate biomarkers.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


def generate_html_report(
    experiment: Any,
    dataset: Any,
    qc_results: Optional[Dict[str, Any]] = None,
    pca_results: Optional[Dict[str, Any]] = None,
    umap_results: Optional[Dict[str, Any]] = None,
    cluster_results: Optional[Dict[str, Any]] = None,
    biomarkers: Optional[List[Dict[str, Any]]] = None,
    manifest: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Build a self-contained HTML report with modern scientific typography,
    color palettes, tables, and metric callouts.
    """
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    exp_name = getattr(experiment, "name", "Experiment")
    exp_desc = getattr(experiment, "description", "") or "No description provided."
    ds_name = getattr(dataset, "name", "Dataset")
    ds_cells = getattr(dataset, "n_cells", "N/A")
    ds_genes = getattr(dataset, "n_genes", "N/A")

    # Biomarkers table rows
    biomarker_rows_html = ""
    if biomarkers:
        for b in biomarkers[:30]:  # Top 30
            biomarker_rows_html += f"""
            <tr>
                <td style="font-weight: 600; color: #1e293b;">{b.get('gene_symbol', '')}</td>
                <td><span class="badge cluster-badge">Cluster {b.get('cluster_id', '')}</span></td>
                <td>{b.get('rank', '')}</td>
                <td><strong>{float(b.get('composite_score', 0)):.3f}</strong></td>
                <td>{float(b.get('log2_fc', 0)):.2f}</td>
                <td>{float(b.get('p_value_adj', 0)):.2e}</td>
                <td>{float(b.get('roc_auc', 0)):.3f}</td>
                <td>{float(b.get('specificity', 0)):.3f}</td>
                <td><span class="badge priority-{b.get('prioritization_category', 'low').lower()}">{b.get('prioritization_category', 'Tier 2')}</span></td>
            </tr>
            """
    else:
        biomarker_rows_html = "<tr><td colspan='9' style='text-align:center; color:#64748b;'>No biomarker data available.</td></tr>"

    # Topology scores summary
    topology_rows_html = ""
    if umap_results and "benchmark" in umap_results:
        bench = umap_results["benchmark"]
        for method, scores in bench.items():
            topology_rows_html += f"""
            <tr>
                <td style="font-weight: 600; text-transform: capitalize;">{method}</td>
                <td>{scores.get('knn_preservation', 'N/A')}</td>
                <td>{scores.get('trustworthiness', 'N/A')}</td>
                <td>{scores.get('continuity', 'N/A')}</td>
                <td>{scores.get('runtime_seconds', 'N/A')}s</td>
            </tr>
            """

    # QC metrics summary
    qc_summary_html = ""
    if qc_results:
        summary = qc_results.get("summary", {})
        cells_before = summary.get("cells_before", ds_cells)
        cells_after = summary.get("cells_after", "N/A")
        genes_before = summary.get("genes_before", ds_genes)
        genes_after = summary.get("genes_after", "N/A")
        median_genes = summary.get("median_genes_per_cell", "N/A")
        median_counts = summary.get("median_counts_per_cell", "N/A")

        qc_summary_html = f"""
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Cells (Post-QC)</div>
                <div class="metric-value">{cells_after:,}</div>
                <div class="metric-sub">Filtered from {cells_before:,}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Genes Retained</div>
                <div class="metric-value">{genes_after:,}</div>
                <div class="metric-sub">Filtered from {genes_before:,}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Median Genes / Cell</div>
                <div class="metric-value">{median_genes}</div>
                <div class="metric-sub">Sequencing depth index</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Median UMIs / Cell</div>
                <div class="metric-value">{median_counts}</div>
                <div class="metric-sub">Total transcript library size</div>
            </div>
        </div>
        """

    # Clusters breakdown
    clusters_html = ""
    if cluster_results and "clusters" in cluster_results:
        c_list = cluster_results["clusters"]
        clusters_html = f"<p>Identified <strong>{len(c_list)} discrete cell clusters</strong> via graph-based Leiden community detection.</p>"
        clusters_html += "<div class='cluster-tags'>"
        for c in c_list:
            cid = c.get("id", "")
            count = c.get("cell_count", "")
            pct = c.get("percentage", 0)
            clusters_html += f"""
            <div class="cluster-tag-item">
                <span class="cluster-tag-badge">Cluster {cid}</span>
                <span class="cluster-tag-info">{count:,} cells ({pct:.1f}%)</span>
            </div>
            """
        clusters_html += "</div>"

    manifest_json = json.dumps(manifest, indent=2) if manifest else "Manifest not generated yet."

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CellMap BioAnalytics — {exp_name} Report</title>
    <style>
        :root {{
            --primary: #0284c7;
            --primary-dark: #0369a1;
            --surface: #ffffff;
            --background: #f8fafc;
            --text: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --success: #10b981;
            --warning: #f59e0b;
        }}
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: var(--background);
            color: var(--text);
            line-height: 1.6;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 1100px;
            margin: 0 auto;
            background: var(--surface);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            padding: 48px;
            border: 1px solid var(--border);
        }}
        header {{
            border-bottom: 2px solid var(--border);
            padding-bottom: 24px;
            margin-bottom: 36px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }}
        .logo-title h1 {{
            font-size: 26px;
            font-weight: 700;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        .logo-title h1 span {{
            color: var(--primary);
        }}
        .report-subtitle {{
            color: var(--text-muted);
            font-size: 14px;
            margin-top: 4px;
        }}
        .meta-stamp {{
            text-align: right;
            font-size: 13px;
            color: var(--text-muted);
        }}
        section {{
            margin-bottom: 40px;
        }}
        h2 {{
            font-size: 20px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
        }}
        .metric-card {{
            background: #f1f5f9;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
        }}
        .metric-label {{
            font-size: 13px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
        }}
        .metric-value {{
            font-size: 26px;
            font-weight: 700;
            color: #0284c7;
            margin: 4px 0;
        }}
        .metric-sub {{
            font-size: 12px;
            color: var(--text-muted);
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 12px;
        }}
        th {{
            background: #f8fafc;
            color: #475569;
            text-align: left;
            padding: 10px 12px;
            border-bottom: 2px solid var(--border);
            font-weight: 600;
        }}
        td {{
            padding: 10px 12px;
            border-bottom: 1px solid var(--border);
        }}
        tr:hover td {{
            background: #f8fafc;
        }}
        .badge {{
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 600;
        }}
        .cluster-badge {{
            background: #e0f2fe;
            color: #0369a1;
        }}
        .priority-high, .priority-tier-1 {{
            background: #dcfce7;
            color: #15803d;
        }}
        .priority-medium, .priority-tier-2 {{
            background: #fef3c7;
            color: #b45309;
        }}
        .cluster-tags {{
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 12px;
        }}
        .cluster-tag-item {{
            background: #f8fafc;
            border: 1px solid var(--border);
            padding: 8px 14px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }}
        .cluster-tag-badge {{
            font-weight: 600;
            color: #0284c7;
        }}
        .cluster-tag-info {{
            color: #64748b;
            font-size: 12px;
        }}
        pre.manifest-code {{
            background: #0f172a;
            color: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            font-size: 12px;
            overflow-x: auto;
            max-height: 250px;
        }}
        footer {{
            border-top: 1px solid var(--border);
            padding-top: 20px;
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            color: var(--text-muted);
            font-size: 12px;
        }}
        @media print {{
            body {{
                background: none;
                padding: 0;
            }}
            .container {{
                box-shadow: none;
                border: none;
                padding: 0;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo-title">
                <h1>CellMap <span>BioAnalytics</span></h1>
                <div class="report-subtitle">Biomarker Discovery & Topology-Preserving scRNA-seq Analysis Pipeline</div>
            </div>
            <div class="meta-stamp">
                <div><strong>Generated:</strong> {now_str}</div>
                <div><strong>Platform:</strong> v1.0.0 Enterprise</div>
            </div>
        </header>

        <section>
            <h2>Experiment Summary</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Experiment Name</div>
                    <div class="metric-value" style="font-size: 18px; color:#1e293b;">{exp_name}</div>
                    <div class="metric-sub">{exp_desc}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Dataset</div>
                    <div class="metric-value" style="font-size: 18px; color:#1e293b;">{ds_name}</div>
                    <div class="metric-sub">Input: {ds_cells:,} cells × {ds_genes:,} genes</div>
                </div>
            </div>
        </section>

        <section>
            <h2>Quality Control & Preprocessing</h2>
            {qc_summary_html if qc_summary_html else "<p>Quality control filtering completed.</p>"}
        </section>

        <section>
            <h2>Topology-Preserving Embedding Benchmark</h2>
            <p>Evaluation of global and local neighborhood conservation across dimensionality reduction methods.</p>
            <table>
                <thead>
                    <tr>
                        <th>Method</th>
                        <th>k-NN Preservation (k=15)</th>
                        <th>Trustworthiness</th>
                        <th>Continuity</th>
                        <th>Runtime</th>
                    </tr>
                </thead>
                <tbody>
                    {topology_rows_html if topology_rows_html else "<tr><td colspan='5' style='text-align:center;'>Embedding benchmarks pending execution.</td></tr>"}
                </tbody>
            </table>
        </section>

        <section>
            <h2>Cell Clustering Architecture</h2>
            {clusters_html if clusters_html else "<p>Clustering analysis pending execution.</p>"}
        </section>

        <section>
            <h2>Top Ranked Candidate Biomarkers</h2>
            <p>Composite scoring combining differential expression log2FC, Benjamini-Hochberg FDR p-value, specificity index, and ROC-AUC classification fidelity.</p>
            <table>
                <thead>
                    <tr>
                        <th>Gene</th>
                        <th>Cluster</th>
                        <th>Rank</th>
                        <th>Score</th>
                        <th>Log2 FC</th>
                        <th>Adj P-Value</th>
                        <th>ROC-AUC</th>
                        <th>Specificity</th>
                        <th>Tier</th>
                    </tr>
                </thead>
                <tbody>
                    {biomarker_rows_html}
                </tbody>
            </table>
        </section>

        <section>
            <h2>Provenance & Reproducibility Manifest</h2>
            <p>Deterministic pipeline execution hash and parameter configuration.</p>
            <pre class="manifest-code">{manifest_json}</pre>
        </section>

        <footer>
            <div>CellMap BioAnalytics Platform &copy; 2026. All rights reserved.</div>
            <div>Confidential &bull; Single-Cell Biomarker Research Report</div>
        </footer>
    </div>
</body>
</html>
"""
    return html_content
