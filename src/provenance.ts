import { metrics, type DataKey, type Model, type Provenance } from './shared';
import { numeric } from './analysis';
import { element, formatMetric } from './dom';

export function details(model: Model, key: DataKey): Provenance | undefined {
  const value = model[key];
  const inline = typeof value === 'object' && value !== null ? value : {};
  const metadata = { ...model.provenance?.[key], ...inline };
  return Object.entries(metadata).some(([key, value]) => key !== 'value' && typeof value === 'string' && value.trim().length > 0) ? metadata : undefined;
}
function safeUrl(url: string): string | null {
  try { const parsed = new URL(url); return ['https:', 'http:'].includes(parsed.protocol) ? parsed.href : null; } catch { return null; }
}
let openPanel: HTMLElement | undefined;
export function addProvenance(target: HTMLElement, model: Model, keys: DataKey[]) {
  const known = keys.filter(key => details(model, key));
  if (!known.length) return;
  target.classList.add('has-provenance');
  target.title = 'Click to view source details';
  const trigger = element('button', 'info-cue', 'ⓘ');
  trigger.type = 'button';
  trigger.setAttribute('aria-label', `Data details for ${model.name}: ${known.join(', ')}`);
  trigger.setAttribute('aria-haspopup', 'dialog');
  trigger.addEventListener('click', event => {
    event.stopPropagation();
    openPanel?.remove();
    const panel = element('div', 'provenance-panel');
    panel.id = 'dataProvenance'; panel.setAttribute('popover', 'auto');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Data provenance');
    const close = element('button', 'btn ghost', 'Close'); close.type = 'button';
    close.addEventListener('click', () => { panel.hidePopover(); trigger.focus(); });
    panel.append(element('h3', '', 'Data provenance'), close);
    for (const key of known) {
      const metadata = details(model, key)!;
      const metric = metrics.find(metric => metric.key === key);
      const raw = model[key];
      const score = key === 'harness' ? model.harness ?? '—' : key === 'input_price' || key === 'output_price' ? `$${model[key]} / 1M tokens` : formatMetric(key, numeric(model[key]));
      const block = element('dl');
      const field = (label: string, value: string | undefined) => { if (value) block.append(element('dt', '', label), element('dd', '', value)); };
      field('Benchmark / Data', metric ? `${metric.label} ${metric.unit}` : key.replace('_', ' '));
      field('Score / Value', score); field('Model', model.name);
      field('Harness', metadata.harness ?? (metric?.group === 'agent' ? model.harness ?? undefined : undefined));
      field('Effort', metadata.effort); field('Source', metadata.source);
      field('Test / publication date', metadata.date); field('Source checked', metadata.checkedDate);
      field('Status', metadata.status); field('Notes', metadata.notes);
      for (const [label, url] of [['Original source', metadata.sourceUrl], ['Methodology', metadata.methodologyUrl]]) {
        const safe = url ? safeUrl(url) : null;
        if (safe) {
          const link = element('a', '', label!); link.href = safe; link.target = '_blank'; link.rel = 'noopener noreferrer';
          const dd = element('dd'); dd.append(link); block.append(element('dt', '', label!), dd);
        }
      }
      // Structured missing values retain their declared status; numeric legacy cells stay unchanged.
      if (raw === null && !metadata.status) field('Availability', '—');
      panel.append(block);
    }
    (trigger.closest('dialog') ?? document.body).append(panel);
    openPanel = panel;
    panel.showPopover(); close.focus();
  });
  // The whole cell works on touch screens; the button remains available to
  // keyboard users and is revealed only for the hovered/focused cell.
  target.addEventListener('click', event => {
    if (!(event.target as Element).closest('button, a, input')) trigger.click();
  });
  target.append(trigger);
}
