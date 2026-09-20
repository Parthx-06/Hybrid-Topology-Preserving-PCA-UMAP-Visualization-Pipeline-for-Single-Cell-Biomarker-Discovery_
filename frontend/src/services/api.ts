import {
  BIOMARKERS_DATA,
  CLUSTERS_DATA,
  EMBEDDINGS_DATA,
  INITIAL_EXPERIMENT,
  INITIAL_PIPELINE_STEPS,
  QC_METRICS,
  TOPOLOGY_BENCHMARKS,
} from './mockData';
import {
  BiomarkerItem,
  CellPoint,
  ClusterSummary,
  ExperimentMetadata,
  PipelineStep,
  PipelineStepStatus,
  QCSummary,
  TopologyBenchmark,
} from '../types';

const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const API_BASE = `${BACKEND_URL}/api/v1`;

export class ApiService {
  private static token: string | null = null;

  static setToken(token: string) {
    this.token = token;
  }

  static async getExperiment(): Promise<ExperimentMetadata> {
    try {
      const res = await fetch(`${API_BASE}/experiments/1`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return INITIAL_EXPERIMENT;
    }
  }

  static async getPipelineStatus(): Promise<PipelineStepStatus[]> {
    try {
      const res = await fetch(`${API_BASE}/experiments/1/status`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      return data.steps;
    } catch {
      return INITIAL_PIPELINE_STEPS;
    }
  }

  static async runPipelineStep(step: PipelineStep | 'full'): Promise<void> {
    try {
      await fetch(`${API_BASE}/experiments/1/run/${step}`, {
        method: 'POST',
      });
    } catch {
      // In mock mode, local simulation
    }
  }

  static async getEmbeddings(): Promise<{
    hybrid: CellPoint[];
    direct: CellPoint[];
    pca: CellPoint[];
  }> {
    return EMBEDDINGS_DATA;
  }

  static async getTopologyBenchmarks(): Promise<Record<string, TopologyBenchmark>> {
    return TOPOLOGY_BENCHMARKS;
  }

  static async getClusters(): Promise<ClusterSummary[]> {
    return CLUSTERS_DATA;
  }

  static async getBiomarkers(clusterId?: number): Promise<BiomarkerItem[]> {
    if (clusterId !== undefined) {
      return BIOMARKERS_DATA.filter((b) => b.cluster_id === clusterId);
    }
    return BIOMARKERS_DATA;
  }

  static async getQCSummary(): Promise<QCSummary> {
    return QC_METRICS;
  }
}
