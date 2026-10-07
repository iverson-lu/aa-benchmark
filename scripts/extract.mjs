import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { load } from 'cheerio';

const source = readFileSync('AA_Benchmark_Interactive_Compare_2026-10-06.html', 'utf8');
const $ = load(source);
for (const dir of ['data', 'icons', 'src', 'migrations']) mkdirSync(dir, { recursive: true });
const keys = ['intelligence','hle','gdpval','automation','scicode','terminal_model','deepswe','terminal_harness','swe_atlas','tokens_per_task','cost_per_task'];
const columns = [3,4,5,6,7,8,10,11,12,13,14];
const providers = new Map();
const models = [];
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function number(text) {
  const clean = text.replace(/,/g, '');
  const match = clean.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  return Number(match[0]) * (/M\b/.test(clean) ? 1e6 : /K\b/.test(clean) ? 1e3 : 1);
}
$('tr[data-model]').each((order, el) => {
  const row = $(el), cells = row.children('td');
  const provider = row.attr('data-provider');
  const providerId = slug(provider), iconKey = `providers/${providerId}.svg`;
  if (!providers.has(providerId)) {
    providers.set(providerId, { id: providerId, name: provider, icon_key: iconKey });
    const svg = row.find('.logo svg').clone();
    // Cheerio's HTML parser normalizes SVG attributes; restore XML case for standalone files.
    const color = row.find('.logo').attr('style')?.match(/color:([^;]+)/)?.[1] ?? '#111827';
    svg.attr('style', `color:${color}`);
    const xml = $.html(svg).replace(/viewbox=/g, 'viewBox=');
    writeFileSync(`icons/${providerId}.svg`, xml);
  }
  const prices = cells.eq(2).text().match(/\d+(?:\.\d+)?/g).map(Number);
  const harness = cells.eq(9).text().trim();
  const model = {
    id: slug(row.attr('data-model')), name: row.find('.model-name').text().trim(),
    provider_id: providerId, model_type: row.attr('data-group'),
    input_price: prices[0], output_price: prices[1],
    harness: harness === '—' ? null : harness,
    tag: row.find('.tag').text().trim() || null,
    note: row.find('.model-name').text().includes('*') ? $('.note').text().trim() : null,
    display_order: order, data_date: '2026-10-06'
  };
  keys.forEach((key, index) => model[key] = number(cells.eq(columns[index]).text()));
  models.push(model);
});
writeFileSync('data/latest.json', JSON.stringify({ providers: [...providers.values()], models }, null, 2) + '\n');
writeFileSync('src/style.css', $('style').text() + '\n.logo img{display:block;width:25px;height:25px;object-fit:contain}\n.app-status{margin:12px 0;padding:12px;border:1px solid #dbe4ef;border-radius:9px;background:#fff;color:#304d73}\n.app-status[hidden]{display:none}\n');
$('style').remove();
$('head').append('<link rel="stylesheet" href="/src/style.css">');
$('script').remove();
$('tbody').empty();
$('#visibleCount').text('Loading…');
$('.subtitle').text(`${models.length} Models · 9 Benchmarks · AA Overall vs. Model Capability vs. Coding Agent + Harness`);
$('h1').text('Leading LLMs for Coding & Agent Benchmarks');
$('.asof').html('<b id="dataDate">Loading latest data…</b><br>Imported from the original HTML. Price is Input / Output USD per 1M tokens.');
$('.card').before('<div class="app-status" id="appStatus" role="status">正在加载模型数据…</div>');
$('body').append('<script type="module" src="/src/main.ts"></script>');
writeFileSync('index.html', $.html());
console.log(`Extracted ${models.length} models and ${providers.size} provider icons. Original HTML preserved.`);
