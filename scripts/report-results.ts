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
): Promise<string> {
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
  // Registration goes through the existing capture-app-context middleware: a
  // single authenticated request with X-App-Version + X-App-Platform headers
  // upserts the row. Easiest: hit /health with those headers (anonymous-safe).
  const reg = await fetch(`${baseUrl}/health`, {
    method: 'GET',
    headers: {
      'X-App-Version': version,
      'X-App-Platform': platform,
      ...(build ? { 'X-App-Build': build } : {}),
    },
  });
  if (!reg.ok) throw new Error(`failed to register app version: ${reg.status}`);
  // Fetch again — the middleware writes async; small retry loop.
  for (let i = 0; i < 5; i += 1) {
    await new Promise((r) => setTimeout(r, 250));
    const again = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const list = AppVersionListResponse.parse(await again.json());
    const found = list.items.find((v) => v.version === version);
    if (found) return found.id;
  }
  throw new Error(`registered app version did not materialize for ${platform} ${version}`);
}

async function postRun(
  baseUrl: string,
  token: string,
  appVersionId: string,
  body: { test_case_id: string; platform: Platform; status: Status; notes: string | null },
): Promise<void> {
  const res = await fetch(`${baseUrl}/api/v1/admin/app-versions/${appVersionId}/test-runs`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`PUT test-runs failed (${res.status}): ${text.slice(0, 300)}`);
  }
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

  let posted = 0;
  let skipped = 0;
  for (const r of results) {
    const tcId = codeToId.get(r.code);
    if (!tcId) {
      console.warn(`  ? ${r.code}: no matching test case in dashboard, skipping`);
      skipped += 1;
      continue;
    }
    const body = {
      test_case_id: tcId,
      platform: args.platform,
      status: r.status,
      notes: r.notes,
    };
    if (args.dryRun) {
      console.log(`  [dry] ${r.code} → ${r.status}`);
    } else {
      await postRun(baseUrl, token, appVersionId, body);
      console.log(`  ✓ ${r.code} → ${r.status}`);
    }
    posted += 1;
  }
  console.log(`done: posted=${posted} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
