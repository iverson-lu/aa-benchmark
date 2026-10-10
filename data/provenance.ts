import { type DataKey, type Provenance } from '../src/shared';

// Only sources explicitly documented in the repository are assigned here.
// checkedDate is a verification date, never a publication or test date.
const modelKeys: DataKey[] = ['intelligence', 'hle', 'gdpval', 'automation', 'scicode', 'terminal_model', 'input_price', 'output_price'];
const agentKeys: DataKey[] = ['deepswe', 'terminal_harness', 'swe_atlas', 'tokens_per_task', 'cost_per_task', 'harness'];
function entries(keys: DataKey[], details: Provenance): Partial<Record<DataKey, Provenance>> {
  return Object.fromEntries(keys.map(key => [key, details]));
}
const aa = { source: 'Artificial Analysis', checkedDate: '2026-10-10' };
const comparison = 'https://artificialanalysis.ai/models/comparisons/gemini-4-argon-vs-mimo-v2-6-flash';
export const provenance: Record<string, Partial<Record<DataKey, Provenance>>> = {
  'claude-haiku-5-5': {
    ...entries(modelKeys, { ...aa, effort: 'max', sourceUrl: 'https://artificialanalysis.ai/models/comparisons/claude-haiku-5-5-vs-claude-haiku-5-5-xhigh' }),
    ...entries(agentKeys, { ...aa, effort: 'max', harness: 'Claude Code', sourceUrl: 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli' }),
    automation: { ...aa, effort: 'max', sourceUrl: 'https://artificialanalysis.ai/articles/claude-haiku-5-5', notes: 'AA reports possible safety-refusal effects and plans to retest. The stored score is the current published display value.' },
    input_price: { source: 'Anthropic', sourceUrl: 'https://www.anthropic.com/claude-haiku-5-5', checkedDate: '2026-10-10', notes: 'Prompt ≤100K tokens. Above 100K: $0.50 input / $2.50 output per 1M tokens.' },
    output_price: { source: 'Anthropic', sourceUrl: 'https://www.anthropic.com/claude-haiku-5-5', checkedDate: '2026-10-10', notes: 'Prompt ≤100K tokens. Above 100K: $0.50 input / $2.50 output per 1M tokens.' }
  },
  'gemini-4-argon': {
    ...entries(modelKeys, { ...aa, effort: 'high', sourceUrl: comparison }),
    ...entries(agentKeys, { ...aa, effort: 'high', harness: 'Antigravity CLI', sourceUrl: 'https://artificialanalysis.ai/agents/coding-agents/comparisons/antigravity-cli-vs-claude-code' })
  },
  'mimo-v2-6-flash': entries(modelKeys, { ...aa, sourceUrl: comparison }),
  'qwen3-8-max-0902': entries(agentKeys, { ...aa, sourceUrl: 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli', notes: 'AA labels the Claude Code run Qwen3.8 Max without the 0902 suffix. This association is retained from the original table, not an exact version match.' })
};
