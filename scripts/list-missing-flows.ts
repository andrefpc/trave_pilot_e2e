/**
 * Diff: which dashboard test case codes don't yet have a YAML file?
 * Exits 0 if every active code has a flow, 1 otherwise.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAllTestCases } from './lib/api.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FLOWS_DIR = path.resolve(__dirname, '..', 'flows');

async function collectFlowCodes(): Promise<Set<string>> {
  const codes = new Set<string>();
  const dirents = await fs.readdir(FLOWS_DIR, { withFileTypes: true });
  for (const d of dirents) {
    if (!d.isDirectory() || d.name === 'common') continue;
    const files = await fs.readdir(path.join(FLOWS_DIR, d.name));
    for (const f of files) {
      if (f.endsWith('.yaml')) codes.add(path.basename(f, '.yaml').toUpperCase());
    }
  }
  return codes;
}

async function main(): Promise<void> {
  const baseUrl = process.env.API_BASE_URL;
  const token = process.env.ADMIN_TOKEN;
  if (!baseUrl) throw new Error('API_BASE_URL is required');
  if (!token) throw new Error('ADMIN_TOKEN is required');

  const [cases, onDisk] = await Promise.all([
    fetchAllTestCases({ baseUrl, token }),
    collectFlowCodes(),
  ]);

  const active = cases.filter((c) => !c.is_archived);
  const missing = active.filter((c) => !onDisk.has(c.code.toUpperCase()));
  const orphans = [...onDisk].filter(
    (c) => !cases.some((tc) => tc.code.toUpperCase() === c),
  );

  console.log(`active dashboard cases: ${active.length}`);
  console.log(`flows on disk: ${onDisk.size}`);
  console.log(`missing (active code, no flow): ${missing.length}`);
  if (missing.length) {
    for (const m of missing) console.log(`  - ${m.code}  (${m.section})`);
  }
  console.log(`orphans (flow on disk, no active code): ${orphans.length}`);
  if (orphans.length) {
    for (const o of orphans) console.log(`  ? ${o}`);
  }

  if (missing.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
