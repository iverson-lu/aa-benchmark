import { type DataKey, type Provenance } from '../src/shared';

const checkedDate = '2026-10-10';
const modelKeys: DataKey[] = ['intelligence', 'hle', 'gdpval', 'automation', 'scicode', 'terminal_model', 'input_price', 'output_price'];
const agentKeys: DataKey[] = ['deepswe', 'terminal_harness', 'swe_atlas', 'tokens_per_task', 'cost_per_task', 'harness'];
const modelMethodology = 'https://artificialanalysis.ai/methodology';
const agentMethodology = 'https://artificialanalysis.ai/methodology/coding-agents-benchmarking';

// Each link opens an AA comparison containing the selected model's current
// published evaluation scores and API prices. Special routes cover the model
// variants whose public comparison slug differs from the release ID.
const modelSources: Record<string, string> = {
  'claude-opus-5-5': 'https://artificialanalysis.ai/models/comparisons/claude-opus-5-5-vs-claude-sonnet-5-5',
  'claude-sonnet-5-5': 'https://artificialanalysis.ai/models/comparisons/claude-sonnet-5-5-vs-claude-opus-5-5',
  'claude-haiku-5-5': 'https://artificialanalysis.ai/models/comparisons/claude-haiku-5-5-vs-claude-opus-5-5',
  'claude-opus-5': 'https://artificialanalysis.ai/models/comparisons/claude-opus-5-vs-claude-opus-5-5',
  'claude-sonnet-5': 'https://artificialanalysis.ai/models/comparisons/claude-sonnet-5-vs-claude-opus-5-5',
  'claude-fable-5-1': 'https://artificialanalysis.ai/models/comparisons/claude-fable-5-1-vs-claude-opus-5-5',
  'gpt-6-astra': 'https://artificialanalysis.ai/models/comparisons/gpt-6-astra-vs-claude-opus-5-5',
  'gpt-6-1-sol': 'https://artificialanalysis.ai/models/comparisons/gpt-6-1-sol-vs-claude-opus-5-5',
  'gpt-6-sol': 'https://artificialanalysis.ai/models/comparisons/gpt-6-sol-vs-claude-opus-5-5',
  'gpt-5-6-sol': 'https://artificialanalysis.ai/models/comparisons/gpt-5-6-sol-vs-claude-opus-5-5',
  'gpt-5-6-terra': 'https://artificialanalysis.ai/models/comparisons/gpt-5-6-terra-vs-claude-opus-5-5',
  'gpt-6-luna': 'https://artificialanalysis.ai/models/comparisons/gpt-6-luna-vs-claude-opus-5-5',
  'gpt-5-6-luna': 'https://artificialanalysis.ai/models/comparisons/gpt-5-6-luna-vs-claude-opus-5-5',
  'gemini-4-argon': 'https://artificialanalysis.ai/models/comparisons/gemini-4-argon-vs-claude-opus-5-5',
  'gemini-3-8-flash': 'https://artificialanalysis.ai/models/comparisons/gemini-3-8-flash-vs-claude-opus-5-5',
  'grok-4-7': 'https://artificialanalysis.ai/models/comparisons/grok-4-7-vs-claude-opus-5-5',
  'muse-spark-1-3-max': 'https://artificialanalysis.ai/models/comparisons/muse-spark-1-3-vs-claude-opus-5-5',
  'qwen3-8-max-0902': 'https://artificialanalysis.ai/models/comparisons/qwen3-8-max-vs-claude-opus-5-5',
  'mimo-v2-6-pro': 'https://artificialanalysis.ai/models/comparisons/mimo-v2-6-pro-vs-claude-opus-5-5',
  'mimo-v2-6-flash': 'https://artificialanalysis.ai/models/comparisons/mimo-v2-6-flash-vs-claude-opus-5-5',
  'deepseek-v4-1-flash': 'https://artificialanalysis.ai/models/comparisons/deepseek-v4-1-flash-vs-claude-opus-5-5',
  'kimi-k3': 'https://artificialanalysis.ai/models/comparisons/kimi-k3-vs-claude-opus-5-5',
  'glm-5-3': 'https://artificialanalysis.ai/models/comparisons/glm-5-3-vs-claude-opus-5-5',
  'glm-5-3-flash': 'https://artificialanalysis.ai/models/comparisons/glm-5-3-flash-vs-claude-opus-5-5',
  'qwen3-8-flash-next': 'https://artificialanalysis.ai/models/comparisons/qwen3-8-flash-next-vs-claude-opus-5-5',
  'qwen3-8-27b-xhigh': 'https://artificialanalysis.ai/models/comparisons/qwen3-8-27b-vs-qwen3-8-max-0803'
};

const agentSources: Record<string, string> = {
  'claude-opus-5-5': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli',
  'claude-sonnet-5-5': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli',
  'claude-haiku-5-5': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli',
  'claude-opus-5': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli',
  'claude-fable-5-1': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli',
  'gpt-6-astra': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-codex',
  'gpt-6-1-sol': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-codex',
  'gpt-6-sol': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-codex',
  'gpt-5-6-sol': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-codex',
  'gpt-6-luna': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-codex',
  'gpt-5-6-luna': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-codex',
  'gemini-4-argon': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/antigravity-cli-vs-claude-code',
  'gemini-3-8-flash': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/antigravity-sdk-vs-claude-code',
  'grok-4-7': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/grok-build-vs-claude-code',
  'muse-spark-1-3-max': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/muse-code-vs-claude-code',
  'qwen3-8-max-0902': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli',
  'kimi-k3': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-kimi-code-cli',
  'glm-5-3': 'https://artificialanalysis.ai/agents/coding-agents/comparisons/claude-code-vs-opencode'
};

function fields(keys: DataKey[], sourceUrl: string, methodologyUrl: string, extra: Provenance = {}) {
  return Object.fromEntries(keys.map(key => [key, {
    source: 'Artificial Analysis', sourceUrl, methodologyUrl, checkedDate, ...extra
  } satisfies Provenance]));
}

const allSources: Record<string, Partial<Record<DataKey, Provenance>>> = Object.fromEntries(
  Object.entries(modelSources).map(([id, sourceUrl]) => [id,
    fields(modelKeys, sourceUrl, modelMethodology, { notes: 'Value checked against the selected model column on the linked AA comparison page.' })
  ])
);
for (const [id, sourceUrl] of Object.entries(agentSources)) {
  allSources[id] = {
    ...allSources[id],
    ...fields(agentKeys, sourceUrl, agentMethodology, { notes: 'Agent metrics checked against the matching model and harness row on the linked AA comparison page.' })
  };
}

export const provenance: Record<string, Partial<Record<DataKey, Provenance>>> = {
  ...allSources,
  'claude-haiku-5-5': {
    ...fields(modelKeys, modelSources['claude-haiku-5-5'], modelMethodology, { effort: 'max', notes: 'Value checked against the selected model column on the linked AA comparison page.' }),
    ...fields(agentKeys, agentSources['claude-haiku-5-5'], agentMethodology, { harness: 'Claude Code', effort: 'max', notes: 'Agent metrics checked against the matching model and harness row on the linked AA comparison page.' }),
    automation: {
      source: 'Artificial Analysis', sourceUrl: modelSources['claude-haiku-5-5'],
      methodologyUrl: modelMethodology, checkedDate, effort: 'max',
      notes: 'AA reports possible safety-refusal effects and plans to retest. The stored score is the current published display value.'
    },
    input_price: {
      source: 'Anthropic', sourceUrl: 'https://www.anthropic.com/claude-haiku-5-5', checkedDate,
      notes: 'Prompt ≤100K tokens. Above 100K: $0.50 input / $2.50 output per 1M tokens.'
    },
    output_price: {
      source: 'Anthropic', sourceUrl: 'https://www.anthropic.com/claude-haiku-5-5', checkedDate,
      notes: 'Prompt ≤100K tokens. Above 100K: $0.50 input / $2.50 output per 1M tokens.'
    }
  },
  'gemini-4-argon': {
    ...fields(modelKeys, modelSources['gemini-4-argon'], modelMethodology, { effort: 'high', notes: 'Value checked against the selected Gemini 4 Argon (high) column on the linked AA comparison page.' }),
    ...fields(agentKeys, agentSources['gemini-4-argon'], agentMethodology, { harness: 'Antigravity CLI', effort: 'high', notes: 'Agent metrics checked against the Gemini 4 Argon row on the linked AA comparison page.' })
  },
  'qwen3-8-max-0902': {
    ...fields(modelKeys, modelSources['qwen3-8-max-0902'], modelMethodology, { notes: 'Model scores and prices are for Qwen3.8 Max (0902). The agent comparison labels its tested variant Qwen3.8 Max without the 0902 suffix.' }),
    ...fields(agentKeys, agentSources['qwen3-8-max-0902'], agentMethodology, { harness: 'Claude Code', notes: 'AA labels this tested agent variant Qwen3.8 Max without the 0902 suffix; the table retains that version caveat.' })
  }
} as Record<string, Partial<Record<DataKey, Provenance>>>;
