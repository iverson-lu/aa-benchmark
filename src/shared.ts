export const metrics = [
  { key: 'intelligence', label: 'AA Intelligence', unit: '(v4.3.2)', group: 'aa', lower: false },
  { key: 'hle', label: 'HLE', unit: '(%)', group: 'model', lower: false },
  { key: 'gdpval', label: 'GDPval-AA v2.1', unit: '(Elo)', group: 'model', lower: false },
  { key: 'automation', label: 'AutomationBench-AA', unit: '(%)', group: 'model', lower: false },
  { key: 'scicode', label: 'SciCode', unit: 'Coding · %', group: 'model', lower: false },
  { key: 'terminal_model', label: 'Terminal-Bench 4.0', unit: 'Model (%)', group: 'model', lower: false },
  { key: 'deepswe', label: 'DeepSWE v1.1', unit: '(%)', group: 'agent', lower: false },
  { key: 'terminal_harness', label: 'Terminal-Bench 4.0', unit: 'Harness (%)', group: 'agent', lower: false },
  { key: 'swe_atlas', label: 'SWE-Atlas-QnA', unit: '(%)', group: 'agent', lower: false },
  { key: 'tokens_per_task', label: 'Tokens / Task', unit: 'Avg total', group: 'agent', lower: true },
  { key: 'cost_per_task', label: 'Cost / Task', unit: 'Avg API cost', group: 'agent', lower: true }
] as const;
export type MetricKey = typeof metrics[number]['key'];
export interface Provenance {
  source?: string; sourceUrl?: string; methodologyUrl?: string;
  date?: string; checkedDate?: string; harness?: string; effort?: string;
  status?: 'Published' | 'Not tested' | 'Not published' | 'N/A' | 'Pending' | 'Previous gen' | 'Estimated';
  notes?: string;
}
export type MetricValue = number | null | (Provenance & { value: number | null });
export type DataKey = MetricKey | 'input_price' | 'output_price' | 'harness';
export type Model = Record<MetricKey, MetricValue> & {
  id: string; name: string; provider_id: string; provider: string; icon_key: string;
  model_type: 'closed' | 'open'; input_price: number; output_price: number;
  harness: string | null; tag: string | null; note: string | null;
  display_order: number; data_date: string;
  provenance?: Partial<Record<DataKey, Provenance>>;
};
export interface Snapshot { models: Model[]; dataDate: string | null }
