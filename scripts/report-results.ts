/**
 * Parse Maestro's JUnit XML and PUT each result back to the admin matrix
 * (PUT /api/v1/admin/app-versions/:id/test-runs).
 *
 * The flow filename (= test case code) drives the test_case_id lookup.
 * APP_VERSION + APP_BUILD env vars drive the app_version_id lookup; if no
 * matching version exists yet, --register creates one (handy for the very
 * first run of a new build).
 *
 * Usage:
 *   tsx scripts/report-results.ts \
 *     --platform=android \
 *     --junit=report.xml \
 *     [--register] [--dry-run]
 */

import fs from 'node:fs';
import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';

type Platform = 'android' | 'ios';
type Status = 'pass' | 'fail' | 'pending' | 'blocked';

interface Args {
  platform: Platform;
  junit: string;
  register: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Partial<Args> = { register: false, dryRun: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--platform=')) {
      const v = a.slice('--platform='.length);
      if (v !== 'android' && v !== 'ios') throw new Error(`platform must be android|ios, got: ${v}`);
      out.platform = v;
    } else if (a.startsWith('--junit=')) {
      out.junit = a.slice('--junit='.length);
    } else if (a === '--register') {
      out.register = true;
    } else if (a === '--dry-run') {
      out.dryRun = true;
    } else {
      throw new Error(`unknown arg: ${a}`);
    }
  }
  if (!out.platform) throw new Error('--platform=android|ios is required');
  if (!out.junit) throw new Error('--junit=path/to/report.xml is required');
  return out as Args;
}

interface FlowResult {
  code: string;
  status: Status;
  notes: string | null;
}

function classifyTestcase(tc: any): Status {
  if (tc.failure || tc.failure === '') return 'fail';
  if (tc.error || tc.error === '') return 'blocked';
  if (tc.skipped || tc.skipped === '') return 'pending';
  return 'pass';
}

function notesFor(tc: any): string | null {
  const ciUrl = process.env.CI_RUN_URL;
  const failMsg = tc.failure?.['@_message'] ?? tc.failure?.['#text'] ?? tc.error?.['@_message'] ?? tc.error?.['#text'];
  const parts: string[] = [];
  if (ciUrl) parts.push(`CI: ${ciUrl}`);
  if (failMsg) parts.push(String(failMsg).slice(0, 1500));
  return parts.length ? parts.join('\n') : null;
}

function loadResults(junitPath: string): FlowResult[] {
  const xml = fs.readFileSync(junitPath, 'utf8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (name) => name === 'testsuite' || name === 'testcase',
  });
  const parsed = parser.parse(xml);
  const root = parsed.testsuites ?? parsed;
  const suites = root.testsuite ?? [];
  const out: FlowResult[] = [];
  for (const suite of suites) {
    for (const tc of suite.testcase ?? []) {
      const rawName = String(tc['@_name'] ?? '').trim();
      // Maestro uses the flow's `name:` field, which we set to the test case code.
      const code = rawName.toUpperCase();
      if (!code) continue;
      out.push({ code, status: classifyTestcase(tc), notes: notesFor(tc) });
    }
  }
  return out;
}

const TestCaseRow = z.object({
  id: z.string().uuid(),
  code: z.string(),
});
const TestCaseListResponse = z.object({
  items: z.array(TestCaseRow),
  total: z.number(),
});

async function fetchCodeMap(baseUrl: string, token: string): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const perPage = 200;
  let page = 1;
  while (true) {
    const url = new URL(`${baseUrl}/api/v1/admin/test-cases`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(perPage));
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`GET test-cases failed: ${res.status}`);
    const parsed = TestCaseListResponse.parse(await res.json());
    for (const it of parsed.items) map.set(it.code.toUpperCase(), it.id);
    if (parsed.items.length < perPage) break;
    page += 1;
  }
  return map;
}

const AppVersionRow = z.object({
  id: z.string().uuid(),
  version: z.string(),
});
const AppVersionListResponse = z.object({
  items: z.array(AppVersionRow.passthrough()),
  total: z.number(),
});

async function findOrRegisterAppVersion(
  baseUrl: string,
  token: string,
  platform: Platform,
  version: string,
  build: string | undefined,
  register: boolean,
): Promise<string | null> {
  const url = new URL(`${baseUrl}/api/v1/admin/app-versions`);
  url.searchParams.set('platform', platform);
  url.searchParams.set('search', version);
  url.searchParams.set('per_page', '100');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`GET app-versions failed: ${res.status}`);
  const parsed = AppVersionListResponse.parse(await res.json());
  const exact = parsed.items.find((v) => v.version === version);
  if (exact) return exact.id;
  if (!register) {
    throw new Error(
      `no app_version found for ${platform} ${version}; pass --register to create it on first sight`,
    );
  }
  // The capture-app-context middleware only writes AppVersion rows for
  // authenticated user requests, so /health won't materialize one. Fall back
  // to a real authenticated touch — any /api/v1/admin/* GET works.
  await fetch(`${baseUrl}/api/v1/admin/test-cases?per_page=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-App-Version': version,
      'X-App-Platform': platform,
      ...(build ? { 'X-App-Build': build } : {}),
    },
  });
  for (let i = 0; i < 5; i += 1) {
    await new Promise((r) => setTimeout(r, 400));
    const again = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const list = AppVersionListResponse.parse(await again.json());
    const found = list.items.find((v) => v.version === version);
    if (found) return found.id;
  }
  // Soft-fail: don't crash the reporter — we still want to print the local
  // pass/fail summary even if the dashboard can't be updated.
  console.warn(
    `! app_version ${platform} ${version} could not be registered; skipping matrix push.`,
  );
  return null;
}

async function postBatch(
  baseUrl: string,
  token: string,
  appVersionId: string,
  results: Array<{ test_case_id: string; platform: Platform; status: Status; notes: string | null }>,
): Promise<{ run_id: string; written: number }> {
  const res = await fetch(`${baseUrl}/api/v1/admin/app-versions/${appVersionId}/test-runs/batch`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ results }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`POST test-runs/batch failed (${res.status}): ${text.slice(0, 500)}`);
  }
  return res.json() as Promise<{ run_id: string; written: number }>;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const baseUrl = process.env.API_BASE_URL;
  const token = process.env.ADMIN_TOKEN;
  const version = process.env.APP_VERSION;
  const build = process.env.APP_BUILD;
  if (!baseUrl) throw new Error('API_BASE_URL is required');
  if (!token) throw new Error('ADMIN_TOKEN is required');
  if (!version) throw new Error('APP_VERSION is required');

  const results = loadResults(args.junit);
  console.log(`parsed ${results.length} flow results from ${args.junit}`);
  if (!results.length) return;

  const codeToId = await fetchCodeMap(baseUrl, token);
  const appVersionId = await findOrRegisterAppVersion(
    baseUrl,
    token,
    args.platform,
    version,
    build,
    args.register,
  );
  if (!appVersionId) {
    console.log('local results (matrix not updated):');
    for (const r of results) console.log(`  ${r.status === 'pass' ? '✓' : '✗'} ${r.code} → ${r.status}`);
    const passCount = results.filter((r) => r.status === 'pass').length;
    console.log(`done: ${passCount}/${results.length} passed (no matrix push)`);
    return;
  }

  // Single batched POST: N results in one transaction-bounded request.
  // The server tags everything as kind=automated and writes a TestExecution
  // history row plus an upserted TestRun matrix cell per result.
  const batch: Array<{ test_case_id: string; platform: Platform; status: Status; notes: string | null }> = [];
  let skipped = 0;
  for (const r of results) {
    const tcId = codeToId.get(r.code);
    if (!tcId) {
      skipped += 1;
      continue;
    }
    batch.push({
      test_case_id: tcId,
      platform: args.platform,
      status: r.status,
      notes: r.notes,
    });
  }

  if (args.dryRun) {
    console.log(`done: would-post=${batch.length} skipped=${skipped} (dry run)`);
    return;
  }
  if (!batch.length) {
    console.log(`done: posted=0 skipped=${skipped} (nothing to send)`);
    return;
  }

  // Server enforces a 1000-row max per request. For larger suites we split.
  const CHUNK = 500;
  let posted = 0;
  let runId: string | null = null;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const slice = batch.slice(i, i + CHUNK);
    try {
      const reply = await postBatch(baseUrl, token, appVersionId, slice);
      posted += reply.written;
      runId = reply.run_id;
    } catch (err) {
      console.warn(`  ! batch ${i}-${i + slice.length}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  console.log(`done: posted=${posted} skipped=${skipped} run_id=${runId ?? 'n/a'}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
