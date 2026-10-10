import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Load the isolated TypeScript utilities without adding a test dependency or
// emitting build files. Node removes type-only imports before substitution.
const cache = new Map();
function moduleUrl(name) {
  if (cache.has(name)) return cache.get(name);
  const source = readFileSync(new URL(`../src/${name}.ts`, import.meta.url), 'utf8');
  const js = stripTypeScriptTypes(source)
    .replace(/from ['"]\.\/([a-z]+)['"]/g, (_, dependency) => `from '${moduleUrl(dependency)}'`);
  const url = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`; cache.set(name, url); return url;
}
const { numeric, codingAgentIndex, derive, harnessDelta, paretoFrontier, rank, winners } = await import(moduleUrl('analysis'));
const { views, validView, column } = await import(moduleUrl('views'));
const { metrics } = await import(moduleUrl('shared'));
const { details } = await import(moduleUrl('provenance'));
const { latestModels, modelFamily, modelFamilies } = await import(moduleUrl('families'));
const model = (id, overrides = {}) => ({ id, ...Object.fromEntries(metrics.map(metric => [metric.key, null])), ...overrides });
test('model families collapse explicitly ordered versions and preserve independent product lines', () => {
  const population = ['gpt-5-6-sol', 'gpt-6-sol', 'gpt-6-1-sol', 'gpt-5-6-terra', 'gpt-6-astra', 'gpt-5-6-luna', 'gpt-6-luna', 'claude-opus-5', 'claude-opus-5-5', 'gemini-4-argon', 'gemini-3-8-flash', 'unknown-new-model'].map(id => model(id, { name: id }));
  assert.deepEqual(latestModels(population).map(model => model.id), ['gpt-6-1-sol', 'gpt-5-6-terra', 'gpt-6-astra', 'gpt-6-luna', 'claude-opus-5-5', 'gemini-4-argon', 'gemini-3-8-flash', 'unknown-new-model']);
  assert.equal(modelFamily(population[0]).id, modelFamily(population[2]).id);
  assert.notEqual(modelFamily(population[2]).id, modelFamily(population[4]).id);
  assert.deepEqual(latestModels([]), []);
});
test('latest family version depends on explicit order and availability, never tags, scores or snapshot dates', () => {
  const old = model('gpt-5-6-sol', { name: 'old', data_date: '2099-01-01', intelligence: 100, tag: 'NEW' });
  const newer = model('gpt-6-sol', { name: 'newer', data_date: '2000-01-01', intelligence: 1 });
  assert.deepEqual(latestModels([old, newer]).map(model => model.id), ['gpt-6-sol']);
  const members = modelFamilies.flatMap(family => family.versions);
  assert.equal(members.length, new Set(members).size);
  const snapshot = JSON.parse(readFileSync(new URL('../data/latest.json', import.meta.url)));
  assert.equal(latestModels(snapshot.models).length, 21);
  assert.equal(snapshot.models.length, 26);
});

test('legacy and structured values, zeros and invalid numbers', () => {
  assert.equal(numeric(0), 0); assert.equal(numeric({ value: 73, source: 'Known' }), 73);
  for (const value of [null, undefined, NaN, Infinity, { value: null, status: 'Pending' }]) assert.equal(numeric(value), null);
});
test('provenance supports progressive metadata and structured missing statuses without guessing', () => {
  assert.equal(details(model('a', { intelligence: 73 }), 'intelligence'), undefined);
  assert.equal(details(model('a', { intelligence: { value: 73 } }), 'intelligence'), undefined);
  assert.equal(details(model('a', { provenance: { intelligence: { source: undefined, notes: ' ' } } }), 'intelligence'), undefined);
  const pending = model('a', { intelligence: { value: null, status: 'Pending' }, provenance: { intelligence: { source: 'Recorded source', checkedDate: '2026-10-10' } } });
  assert.equal(details(pending, 'intelligence').status, 'Pending');
  assert.equal(details(pending, 'intelligence').source, 'Recorded source');
  assert.equal(details(pending, 'intelligence').date, undefined);
});
test('Terminal-Bench harness delta uses percentage points and requires both paired values', () => {
  assert.equal(harnessDelta(model('a', { terminal_model: 56, terminal_harness: 55, scicode: 90, deepswe: 1 })), -1);
  assert.equal(harnessDelta(model('a', { terminal_model: 0, terminal_harness: { value: 8 } })), 8);
  assert.equal(harnessDelta(model('a', { terminal_model: 50, terminal_harness: 50 })), 0);
  assert.equal(harnessDelta(model('a', { terminal_model: 50 })), null);
  assert.equal(harnessDelta(model('a', { scicode: 50, deepswe: 60 })), null);
});
test('AA Coding Agent Index v1.5 is the equal-weight mean of all three percentages', () => {
  assert.equal(codingAgentIndex(model('a', { deepswe: 73, terminal_harness: 55, swe_atlas: 61 })), 63);
  assert.equal(codingAgentIndex(model('b', { deepswe: 79, terminal_harness: 56, swe_atlas: 56 })), 191 / 3);
  assert.equal(codingAgentIndex(model('zero', { deepswe: 0, terminal_harness: 0, swe_atlas: 0 })), 0);
  assert.equal(codingAgentIndex(model('max', { deepswe: 100, terminal_harness: 100, swe_atlas: 100 })), 100);
  assert.equal(codingAgentIndex(model('structured', { deepswe: { value: 73 }, terminal_harness: 55, swe_atlas: 61 })), 63);
  for (const value of [null, -1, 101, NaN, Infinity]) assert.equal(codingAgentIndex(model('invalid', { deepswe: 73, terminal_harness: 55, swe_atlas: value })), null);
  assert.equal(codingAgentIndex(model('two', { deepswe: 73, terminal_harness: 55 })), null);
});
test('Index is independent of reference population and filtering', () => {
  const a = model('a', { deepswe: 73, terminal_harness: 55, swe_atlas: 61 });
  const other = model('other', { deepswe: 100, terminal_harness: 100, swe_atlas: 100 });
  assert.equal(derive([a]).get('a').agentIndex, derive([a, other]).get('a').agentIndex);
  assert.equal(derive([a]).get('a').agentIndex, 63);
});
test('Internal Value Index uses the official-formula index/cost and scales to 100', () => {
  const population = [model('a', { deepswe: 10, terminal_harness: 20, swe_atlas: 30, cost_per_task: 4 }), model('b', { deepswe: 20, terminal_harness: 40, swe_atlas: 60, cost_per_task: 2 }), model('c', { deepswe: 15, terminal_harness: 30, swe_atlas: 45, cost_per_task: 1 }), model('d', { deepswe: 15, terminal_harness: 30, swe_atlas: 45, cost_per_task: 0 }), model('e', { deepswe: 15, terminal_harness: 30, swe_atlas: 45, cost_per_task: -1 }), model('f', { deepswe: 15, cost_per_task: 1 }), model('two', { deepswe: 15, terminal_harness: 30, cost_per_task: 1 })];
  const derived = derive(population);
  assert.equal(derived.get('a').value, 100 * 5 / 30); assert.equal(derived.get('b').value, 100 * 20 / 30); assert.equal(derived.get('c').value, 100);
  for (const id of ['d', 'e', 'f', 'two']) assert.equal(derived.get(id).value, null);
  assert.equal(derived.get('c').coverage, 3);
  assert.equal(derive([model('zero', { deepswe: 0, terminal_harness: 0, swe_atlas: 0, cost_per_task: 1 })]).get('zero').value, 0);
  assert.deepEqual(derive([]), new Map());
});
test('Pareto handles tradeoffs, equal cost, equal capability and duplicate points', () => {
  const points = [{ id: 'cheap', cost: 1, agentIndex: 20 }, { id: 'mid', cost: 2, agentIndex: 50 }, { id: 'strong', cost: 3, agentIndex: 80 }, { id: 'dominated', cost: 4, agentIndex: 70 }, { id: 'equal-cost', cost: 2, agentIndex: 40 }, { id: 'equal-capability', cost: 5, agentIndex: 80 }, { id: 'duplicate', cost: 3, agentIndex: 80 }, { id: 'free', cost: 0, agentIndex: 10 }];
  assert.deepEqual([...paretoFrontier(points)].sort(), ['cheap', 'mid', 'strong', 'duplicate', 'free'].sort());
  assert.equal(paretoFrontier([]).size, 0);
});
test('ranks preserve ties and summaries do not infer a winner from missing data', () => {
  assert.equal(rank(73, [73, 73, 69]), 1); assert.equal(rank(69, [73, 73, 69]), 3);
  assert.equal(rank(1, [1, 2, 4], true), 1);
  const models = [model('a', { intelligence: 70 }), model('b', { intelligence: null })];
  assert.deepEqual(winners(models, model => numeric(model.intelligence)), []);
  assert.equal(winners([model('a', { intelligence: 70 }), model('b', { intelligence: 70 })], model => numeric(model.intelligence)).length, 2);
});
test('all six presets map unique valid columns and preserve original All ordering', () => {
  assert.equal(Object.keys(views).length, 6); assert.equal(validView(null), 'overview'); assert.equal(validView('bad'), 'overview'); assert.equal(validView('agent'), 'agent');
  assert.deepEqual(views.all.columns, ['name', 'provider', 'price', ...metrics.flatMap(metric => metric.key === 'deepswe' ? ['harness', metric.key] : [metric.key])]);
  for (const preset of Object.values(views)) { assert.equal(new Set(preset.columns).size, preset.columns.length); for (const key of preset.columns) assert.ok(column(key)?.label, key); }
  for (const preset of ['coding', 'agent']) assert.ok(views[preset].columns.includes('delta'));
  assert.ok(views.efficiency.columns.includes('value'));
});

