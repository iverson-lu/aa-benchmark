import { agentKeys, numeric, paretoFrontier, agentIndexNote, valueNote, agentIndexMethodologyUrl, type Derived } from './analysis';
import { element, formatMetric } from './dom';
import { type Model } from './shared';

const NS = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, text = '') {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  node.textContent = text; return node;
}
export function renderChart(container: HTMLElement, models: Model[], derived: Map<string, Derived>, selected: Set<string>) {
  container.replaceChildren();
  const heading = element('div', 'analysis-heading');
  const legend = element('div', 'chart-legend');
  legend.append(element('span', 'legend-frontier', '● Pareto-efficient'), element('span', '', '◯ Other models'), element('span', 'legend-selected', '◆ Selected models'));
  heading.append(element('h3', '', 'Cost / Performance'), legend);
  container.append(heading);
  const points = models.flatMap(model => {
    const cost = numeric(model.cost_per_task), agentIndex = derived.get(model.id)!.agentIndex;
    return cost !== null && cost >= 0 && agentIndex !== null ? [{ id: model.id, cost, agentIndex, model }] : [];
  });
  const frontier = paretoFrontier(points);
  container.append(element('p', 'chart-guide', 'Reading the chart: farther left means lower cost per task; higher means stronger coding-agent performance. The upper-left is more attractive.'), element('p', 'chart-guide', 'Green points are Pareto-efficient: no shown model has both equal or lower cost and equal or higher performance, with at least one strictly better. They represent tradeoffs at different budgets.'), element('p', 'analysis-note', 'The Y axis uses AA Coding Agent Index v1.5, recomputed as the equal-weight mean of DeepSWE v1.1, Terminal-Bench 4.0 Harness, and SWE-Atlas-QnA. No normalization; all three scores are required. Stored display scores may introduce rounding differences.'));
  const caption = element('span', '', `${points.length} / ${models.length} models plotted · Hover or focus for details`);
  const controls = element('div', 'chart-controls');
  const lineLabel = element('label'), lineToggle = element('input');
  lineToggle.type = 'checkbox'; lineToggle.disabled = true; lineLabel.append(lineToggle, element('span', '', 'Connect Pareto points'));
  controls.append(caption, lineLabel); container.append(controls);
  const sourceLink = element('a', '', 'AA official methodology ↗');
  sourceLink.href = agentIndexMethodologyUrl; sourceLink.target = '_blank'; sourceLink.rel = 'noopener noreferrer';
  controls.append(sourceLink);
  if (!points.length) {
    container.append(element('p', 'chart-empty', 'No eligible models: a known task cost and all 3 valid agent benchmarks are required.'));
  } else {
    const plot = element('div', 'chart-plot');
    const tooltip = element('div', 'chart-tooltip'); tooltip.hidden = true; tooltip.setAttribute('role', 'status');
    const chart = svg('svg', { viewBox: '0 0 1000 340', role: 'group', 'aria-label': 'Cost per task versus AA Coding Agent Index scatter plot' });
    const left = 70, right = 960, top = 28, bottom = 274;
    const maxCost = Math.max(0.01, ...points.map(point => point.cost)) * 1.1;
    const x = (cost: number) => left + cost / maxCost * (right - left);
    const y = (agentIndex: number) => bottom - agentIndex / 100 * (bottom - top);
    for (let i = 0; i <= 4; i++) {
      const value = i * 25, yy = y(value);
      chart.append(svg('line', { x1: left, x2: right, y1: yy, y2: yy, class: 'chart-grid' }), svg('text', { x: left - 12, y: yy + 4, 'text-anchor': 'end', class: 'axis-label' }, String(value)));
      const cost = i / 4 * maxCost;
      chart.append(svg('text', { x: x(cost), y: bottom + 22, 'text-anchor': 'middle', class: 'axis-label' }, `$${cost.toFixed(2)}`));
    }
    chart.append(svg('text', { x: 20, y: 150, transform: 'rotate(-90 20 150)', 'text-anchor': 'middle', class: 'axis-title' }, 'AA Coding Agent Index ↑'), svg('text', { x: 500, y: 328, 'text-anchor': 'middle', class: 'axis-title' }, 'Cost / Task (USD) →'));
    const boundary = points.filter(point => frontier.has(point.id)).sort((a, b) => a.cost - b.cost);
    const frontierLine = svg('polyline', { points: boundary.map(point => `${x(point.cost)},${y(point.agentIndex)}`).join(' '), class: 'frontier-line', fill: 'none', display: 'none' });
    chart.append(frontierLine);
    lineToggle.disabled = boundary.length < 2;
    lineToggle.addEventListener('change', () => {
      frontierLine.setAttribute('display', lineToggle.checked ? 'inline' : 'none');
      lineExplanation.hidden = !lineToggle.checked;
    });
    const lineExplanation = element('p', 'analysis-note', 'The green line connects the shown Pareto-efficient points to illustrate cost / performance tradeoffs. It is not a trend or prediction, and intermediate positions do not represent available models.');
    lineExplanation.hidden = true; controls.after(lineExplanation);
    // A bounded lane layout keeps labels in the plotting area; crowded labels truncate,
    // while each point's full model name and scores remain keyboard/hover accessible.
    const occupied: { x: number; y: number; width: number }[] = [];
    for (const point of [...points].sort((a, b) => b.agentIndex - a.agentIndex)) {
      const xx = x(point.cost), yy = y(point.agentIndex), isFrontier = frontier.has(point.id), isSelected = selected.has(point.id);
      const node = svg('g', { tabindex: 0, class: `chart-point ${isFrontier ? 'on-frontier' : ''} ${isSelected ? 'point-selected' : ''}`, role: 'img', 'aria-label': `${point.model.name}, agentIndex ${point.agentIndex.toFixed(1)}, cost $${point.cost}, ${isFrontier ? 'on' : 'off'} Pareto frontier` });
      const marker = svg(isSelected ? 'path' : 'circle', isSelected ? { d: `M ${xx} ${yy - 7} L ${xx + 7} ${yy} L ${xx} ${yy + 7} L ${xx - 7} ${yy} Z` } : { cx: xx, cy: yy, r: isFrontier ? 6 : 4.5 });
      node.append(marker);
      const label = point.model.name.length > 23 ? `${point.model.name.slice(0, 22)}…` : point.model.name;
      const width = label.length * 5.6, labelX = Math.min(right - width, xx + 10);
      let labelY = Math.max(top + 10, yy - 8);
      const candidates = Array.from({ length: 36 }, (_, lane) => Math.max(top + 10, Math.min(bottom - 4, yy - 8 + (lane % 2 ? 1 : -1) * Math.ceil(lane / 2) * 14)));
      labelY = candidates.find(candidate => !occupied.some(other => Math.abs(other.y - candidate) < 13 && labelX < other.x + other.width && labelX + width > other.x)) ?? labelY;
      occupied.push({ x: labelX, y: labelY, width });
      chart.append(svg('line', { x1: xx, y1: yy, x2: labelX, y2: labelY - 3, class: 'label-leader' }));
      node.append(svg('text', { x: labelX, y: labelY, class: 'point-label' }, label));
      const show = () => {
        tooltip.replaceChildren(element('strong', '', point.model.name));
        const d = derived.get(point.id)!;
        for (const text of [`Harness: ${point.model.harness ?? '—'}`, `AA Coding Agent Index (recomputed): ${point.agentIndex.toFixed(1)} (${d.coverage}/3 metrics)`, `Cost / Task: ${formatMetric('cost_per_task', point.cost)}`, `Tokens / Task: ${formatMetric('tokens_per_task', numeric(point.model.tokens_per_task))}`, ...agentKeys.map(key => `${key === 'deepswe' ? 'DeepSWE' : key === 'terminal_harness' ? 'Terminal-Bench' : 'SWE-Atlas-QnA'}: ${formatMetric(key, numeric(point.model[key]))}`), `Value Index (internal): ${d.value === null ? 'N/A' : d.value.toFixed(1)}`, `Pareto-efficient: ${isFrontier ? 'Yes' : 'No'}`]) tooltip.append(element('div', '', text));
        tooltip.hidden = false;
      };
      node.addEventListener('mouseenter', show); node.addEventListener('focus', show);
      node.addEventListener('mouseleave', () => { tooltip.hidden = true; }); node.addEventListener('blur', () => { tooltip.hidden = true; });
      node.addEventListener('keydown', event => { if (event.key === 'Escape') tooltip.hidden = true; });
      chart.append(node);
    }
    plot.append(chart, tooltip); container.append(plot);
  }
  const methodology = element('details', 'methodology');
  methodology.append(element('summary', '', 'Calculation methodology & coverage'), element('p', '', agentIndexNote), element('p', '', valueNote), element('p', '', 'Pareto efficiency: no shown model has a cost no greater and Coding Agent Index no lower, with at least one strictly better. Equal-cost stronger models dominate; identical points remain efficient. Different harnesses and configurations may affect comparability.'));
  container.append(methodology);
}


