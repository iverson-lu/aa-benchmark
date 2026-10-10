import { metrics, type MetricKey, type Model, type Snapshot } from './shared';
import { derive, numeric, deltaNote, valueNote, type Derived } from './analysis';
import { views, validView, column, type ViewKey, type ColumnKey } from './views';
import { element, formatMetric } from './dom';
import { addProvenance, details } from './provenance';
import { renderChart } from './chart';
import { renderComparison } from './compare';
import { latestModels, modelFamily } from './families';
import { englishModelNotes } from './model-notes';

function get<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id); if (!el) throw new Error(`Missing element: ${id}`); return el as T;
}
const search = get<HTMLInputElement>('modelSearch');
const provider = get<HTMLSelectElement>('providerFilter');
const group = get<HTMLSelectElement>('groupFilter');
const harness = get<HTMLSelectElement>('harnessFilter');
const viewSelector = get<HTMLSelectElement>('viewPreset');
const historyCheckbox = get<HTMLInputElement>('showAllVersions');
const compareButton = get<HTMLButtonElement>('compareSelected');
const clearButton = get<HTMLButtonElement>('clearSelection');
const status = get<HTMLDivElement>('appStatus');
const dialog = get<HTMLDialogElement>('comparisonDialog');
const tbody = document.querySelector('tbody')!;
const table = get<HTMLTableElement>('benchmarkTable');
// Col widths can expand on wide screens. Measure actual widths so frozen columns
// remain aligned rather than assuming the minimum colgroup sizes.
function syncFrozenColumns() {
  const name = table.querySelector<HTMLElement>('thead .col-name');
  const provider = table.querySelector<HTMLElement>('thead .col-provider');
  if (name) table.style.setProperty('--model-width', `${name.getBoundingClientRect().width}px`);
  if (provider) table.style.setProperty('--provider-width', `${provider.getBoundingClientRect().width}px`);
}
new ResizeObserver(syncFrozenColumns).observe(table);
let models: Model[] = [];
let derived = new Map<string, Derived>();
let view: ViewKey = 'overview';
let chartExpanded = false;
const selected = new Set<string>();
try { view = validView(localStorage.getItem('aa-benchmark-view')); } catch { /* Storage can be disabled. */ }
try { historyCheckbox.checked = localStorage.getItem('aa-benchmark-all-versions') === 'true'; } catch { /* Default: latest only. */ }
viewSelector.replaceChildren(...Object.entries(views).map(([key, preset]) => new Option(preset.label, key)));
viewSelector.value = view;

function toggleSelection(id: string) {
  if (selected.has(id)) selected.delete(id);
  else if (selected.size < 5) selected.add(id);
  else { get('selectionMessage').textContent = 'Compare up to 5 models. Remove one to select another.'; return; }
  get('selectionMessage').textContent = ''; render();
}
function filteredModels() {
  const query = search.value.trim().toLowerCase();
  // Choose the latest version before other filters, so a query or missing
  // harness does not silently promote an older version back into the table.
  const candidates = historyCheckbox.checked ? models : latestModels(models);
  return candidates.filter(model => {
    const haystack = `${model.name} ${modelFamily(model).name} ${model.provider} ${model.harness ?? ''}`.toLowerCase();
    return (!query || haystack.includes(query)) && (!provider.value || model.provider_id === provider.value) &&
      (!group.value || model.model_type === group.value) && (!harness.value || Boolean(model.harness) === (harness.value === 'yes'));
  });
}
function renderHeaders(columns: ColumnKey[]) {
  const groups = element('tr', 'header-groups'), headers = element('tr');
  const names: Record<string, string> = { meta: 'Model Info', aa: 'AA Overall', model: 'Model Capability', agent: 'Coding Agent + Harness' };
  for (const key of columns) {
    const meta = column(key), last = groups.lastElementChild as HTMLTableCellElement | null;
    if (last?.dataset.group === meta.group) last.colSpan++;
    else { const th = element('th', `head-${meta.group}`, names[meta.group]); th.scope = 'colgroup'; th.dataset.group = meta.group; groups.append(th); }
    const th = element('th', `head-${meta.group} col-${key}`, meta.label); th.scope = 'col';
    if (meta.unit) th.append(element('small', '', meta.unit));
    if (key === 'delta') th.title = deltaNote;
    if (key === 'value') th.title = valueNote;
    headers.append(th);
  }
  table.querySelector('thead')!.replaceChildren(groups, headers);
  const colgroup = element('colgroup');
  const width = (key: ColumnKey) => key === 'name' ? 310 : key === 'provider' ? 105 : key === 'price' ? 125 : key === 'harness' ? 245 : 112;
  for (const key of columns) { const col = element('col'); col.style.width = `${width(key)}px`; colgroup.append(col); }
  table.querySelector('colgroup')?.remove(); table.prepend(colgroup);
  table.style.minWidth = `${columns.reduce((sum, key) => sum + width(key), 0)}px`;
}
function metricCell(model: Model, key: MetricKey) {
  const value = numeric(model[key]), meta = metrics.find(metric => metric.key === key)!;
  const cell = element('td', value === null ? 'na' : meta.lower ? 'efficiency' : 'num', value === null ? details(model, key)?.status ?? '—' : formatMetric(key, value));
  if (value !== null) {
    const values = models.flatMap(model => numeric(model[key]) === null ? [] : [numeric(model[key])!]);
    const min = Math.min(...values), max = Math.max(...values), ratio = max === min ? 0.5 : (value - min) / (max - min);
    cell.style.backgroundColor = `hsl(142 43% ${97 - (meta.lower ? 1 - ratio : ratio) * 17}%)`;
  }
  addProvenance(cell, model, [key]); return cell;
}
function nameCell(model: Model) {
  const cell = element('td', 'model col-name'), wrapper = element('div', 'model-cell'), label = element('label', 'compare-check');
  const checkbox = element('input', 'row-select'); checkbox.type = 'checkbox'; checkbox.checked = selected.has(model.id);
  checkbox.disabled = selected.size >= 5 && !selected.has(model.id);
  checkbox.setAttribute('aria-label', `Select ${model.name} for comparison`);
  checkbox.addEventListener('change', () => { toggleSelection(model.id); table.querySelector<HTMLInputElement>(`tr[data-model="${model.id}"] .row-select`)?.focus(); });
  label.append(checkbox, element('span', 'checkmark'));
  const logo = element('span', 'logo'), image = element('img'); image.src = `/icons/${model.icon_key}`; image.alt = model.provider; logo.append(image);
  const name = element('span', 'model-name', model.name); if (model.note) name.title = model.note;
  const family = modelFamily(model);
  cell.dataset.family = family.id;
  if (family.versions.length > 1) name.title = `${family.name} family${model.note ? ` · ${model.note}` : ''}`;
  wrapper.append(label, logo, name);
  if (model.tag) wrapper.append(element('span', model.tag === 'NEW' ? 'tag new' : model.tag === 'PREV' ? 'tag prev' : 'tag star', model.tag));
  cell.append(wrapper);
  cell.addEventListener('click', event => { if (!(event.target as Element).closest('.compare-check')) toggleSelection(model.id); });
  return cell;
}
function cell(model: Model, key: ColumnKey): HTMLTableCellElement {
  if (key === 'name') return nameCell(model);
  if (key === 'provider') return element('td', 'provider col-provider', model.provider);
  if (key === 'price') { const td = element('td', 'price col-price', `$${model.input_price} / $${model.output_price}`); addProvenance(td, model, ['input_price', 'output_price']); return td; }
  if (key === 'harness') { const td = element('td', model.harness ? 'harness' : 'harness na', model.harness ?? '—'); addProvenance(td, model, ['harness']); return td; }
  if (key === 'delta' || key === 'value') {
    const value = derived.get(model.id)![key];
    const td = element('td', value === null ? 'na' : key === 'value' ? 'efficiency' : value > 0 ? 'delta-positive' : value < 0 ? 'delta-negative' : 'num', value === null ? key === 'value' ? 'N/A' : '—' : key === 'value' ? value.toFixed(1) : `${value > 0 ? '+' : ''}${Number(value.toFixed(2))}`);
    td.title = key === 'delta' ? deltaNote : valueNote; return td;
  }
  return metricCell(model, key);
}
function updateComparison() {
  const compared = models.filter(model => selected.has(model.id));
  if (!compared.length) { dialog.close(); return; }
  renderComparison(dialog, compared, derived, selected, id => {
    selected.delete(id); render(); dialog.querySelector<HTMLButtonElement>('.comparison-identity button')?.focus();
  }, () => { selected.clear(); dialog.close(); render(); });
}
function render() {
  const visible = filteredModels(), columns: ColumnKey[] = views[view].columns;
  renderHeaders(columns);
  const fragment = document.createDocumentFragment();
  for (const modelType of ['closed', 'open'] as const) {
    const members = visible.filter(model => model.model_type === modelType); if (!members.length) continue;
    const section = element('tr', 'section'), heading = element('td', '', modelType === 'closed' ? 'Proprietary Models (Closed)' : 'Open Models (Open Weights)');
    heading.colSpan = columns.length; section.append(heading); fragment.append(section);
    for (const model of members) { const row = element('tr', selected.has(model.id) ? 'is-selected' : ''); row.dataset.model = model.id; for (const key of columns) row.append(cell(model, key)); fragment.append(row); }
  }
  tbody.replaceChildren(fragment);
  syncFrozenColumns();
  get('visibleCount').textContent = `${visible.length} / ${models.length} models`;
  get('selectedCount').textContent = `${selected.size} / 5 selected`; get('selectedCount').classList.toggle('active', selected.size > 0);
  const hiddenSelected = [...selected].filter(id => !visible.some(model => model.id === id)).length;
  get('selectedCount').title = hiddenSelected ? `${hiddenSelected} selected model(s) hidden by the current filters; comparison still includes them.` : '';
  const hiddenVersions = models.length - latestModels(models).length;
  get('versionHint').textContent = historyCheckbox.checked ? 'Showing all versions' : `Latest version per family · ${hiddenVersions} historical versions hidden`;
  compareButton.disabled = selected.size < 2; clearButton.disabled = selected.size === 0;
  get('noResults').classList.toggle('show', visible.length === 0);
  const chart = get('efficiencyChart'); chart.hidden = view !== 'efficiency' && !chartExpanded;
  if (!chart.hidden) renderChart(chart, visible, derived, selected);
  const chartButton = get<HTMLButtonElement>('toggleChart'); chartButton.textContent = !chart.hidden ? 'Hide Cost / Performance' : 'Cost / Performance'; chartButton.setAttribute('aria-expanded', String(!chart.hidden));
  if (dialog.open) updateComparison();
}
for (const control of [search, provider, group, harness]) control.addEventListener(control === search ? 'input' : 'change', render);
historyCheckbox.addEventListener('change', () => {
  try { localStorage.setItem('aa-benchmark-all-versions', String(historyCheckbox.checked)); } catch { /* Non-persistent fallback. */ }
  render();
});
viewSelector.addEventListener('change', () => {
  view = validView(viewSelector.value); try { localStorage.setItem('aa-benchmark-view', view); } catch { /* Non-persistent fallback. */ }
  get('tableScroll').scrollLeft = 0; render();
});
get('resetFilters').addEventListener('click', () => { search.value = provider.value = group.value = harness.value = ''; render(); });
get('toggleChart').addEventListener('click', () => {
  if (view === 'efficiency') { const chart = get('efficiencyChart'); chart.hidden = !chart.hidden; get('toggleChart').textContent = chart.hidden ? 'Cost / Performance' : 'Hide Cost / Performance'; get('toggleChart').setAttribute('aria-expanded', String(!chart.hidden)); }
  else { chartExpanded = !chartExpanded; render(); }
});
clearButton.addEventListener('click', () => { selected.clear(); get('selectionMessage').textContent = ''; render(); });
compareButton.addEventListener('click', () => { if (selected.size >= 2) { updateComparison(); dialog.showModal(); } });
dialog.addEventListener('close', () => (compareButton.disabled ? viewSelector : compareButton).focus());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
async function load() {
  status.hidden = false; status.textContent = 'Loading model data…';
  try {
    const response = await fetch('/api/snapshot'); if (!response.ok) throw new Error('Request failed');
    const snapshot: Snapshot = await response.json();
    models = snapshot.models.map(model => ({ ...model, note: model.note ? englishModelNotes[model.id] ?? model.note : null }));
    derived = derive(models);
    document.querySelector('.subtitle')!.textContent = `${models.length} Models · 9 Benchmarks · Model Decision Dashboard`;
    const notes = [...new Set(models.map(model => model.note).filter((note): note is string => Boolean(note)))]; document.querySelector('.notes')!.replaceChildren(...notes.map(note => element('div', 'note', note)));
    provider.replaceChildren(new Option('All providers', '')); const providers = new Map(models.map(model => [model.provider_id, model.provider]));
    for (const [id, name] of [...providers].sort((a, b) => a[1].localeCompare(b[1]))) provider.add(new Option(name, id));
    get('dataDate').textContent = snapshot.dataDate ? `Data as of ${snapshot.dataDate}` : 'No data available';
    status.hidden = models.length > 0; if (!models.length) status.textContent = 'No model data available. Import the latest snapshot to get started.'; render();
  } catch (error) {
    console.error('Snapshot load failed', error); status.replaceChildren(element('span', '', 'Could not load model data.'), element('button', 'btn ghost', 'Retry'));
    status.querySelector('button')!.addEventListener('click', load); get('visibleCount').textContent = 'Unavailable';
  }
}
void load();
