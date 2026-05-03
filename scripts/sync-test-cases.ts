/**
 * Idempotent: pull the canonical test case list from the API, then make the
 * on-disk flows/ tree match it. Run nightly via cron + on every dashboard
 * mutation via repository_dispatch (see .github/workflows/sync-test-cases.yml).
 *
 *  - code in API, missing on disk         → create stub
 *  - code on disk, title/repro changed    → rewrite ONLY the header (keeps
 *                                           hand-authored interaction steps)
 *  - code archived in API                 → git mv to flows/_archived/
 *  - code's section changed               → git mv to the new folder
 *
 * Hand-authored flows that predate the sentinel header are detected and left
 * fully untouched.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchAllTestCases, type TestCase } from './lib/api.ts';
import { dirForCase } from './lib/sections.ts';
import { renderStub, rewriteHeader } from './lib/yaml-stub.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const FLOWS_DIR = path.join(ROOT, 'flows');
const ARCHIVED_DIR = path.join(FLOWS_DIR, '_archived');

interface OnDiskFlow {
  code: string;
  absPath: string;
  relDir: string; // e.g. "smk" or "_archived"
  contents: string;
}

async function walkFlows(): Promise<Map<string, OnDiskFlow>> {
  const map = new Map<string, OnDiskFlow>();
  const sectionDirs = await fs.readdir(FLOWS_DIR, { withFileTypes: true });
  for (const dirent of sectionDirs) {
    if (!dirent.isDirectory()) continue;
    if (dirent.name === 'common') continue;
    const sectionPath = path.join(FLOWS_DIR, dirent.name);
    const files = await fs.readdir(sectionPath);
    for (const file of files) {
      if (!file.endsWith('.yaml')) continue;
      const code = path.basename(file, '.yaml').toUpperCase();
      const absPath = path.join(sectionPath, file);
      const contents = await fs.readFile(absPath, 'utf8');
      map.set(code, { code, absPath, relDir: dirent.name, contents });
    }
  }
  return map;
}

interface Summary {
  created: string[];
  headerUpdated: string[];
  moved: { code: string; from: string; to: string }[];
  archived: string[];
  unarchived: string[];
  skippedHandAuthored: string[];
  unchanged: number;
}

function emptySummary(): Summary {
  return {
    created: [],
    headerUpdated: [],
    moved: [],
    archived: [],
    unarchived: [],
    skippedHandAuthored: [],
    unchanged: 0,
  };
}

async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}

async function syncOne(
  tc: TestCase,
  onDisk: OnDiskFlow | undefined,
  summary: Summary,
): Promise<void> {
  const code = tc.code.toUpperCase();
  const targetDir = tc.is_archived ? '_archived' : dirForCase(code, tc.section);
  const targetAbsDir = path.join(FLOWS_DIR, targetDir);
  const targetPath = path.join(targetAbsDir, `${code}.yaml`);

  // Case A: nothing on disk → write a fresh stub.
  if (!onDisk) {
    if (tc.is_archived) return; // don't materialize archived cases that never existed
    await ensureDir(targetAbsDir);
    await fs.writeFile(targetPath, renderStub(tc, targetDir));
    summary.created.push(code);
    return;
  }

  // Case B: archived in API → move file to _archived/ if not already there.
  if (tc.is_archived && onDisk.relDir !== '_archived') {
    await ensureDir(ARCHIVED_DIR);
    await fs.rename(onDisk.absPath, targetPath);
    summary.archived.push(code);
    return;
  }

  // Case C: previously archived, now active → move back to its section folder.
  if (!tc.is_archived && onDisk.relDir === '_archived') {
    await ensureDir(targetAbsDir);
    await fs.rename(onDisk.absPath, targetPath);
    summary.unarchived.push(code);
    onDisk.absPath = targetPath;
    onDisk.relDir = targetDir;
  }

  // Case D: section changed → git mv to the new folder.
  if (!tc.is_archived && onDisk.relDir !== targetDir) {
    await ensureDir(targetAbsDir);
    await fs.rename(onDisk.absPath, targetPath);
    summary.moved.push({ code, from: onDisk.relDir, to: targetDir });
    onDisk.absPath = targetPath;
    onDisk.relDir = targetDir;
  }

  // Case E: header drift → rewrite only the dashboard-meta block. Files
  // without a sentinel are hand-authored; leave them alone.
  const rewritten = rewriteHeader(onDisk.contents, tc, onDisk.relDir);
  if (rewritten === null) {
    summary.skippedHandAuthored.push(code);
    return;
  }
  if (rewritten !== onDisk.contents) {
    await fs.writeFile(onDisk.absPath, rewritten);
    summary.headerUpdated.push(code);
  } else {
    summary.unchanged += 1;
  }
}

function printSummary(summary: Summary, totalApi: number): void {
  const lines = [
    `dashboard test cases: ${totalApi}`,
    `created: ${summary.created.length}`,
    `header updated: ${summary.headerUpdated.length}`,
    `moved: ${summary.moved.length}`,
    `archived: ${summary.archived.length}`,
    `unarchived: ${summary.unarchived.length}`,
    `unchanged: ${summary.unchanged}`,
    `skipped (hand-authored, no sentinel): ${summary.skippedHandAuthored.length}`,
  ];
  console.log(lines.join('\n'));
  if (summary.created.length) console.log('  + ' + summary.created.join(', '));
  if (summary.headerUpdated.length) console.log('  ~ ' + summary.headerUpdated.join(', '));
  if (summary.archived.length) console.log('  → _archived: ' + summary.archived.join(', '));
  if (summary.unarchived.length) console.log('  ← unarchived: ' + summary.unarchived.join(', '));
  if (summary.moved.length) {
    for (const m of summary.moved) console.log(`  ↦ ${m.code}: ${m.from} → ${m.to}`);
  }
  if (summary.skippedHandAuthored.length) {
    console.log('  ! hand-authored (no sentinel): ' + summary.skippedHandAuthored.join(', '));
  }
}

async function main(): Promise<void> {
  const baseUrl = process.env.API_BASE_URL;
  const token = process.env.ADMIN_TOKEN;
  if (!baseUrl) throw new Error('API_BASE_URL is required');
  if (!token) throw new Error('ADMIN_TOKEN is required');

  const cases = await fetchAllTestCases({ baseUrl, token });
  const onDisk = await walkFlows();
  const summary = emptySummary();

  for (const tc of cases) {
    await syncOne(tc, onDisk.get(tc.code.toUpperCase()), summary);
  }

  // Anything on disk that the API doesn't know about anymore: keep silent —
  // could be a soon-to-land code, a typo we caught, or a hand-authored helper.
  // Surface it in the summary but don't delete.
  const apiCodes = new Set(cases.map((c) => c.code.toUpperCase()));
  const orphans = [...onDisk.keys()].filter((c) => !apiCodes.has(c));
  if (orphans.length) {
    console.log(`orphans (on disk, not in API): ${orphans.length}`);
    console.log('  ? ' + orphans.join(', '));
  }

  printSummary(summary, cases.length);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
