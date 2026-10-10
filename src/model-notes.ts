// English display translations of the existing snapshot notes. Benchmark values
// and the source notes stored in D1 remain unchanged.
export const englishModelNotes: Record<string, string> = {
  'claude-haiku-5-5': 'Haiku 5.5: model and Claude Code results both use max effort. Input / output prices apply to prompts up to 100K tokens; above 100K, prices are $0.50 / $2.50 per 1M tokens. AA reports that the AutomationBench score of 35% may be affected by safety refusals and plans to retest. Agent Cost / Task uses the value currently reported by AA. Source checked: 2026-10-10.',
  'gemini-4-argon': 'Gemini 4 Argon: model results use high reasoning; agent results use AA’s Antigravity CLI / Gemini 4 Argon configuration. AA’s runtime / cost chart labels the setting high. Source checked: 2026-10-10.',
  'muse-spark-1-3-max': 'Muse Spark 1.3: model and Muse Code results use max effort. Max is the reasoning setting and is omitted from the display name.',
  'mimo-v2-6-flash': 'MiMo-V2.6-Flash: uses AA’s current reasoning-model results and MIT open weights. This model was not found in AA’s available coding-agent comparison list, so agent metrics remain blank. The $0.06 / task figure from AA’s Intelligence Index is not the Agent Cost / Task shown in this table. Source checked: 2026-10-10.'
};
