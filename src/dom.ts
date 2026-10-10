import { type MetricKey } from './shared';
export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const el = document.createElement(tag);
  el.className = className; el.textContent = text;
  return el;
}
export function formatMetric(key: MetricKey, value: number | null): string {
  if (value === null) return '—';
  if (key === 'tokens_per_task') return value >= 1e6 ? `${Number((value / 1e6).toFixed(2))}M` : value >= 1e3 ? `${Number((value / 1e3).toFixed(2))}K` : String(value);
  if (key === 'cost_per_task') return `$${value.toFixed(2)}`;
  return String(value);
}
export function button(text: string, action: () => void, className = 'btn ghost'): HTMLButtonElement {
  const node = element('button', className, text); node.type = 'button'; node.addEventListener('click', action); return node;
}
