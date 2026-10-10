import { metrics, type MetricKey, type Model } from './shared';
import { capabilityKeys, agentKeys, numeric, normalize, rank, winners, deltaNote, valueNote, agentIndexNote, agentIndexMethodologyUrl, type Derived } from './analysis';
import { element, button, formatMetric } from './dom';
import { addProvenance, details } from './provenance';
import { renderChart } from './chart';

export function renderComparison(dialog: HTMLDialogElement, models: Model[], derived: Map<string, Derived>, selected: Set<string>, remove: (id: string) => void, clear: () => void) {
  const body = element('div', 'comparison-body'), header = element('div', 'comparison-header'), title = element('div');
  title.append(element('h2', '', 'Model Decision Dashboard'), element('p', 'analysis-note', `${models.length} selected models · scores compared within each benchmark`));
  const actions = element('div', 'toolbar-right'); actions.append(button('Clear comparison', clear), button('Close', () => dialog.close())); header.append(title, actions);
  const summaries = element('div', 'comparison-summary');
  const sameCoverage = agentKeys.every(key => models.every(model => (numeric(model[key]) !== null) === (numeric(models[0]?.[key]) !== null)));
  // With no official model aggregate, only declare a capability winner with
  // complete coverage and dominance across all five individual model metrics.
  const bestCapability = models.length >= 2 && models.every(model => capabilityKeys.every(key => numeric(model[key]) !== null))
    ? models.filter(model => models.every(other => capabilityKeys.every(key => numeric(model[key])! >= numeric(other[key])!))) : [];
  const config: [string, Model[], string][] = [
    ['Best Overall', winners(models, model => numeric(model.intelligence)), 'AA Intelligence'],
    ['Best Model Capability', bestCapability, 'Dominates across 5 model benchmarks; otherwise no single winner'],
    ['Best Coding Agent', sameCoverage ? winners(models, model => derived.get(model.id)!.agentIndex) : [], 'AA Coding Agent Index v1.5 · official formula recomputation · 3/3 metrics required'],
    ['Lowest Cost / Task', winners(models, model => numeric(model.cost_per_task), true), 'Reported task cost'],
    ['Lowest Tokens / Task', winners(models, model => numeric(model.tokens_per_task), true), 'Reported task token usage'],
    ['Best Value', sameCoverage ? winners(models, model => derived.get(model.id)!.value) : [], 'Internal Value Index; requires matching metric coverage']
  ];
  for (const [label, winning, definition] of config) {
    const card = element('div', 'summary-card');
    card.append(element('span', 'summary-label', label), element('strong', '', winning.length ? winning.map(model => model.name).join(' / ') : 'No supported winner'), element('small', '', `${winning.length > 1 ? 'Tie · ' : ''}${definition}`)); summaries.append(card);
  }
  body.append(summaries);
  const scroll = element('div', 'comparison-scroll'), grid = element('div', 'comparison-grid'); grid.style.setProperty('--compare-count', String(models.length));
  const identities = element('div', 'comparison-identities');
  for (const model of models) {
    const card = element('div', 'comparison-identity'), action = button('Remove', () => remove(model.id)); action.setAttribute('aria-label', `Remove ${model.name} from comparison`);
    card.append(element('strong', '', model.name), element('small', '', model.provider), action); identities.append(card);
  }
  grid.append(identities);
  function section(title: string, note: string) {
    const node = element('section', 'comparison-section'); node.append(element('h3', '', title), element('p', 'analysis-note', note)); grid.append(node); return node;
  }
  function benchmarks(title: string, keys: readonly MetricKey[], note: string) {
    const node = section(title, note);
    for (const key of keys) {
      const metric = metrics.find(metric => metric.key === key)!, row = element('div', 'comparison-metric');
      const values = models.flatMap(model => numeric(model[key]) === null ? [] : [numeric(model[key])!]);
      const best = values.length ? (metric.lower ? Math.min : Math.max)(...values) : null;
      for (const model of models) {
        const value = numeric(model[key]);
        const card = element('div', `metric-card ${value !== null && value === best && values.length >= 2 ? 'metric-best' : ''}`);
        const score = element('strong', '', value === null ? details(model, key)?.status ?? '—' : formatMetric(key, value)); addProvenance(score, model, [key]); card.append(score);
        if (value !== null && values.length >= 2) {
          const delta = value - best!;
          card.append(element('span', 'metric-rank', `#${rank(value, values, metric.lower)}${delta === 0 ? ' · Best available' : ` · ${metric.lower ? '+' : '−'}${formatMetric(key, Math.abs(delta))} vs best`}`));
          const track = element('div', 'metric-track'), fill = element('span');
          // Each bar is scaled within its benchmark, never against another benchmark.
          fill.style.width = `${12 + 88 * (metric.lower ? 1 - normalize(value, values) / 100 : normalize(value, values) / 100)}%`; track.append(fill); card.append(track);
        } else card.append(element('span', 'metric-rank', value === null ? 'No score available' : 'Only available score'));
        row.append(card);
      }
      node.append(element('h4', '', `${metric.label} · ${metric.unit}`), row);
    }
  }
  benchmarks('Model Capability', ['intelligence', ...capabilityKeys], 'AA Overall and raw model results. Bars and ranks apply to each benchmark; scales are not interchangeable.');
  const harness = section('Agent Harness', 'Harness and effort configuration as recorded in the source data.'), harnessRow = element('div', 'comparison-metric');
  for (const model of models) { const card = element('div', 'metric-card harness-card', model.harness ?? '—'); addProvenance(card, model, ['harness']); harnessRow.append(card); } harness.append(harnessRow);
  benchmarks('Coding Agent Performance', agentKeys, 'Best available is scoped to reported results, including ties; missing results are not ranked.');
  const indexSection = section('AA Coding Agent Index v1.5 · Recomputed', agentIndexNote);
  const indexSource = element('a', 'analysis-note', 'AA official methodology ↗');
  indexSource.href = agentIndexMethodologyUrl; indexSource.target = '_blank'; indexSource.rel = 'noopener noreferrer';
  const indexRow = element('div', 'comparison-metric');
  const indices = models.flatMap(model => derived.get(model.id)!.agentIndex === null ? [] : [derived.get(model.id)!.agentIndex!]);
  for (const model of models) {
    const d = derived.get(model.id)!, index = d.agentIndex;
    const card = element('div', `metric-card ${index !== null && indices.length >= 2 && index === Math.max(...indices) ? 'metric-best' : ''}`);
    card.append(element('strong', '', index === null ? 'N/A' : index.toFixed(1)), element('small', '', `Agent metric coverage: ${d.coverage}/3`));
    if (index !== null && indices.length >= 2) card.append(element('span', 'metric-rank', `#${rank(index, indices)}`));
    indexRow.append(card);
  }
  indexSection.append(indexSource, indexRow);
  const impact = section('Model → Harness Impact', deltaNote), impactRow = element('div', 'comparison-metric');
  for (const model of models) {
    const delta = derived.get(model.id)!.delta, card = element('div', 'metric-card');
    card.append(element('small', '', 'Terminal-Bench 4.0'), element('strong', '', `${formatMetric('terminal_model', numeric(model.terminal_model))} → ${formatMetric('terminal_harness', numeric(model.terminal_harness))}`), element('span', delta === null ? 'na' : delta > 0 ? 'delta-positive' : delta < 0 ? 'delta-negative' : '', delta === null ? 'Δ —' : `Δ ${delta > 0 ? '+' : ''}${Number(delta.toFixed(2))} pts`)); impactRow.append(card);
  }
  impact.append(impactRow);
  const prices = section('API Price', 'USD per 1M tokens · Input / Output. Task costs come from the dataset, not an estimate from this price.'), priceRow = element('div', 'comparison-metric');
  for (const model of models) { const card = element('div', 'metric-card'), price = element('strong', '', `$${model.input_price} / $${model.output_price}`); addProvenance(price, model, ['input_price', 'output_price']); card.append(price); priceRow.append(card); } prices.append(priceRow);
  benchmarks('Task Efficiency', ['tokens_per_task', 'cost_per_task'], 'Lower is better. API price, tokens and task cost remain distinct measurements.');
  const valueSection = section('Value Index · Internal', valueNote), valueRow = element('div', 'comparison-metric');
  const values = models.flatMap(model => derived.get(model.id)!.value === null ? [] : [derived.get(model.id)!.value!]);
  for (const model of models) {
    const d = derived.get(model.id)!, value = d.value, card = element('div', `metric-card ${value !== null && value === Math.max(...values) && values.length >= 2 ? 'metric-best' : ''}`);
    card.append(element('strong', '', value === null ? 'N/A' : value.toFixed(1)), element('small', '', `Agent metric coverage: ${d.coverage}/3`)); valueRow.append(card);
  }
  valueSection.append(valueRow, element('p', 'analysis-note', agentIndexNote)); scroll.append(grid); body.append(scroll);
  const chart = element('section', 'comparison-chart'); renderChart(chart, models, derived, selected); body.append(chart);
  if (models.length < 2) body.prepend(element('p', 'analysis-note', 'Select another model in the table to compare. Close keeps your remaining selection.'));
  dialog.replaceChildren(header, body);
}

