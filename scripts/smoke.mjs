import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:8787';
const seed = JSON.parse(readFileSync('data/latest.json', 'utf8'));
const response = await fetch(`${base}/api/snapshot`);
assert.equal(response.status, 200);
const snapshot = await response.json();
assert.equal(snapshot.models.length, seed.models.length);
for (const expected of seed.models) {
  const actual = snapshot.models.find(m => m.id === expected.id);
  assert.ok(actual, expected.id);
  for (const [key, value] of Object.entries(expected)) assert.deepEqual(actual[key], value, `${expected.id}.${key}`);
}
const page = await fetch(base);
assert.equal(page.status, 200);
const html = await page.text();
const assetPaths = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(m => m[1]);
assert.ok(assetPaths.length >= 2);
for (const path of assetPaths) assert.equal((await fetch(`${base}${path}`)).status, 200, path);
for (const provider of seed.providers) {
  const icon = await fetch(`${base}/icons/${provider.icon_key}`);
  assert.equal(icon.status, 200, provider.name);
  assert.ok(icon.headers.get('content-type').includes('image/svg+xml'));
  assert.match(await icon.text(), /viewBox=/);
  assert.equal((await fetch(`${base}/icons/${provider.icon_key}`, {headers:{'If-None-Match':icon.headers.get('etag')}})).status, 304);
}
assert.equal((await fetch(`${base}/api/snapshot`, {method:'POST'})).status, 405);
assert.equal((await fetch(`${base}/api/missing`)).status, 404);
assert.equal((await fetch(`${base}/icons/providers/missing.svg`)).status, 404);
console.log(`PASS: ${seed.models.length} models match imported data; ${seed.providers.length} R2 icons, caching, static assets and read-only routes verified.`);
