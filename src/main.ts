import { metrics, type MetricKey, type Model, type Snapshot } from './shared';

function get<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: ${id}`);
  return el as T;
}
const search = get<HTMLInputElement>('modelSearch');
const provider = get<HTMLSelectElement>('providerFilter');
const group = get<HTMLSelectElement>('groupFilter');
const harness = get<HTMLSelectElement>('harnessFilter');
const compareButton = get<HTMLButtonElement>('compareSelected');
const clearButton = get<HTMLButtonElement>('clearSelection');
const status = get<HTMLDivElement>('appStatus');
const tbody = document.querySelector('tbody')!;
let models: Model[] = [];
let compareMode = false;
const selected = new Set<string>();
const metricMap = new Map(metrics.map(metric => [metric.key, metric]));

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}
function formatMetric(key: MetricKey, value: number | null) {
  if (value === null) return '—';
  if (key === 'tokens_per_task') return value >= 1e6 ? `${Number((value / 1e6).toFixed(2))}M` : `${Number((value / 1e3).toFixed(2))}K`;
  if (key === 'cost_per_task') return `$${value.toFixed(2)}`;
  return String(value);
}
function metricCell(model: Model, key: MetricKey, visible: Model[]) {
  const value = model[key], meta = metricMap.get(key)!;
  const cell = element('td', value === null ? 'na' : meta.lower ? 'efficiency' : 'num', formatMetric(key, value));
  if (value !== null) {
    const values = models.map(m => m[key]).filter((v): v is number => v !== null);
    const min = Math.min(...values), max = Math.max(...values);
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    const score = meta.lower ? 1 - ratio : ratio;
    cell.style.backgroundColor = `hsl(142 43% ${97 - score * 17}%)`;
    if (compareMode && visible.length >= 2) {
      const compared = visible.map(m => m[key]).filter((v): v is number => v !== null);
      const best = meta.lower ? Math.min(...compared) : Math.max(...compared);
      cell.classList.toggle('compare-best', value === best);
    }
  }
  return cell;
}
function render() {
  const query = search.value.trim().toLowerCase();
  const visible = models.filter(model => {
    const haystack = `${model.name} ${model.provider} ${model.harness ?? ''}`.toLowerCase();
    return (!query || haystack.includes(query)) &&
      (!provider.value || model.provider_id === provider.value) &&
      (!group.value || model.model_type === group.value) &&
      (!harness.value || Boolean(model.harness) === (harness.value === 'yes')) &&
      (!compareMode || selected.has(model.id));
  });
  const fragment = document.createDocumentFragment();
  for (const modelType of ['closed', 'open'] as const) {
    const members = visible.filter(m => m.model_type === modelType);
    if (!members.length) continue;
    const section = element('tr', 'section');
    const heading = element('td', '', modelType === 'closed' ? 'Proprietary Models (Closed)' : 'Open Models (Open Weights)');
    heading.colSpan = 15;
    section.append(heading);
    fragment.append(section);
    for (const model of members) {
      const row = element('tr', selected.has(model.id) ? 'is-selected' : '');
      row.dataset.model = model.id;
      const nameCell = element('td', 'model');
      const wrapper = element('div', 'model-cell');
      const label = element('label', 'compare-check');
      const checkbox = element('input', 'row-select');
      checkbox.type = 'checkbox';
      checkbox.checked = selected.has(model.id);
      checkbox.setAttribute('aria-label', `Select ${model.name} for comparison`);
      checkbox.addEventListener('change', () => {
        checkbox.checked ? selected.add(model.id) : selected.delete(model.id);
        if (selected.size < 2) compareMode = false;
        render();
      });
      label.append(checkbox, element('span', 'checkmark'));
      const logo = element('span', 'logo');
      const image = element('img');
      image.src = `/icons/${model.icon_key}`;
      image.alt = model.provider;
      logo.append(image);
      const name = element('span', 'model-name', model.name);
      if (model.note) name.title = model.note;
      wrapper.append(label, logo, name);
      if (model.tag) wrapper.append(element('span', model.tag === 'NEW' ? 'tag new' : 'tag star', model.tag));
      nameCell.append(wrapper);
      nameCell.addEventListener('click', event => {
        if ((event.target as Element).closest('.compare-check')) return;
        selected.has(model.id) ? selected.delete(model.id) : selected.add(model.id);
        if (selected.size < 2) compareMode = false;
        render();
      });
      row.append(nameCell, element('td', 'provider', model.provider), element('td', 'price', `$${model.input_price} / $${model.output_price}`));
      for (const metric of metrics) {
        if (metric.key === 'deepswe') row.append(element('td', model.harness ? 'harness' : 'harness na', model.harness ?? '—'));
        row.append(metricCell(model, metric.key, visible));
      }
      fragment.append(row);
    }
  }
  tbody.replaceChildren(fragment);
  get('visibleCount').textContent = `${visible.length} / ${models.length} models`;
  const count = get('selectedCount');
  count.textContent = `${selected.size} selected`;
  count.classList.toggle('active', selected.size > 0);
  compareButton.disabled = selected.size < 2;
  compareButton.textContent = compareMode ? 'Exit comparison' : 'Compare selected';
  clearButton.disabled = selected.size === 0;
  document.body.classList.toggle('compare-mode', compareMode);
  get('noResults').classList.toggle('show', visible.length === 0);
}

for (const control of [search, provider, group, harness]) control.addEventListener(control === search ? 'input' : 'change', render);
get('resetFilters').addEventListener('click', () => {
  search.value = provider.value = group.value = harness.value = '';
  compareMode = false;
  render();
});
clearButton.addEventListener('click', () => { selected.clear(); compareMode = false; render(); });
compareButton.addEventListener('click', () => { compareMode = !compareMode; render(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && compareMode) { compareMode = false; render(); }
});

async function load() {
  status.hidden = false;
  status.textContent = '正在加载模型数据…';
  try {
    const response = await fetch('/api/snapshot');
    if (!response.ok) throw new Error('Request failed');
    const snapshot: Snapshot = await response.json();
    models = snapshot.models;
    document.querySelector('.subtitle')!.textContent = `${models.length} Models · 9 Benchmarks · AA Overall vs. Model Capability vs. Coding Agent + Harness`;
    const notes = [...new Set(models.map(m => m.note).filter((note): note is string => Boolean(note)))];
    document.querySelector('.notes')!.replaceChildren(...notes.map(note => element('div', 'note', note)));
    provider.replaceChildren(new Option('All providers', ''));
    const providers = new Map(models.map(m => [m.provider_id, m.provider]));
    for (const [id, name] of [...providers].sort((a, b) => a[1].localeCompare(b[1]))) provider.add(new Option(name, id));
    get('dataDate').textContent = snapshot.dataDate ? `Data as of ${snapshot.dataDate}` : 'No data available';
    status.hidden = models.length > 0;
    if (!models.length) status.textContent = '暂无模型数据，请先导入最新数据。';
    render();
  } catch {
    status.replaceChildren(element('span', '', '模型数据加载失败。'), element('button', 'btn ghost', '重试'));
    status.querySelector('button')!.addEventListener('click', load);
    get('visibleCount').textContent = 'Unavailable';
  }
}
void load();
