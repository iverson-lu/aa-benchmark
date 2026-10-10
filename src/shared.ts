export const metrics = [
  { key: 'intelligence', label: 'AA Intelligence', unit: '(v4.3.2)', group: 'aa', lower: false, description: 'Artificial Analysis’s 0–100 composite score across 10 tests of agent work, coding, science, and general reasoning. Higher is better.' },
  { key: 'hle', label: 'HLE', unit: '(%)', group: 'model', lower: false, description: 'Humanity’s Last Exam: difficult questions across many academic subjects. The percentage is the model’s answer accuracy.' },
  { key: 'gdpval', label: 'GDPval-AA v2.1', unit: '(Elo)', group: 'model', lower: false, description: 'Tests professional knowledge-work tasks. Elo summarizes expert/judge comparisons of the model’s completed work; higher is better.' },
  { key: 'automation', label: 'AutomationBench-AA', unit: '(%)', group: 'model', lower: false, description: 'Measures whether a model can complete multi-step workflows across simulated business apps using tools.' },
  { key: 'scicode', label: 'SciCode', unit: 'Coding · %', group: 'model', lower: false, description: 'Scientific programming problems in Python. A solution counts when it passes the required tests.' },
  { key: 'terminal_model', label: 'Terminal-Bench 4.0', unit: 'Model (%)', group: 'model', lower: false, description: 'The model’s pass rate on complex terminal tasks when run with a standardized agent setup.' },
  { key: 'deepswe', label: 'DeepSWE v1.1', unit: '(%)', group: 'agent', lower: false, description: 'Tests a coding agent’s ability to solve long-horizon software engineering tasks and produce working code changes.' },
  { key: 'terminal_harness', label: 'Terminal-Bench 4.0', unit: 'Harness (%)', group: 'agent', lower: false, description: 'Pass rate for the complete coding-agent setup on terminal tasks; results reflect both the model and its agent tools.' },
  { key: 'swe_atlas', label: 'SWE-Atlas-QnA', unit: '(%)', group: 'agent', lower: false, description: 'Tests whether a coding agent can answer questions by understanding a real software repository.' },
  { key: 'tokens_per_task', label: 'Tokens / Task', unit: 'Avg total', group: 'agent', lower: true, description: 'Average tokens used by the coding agent to complete a task. Lower means less token use, not necessarily better task quality.' },
  { key: 'cost_per_task', label: 'Cost / Task', unit: 'Avg API cost', group: 'agent', lower: true, description: 'Average model API cost for one coding-agent task in Artificial Analysis’s evaluation. Lower is cheaper.' }
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
