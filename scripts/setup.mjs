import { readFileSync, writeFileSync, mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const target = process.argv[2];
if (!['local', 'remote'].includes(target)) throw new Error('Specify local or remote.');
const data = JSON.parse(readFileSync('data/latest.json', 'utf8'));
function wrangler(args) {
  const result = spawnSync(process.execPath, ['node_modules/wrangler/bin/wrangler.js', ...args], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Wrangler failed (${result.status}).`);
}
const sqlValue = value => value == null ? 'NULL' : typeof value === 'number' ? String(value) : `'${String(value).replace(/'/g, "''")}'`;
function insert(table, record) {
  return `INSERT INTO ${table} (${Object.keys(record).join(',')}) VALUES (${Object.values(record).map(sqlValue).join(',')});`;
}
if (!process.argv.includes('--assets-only')) {
  wrangler(['d1', 'migrations', 'apply', 'aa-benchmark-db', `--${target}`]);
  // A single D1 execute file is applied transactionally; no explicit BEGIN is needed.
  const sql = ['DELETE FROM models;', 'DELETE FROM providers;', ...data.providers.map(p => insert('providers', p)), ...data.models.map(m => insert('models', m))].join('\n');
  const temp = mkdtempSync(join(tmpdir(), 'aa-benchmark-'));
  try {
    const file = join(temp, 'latest.sql');
    writeFileSync(file, sql);
    wrangler(['d1', 'execute', 'aa-benchmark-db', `--${target}`, '--file', file]);
  } finally { rmSync(join(temp, 'latest.sql'), { force: true }); rmdirSync(temp); }
}
if (!process.argv.includes('--data-only')) {
  for (const provider of data.providers) {
    wrangler(['r2', 'object', 'put', `aa-benchmark-icons/${provider.icon_key}`, '--file', `icons/${provider.id}.svg`, '--content-type', 'image/svg+xml', `--${target}`]);
  }
}
console.log(`Updated ${target} resources.`);
