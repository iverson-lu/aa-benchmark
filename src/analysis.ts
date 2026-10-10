import { type MetricValue, type Model } from './shared';

export const agentKeys = ['deepswe', 'terminal_harness', 'swe_atlas'] as const;
export const capabilityKeys = ['hle', 'gdpval', 'automation', 'scicode', 'terminal_model'] as const;
export const agentIndexMethodologyUrl = 'https://artificialanalysis.ai/methodology/coding-agents-benchmarking';
export const agentIndexNote = 'AA Coding Agent Index v1.5 (recomputed using the official formula) = (DeepSWE v1.1 + Terminal-Bench 4.0 Harness + SWE-Atlas-QnA) / 3. The three benchmarks have equal weight, without min–max normalization. All three valid scores (0–100) are required; otherwise the result is N/A. Recomputed values use the stored display scores and may differ slightly from AA’s full-precision index due to rounding. Filters do not change a model’s index. Each result represents the recorded harness / effort configuration.';
export const valueNote = 'Internal Value Index = (AA Coding Agent Index recomputed using the official formula / Cost per Task), scaled to 0–100 against the largest valid ratio in the full snapshot. Requires a positive task cost and all 3 agent metrics. This cost-efficiency ratio is an internal derived metric, not an AA-published index.';
export const deltaNote = 'Harness Δ compares the same benchmark run as a raw/model result versus an agent/harness result. It should not be interpreted as a universal measure of harness quality. Terminal-Bench 4.0 Harness minus Model, in percentage points; settings may differ.';

export function numeric(value: MetricValue | undefined): number | null {
  const number = typeof value === 'object' && value !== null ? value.value : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
}
export function normalize(value: number, values: number[]): number {
  const min = Math.min(...values), max = Math.max(...values);
  return max === min ? 50 : 100 * (value - min) / (max - min);
}
export function codingAgentIndex(model: Model): number | null {
  const scores = agentKeys.map(key => numeric(model[key]));
  // AA v1.5 averages the three percentage pass@1 scores with equal benchmark
  // weight, not task-count weight or population-relative normalization.
  // Do not invent an index for incomplete coverage or round before ranking.
  if (scores.some(value => value === null || value < 0 || value > 100)) return null;
  return (scores as number[]).reduce((sum, value) => sum + value, 0) / agentKeys.length;
}
export function harnessDelta(model: Model): number | null {
  const raw = numeric(model.terminal_model), agent = numeric(model.terminal_harness);
  return raw === null || agent === null ? null : agent - raw;
}
export interface Derived { agentIndex: number | null; coverage: number; value: number | null; delta: number | null }
export function derive(population: Model[]): Map<string, Derived> {
  const result = new Map(population.map(model => [model.id, {
    agentIndex: codingAgentIndex(model),
    coverage: agentKeys.filter(key => numeric(model[key]) !== null).length,
    value: null as number | null, delta: harnessDelta(model)
  }]));
  const ratios = population.map(model => {
    const index = result.get(model.id)!.agentIndex, cost = numeric(model.cost_per_task);
    return index !== null && cost !== null && cost > 0 ? index / cost : null;
  });
  const max = Math.max(0, ...ratios.filter((ratio): ratio is number => ratio !== null));
  population.forEach((model, index) => {
    const ratio = ratios[index];
    result.get(model.id)!.value = ratio === null ? null : max > 0 ? 100 * ratio / max : 0;
  });
  return result;
}
export interface Point { id: string; cost: number; agentIndex: number }
export function paretoFrontier(points: Point[]): Set<string> {
  // Standard weak dominance: equal cost with strictly better capability also dominates.
  return new Set(points.filter(point => !points.some(other =>
    other.cost <= point.cost && other.agentIndex >= point.agentIndex &&
    (other.cost < point.cost || other.agentIndex > point.agentIndex)
  )).map(point => point.id));
}
export function rank(value: number, values: number[], lower = false): number {
  return 1 + values.filter(other => lower ? other < value : other > value).length;
}
export function winners(models: Model[], read: (model: Model) => number | null, lower = false): Model[] {
  const valid = models.filter(model => read(model) !== null);
  // A missing result could beat every known result; avoid declaring a winner.
  if (valid.length < 2 || valid.length !== models.length) return [];
  const best = (lower ? Math.min : Math.max)(...valid.map(model => read(model)!));
  return valid.filter(model => read(model) === best);
}
