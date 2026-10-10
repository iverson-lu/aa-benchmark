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
export function column(key: ColumnKey): { label: string; unit: string; group: string } {
  const metric = metrics.find(metric => metric.key === key);
  if (metric) return metric;
  return {
    name: { label: 'Model', unit: '', group: 'meta' },
    provider: { label: 'Provider', unit: '', group: 'meta' },
    price: { label: 'Price', unit: 'USD / 1M · Input / Output', group: 'meta' },
    harness: { label: 'Agent Harness', unit: '', group: 'agent' },
    delta: { label: 'Harness Δ', unit: 'Terminal-Bench · pts', group: 'agent' },
    value: { label: 'Value Index', unit: 'Internal · 0–100', group: 'agent' }
  }[key as 'name' | 'provider' | 'price' | 'harness' | 'delta' | 'value'];
}
