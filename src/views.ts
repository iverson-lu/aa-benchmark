import { metrics, type MetricKey } from './shared';
export type ColumnKey = 'name' | 'provider' | 'price' | 'harness' | 'delta' | 'value' | MetricKey;
const info = ['name', 'provider', 'price'] as const;
export const views = {
  overview: { label: 'Overview', columns: [...info, 'intelligence', 'hle', 'scicode', 'terminal_harness', 'cost_per_task'] },
  capability: { label: 'Model Capability', columns: [...info, 'intelligence', 'hle', 'gdpval', 'automation', 'scicode', 'terminal_model'] },
  coding: { label: 'Coding', columns: [...info, 'scicode', 'terminal_model', 'harness', 'deepswe', 'terminal_harness', 'delta', 'swe_atlas'] },
  agent: { label: 'Agent', columns: ['name', 'provider', 'harness', 'automation', 'deepswe', 'terminal_harness', 'delta', 'swe_atlas', 'tokens_per_task', 'cost_per_task'] },
  efficiency: { label: 'Cost Efficiency', columns: [...info, 'intelligence', 'deepswe', 'terminal_harness', 'tokens_per_task', 'cost_per_task', 'value'] },
  all: { label: 'All', columns: [...info, ...metrics.flatMap<ColumnKey>(metric => metric.key === 'deepswe' ? ['harness', metric.key] : [metric.key])] }
} satisfies Record<string, { label: string; columns: ColumnKey[] }>;
export type ViewKey = keyof typeof views;
export function validView(value: string | null): ViewKey { return value && Object.hasOwn(views, value) ? value as ViewKey : 'overview'; }
export function column(key: ColumnKey): { label: string; unit: string; group: string; description: string } {
  const metric = metrics.find(metric => metric.key === key);
  if (metric) return metric;
  return {
    name: { label: 'Model', unit: '', group: 'meta', description: 'The model version evaluated.' },
    provider: { label: 'Provider', unit: '', group: 'meta', description: 'The organization that provides the model.' },
    price: { label: 'Price', unit: 'USD / 1M · Input / Output', group: 'meta', description: 'Published API price per million input and output tokens. Actual task cost also depends on how many tokens are used.' },
    harness: { label: 'Agent Harness', unit: '', group: 'agent', description: 'The coding-agent application and configuration used for the agent benchmark results.' },
    delta: { label: 'Harness Δ', unit: 'Terminal-Bench · pts', group: 'agent', description: 'Agent Terminal-Bench score minus the model-only score, in percentage points, where both are available.' },
    value: { label: 'Value Index', unit: 'Internal · 0–100', group: 'agent', description: 'An internal cost-efficiency comparison based on AA Intelligence and Agent Cost / Task. Higher means more intelligence per dollar; it is not an AA benchmark.' }
  }[key as 'name' | 'provider' | 'price' | 'harness' | 'delta' | 'value'];
}
