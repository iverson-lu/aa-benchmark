import { type Model } from './shared';

export interface ModelFamily {
  id: string;
  name: string;
  // Explicit newest-first order: never infer release order from data_date,
  // scores, NEW tags, or strings such as "6.1" and "6".
  versions: readonly string[];
}
export const modelFamilies: readonly ModelFamily[] = [
  { id: 'gpt-sol', name: 'GPT Sol', versions: ['gpt-6-1-sol', 'gpt-6-sol', 'gpt-5-6-sol'] },
  { id: 'gpt-luna', name: 'GPT Luna', versions: ['gpt-6-luna', 'gpt-5-6-luna'] },
  { id: 'claude-opus', name: 'Claude Opus', versions: ['claude-opus-5-5', 'claude-opus-5'] },
  { id: 'claude-sonnet', name: 'Claude Sonnet', versions: ['claude-sonnet-5-5', 'claude-sonnet-5'] }
];
const familyByModel = new Map(modelFamilies.flatMap(family => family.versions.map(id => [id, family] as const)));
export function modelFamily(model: Model): ModelFamily {
  // Unconfigured models remain independent, visible entries. Different product
  // lines (Astra/Terra, Argon/Flash, Pro/Flash, etc.) are not implicitly merged.
  return familyByModel.get(model.id) ?? { id: model.id, name: model.name, versions: [model.id] };
}
export function latestModels(models: Model[]): Model[] {
  const present = new Set(models.map(model => model.id));
  const latest = new Set(models.map(model => modelFamily(model).versions.find(id => present.has(id))!));
  // Preserve the benchmark table's existing order and closed/open grouping.
  return models.filter(model => latest.has(model.id));
}
