/**
 * Section-by-section runner. iOS and Android run in parallel; within each
 * platform, sections run sequentially. Results post to the dashboard after
 * each section so the "Automated Tests Results" page updates live.
 *
 * One run_id per platform is reused across every section, so each platform
 * shows up as a single row in the dashboard.
 *
 *   npm run e2e:per-section
 *   npm run e2e:per-section -- --platform=android
 *   npm run e2e:per-section -- --section=smk,auth,wizard
 */

import path from 'node:path';
import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { mintAdminToken, loadUserEnv } from './lib/credentials.ts';

// Pull TEST_RESET_TOKEN, ADMIN_EMAIL, etc. from ~/.config/trave-pilot-e2e/.env
// before any module-level `process.env.X || default` lookups run. Process-env
// values still win, so one-off overrides on the command line keep working.
loadUserEnv();
import {
  listAndroidDevices,
  listBootedIosSimulators,
  isAppInstalledAndroid,
  isAppInstalledIos,
  getAppVersionAndroid,
  getAppVersionIos,
  type Platform,
} from './lib/devices.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const APP_ID_ANDROID = process.env.APP_ID_ANDROID || 'com.travelpilotapp';
const APP_ID_IOS = process.env.APP_ID_IOS || 'com.travelpilotapp';
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.travelpilotapp.com';
const TEST_RESET_TOKEN = process.env.TEST_RESET_TOKEN || '';

const TEST_CREDS = {
  android: {
    free: {
      email: process.env.TEST_ANDROID_FREE_EMAIL || 'e2e+android-free@travelpilotapp.com',
      password: process.env.TEST_ANDROID_FREE_PASSWORD || 'E2eAndroidFree!1',
    },
    premium: {
      email: process.env.TEST_ANDROID_PREMIUM_EMAIL || 'e2e+android-premium@travelpilotapp.com',
      password: process.env.TEST_ANDROID_PREMIUM_PASSWORD || 'E2eAndroidPremium!1',
    },
  },
  ios: {
    free: {
      email: process.env.TEST_IOS_FREE_EMAIL || 'e2e+ios-free@travelpilotapp.com',
      password: process.env.TEST_IOS_FREE_PASSWORD || 'E2eIosFree!1',
    },
    premium: {
      email: process.env.TEST_IOS_PREMIUM_EMAIL || 'e2e+ios-premium@travelpilotapp.com',
      password: process.env.TEST_IOS_PREMIUM_PASSWORD || 'E2eIosPremium!1',
    },
  },
} as const;

// Authoring order: smoke first, then P0-heavy sections, then the rest
// alphabetically. Sections that exist but have zero non-archived flows are
// pruned at runtime.
const ORDERED_SECTIONS = [
  'smk',
  'auth',
  'wizard',
  'home',
  'plans',
  'generation',
  'itinerary',
  'network',
  'photos',
  'premium',
  'profile',
  'settings',
  'tickets',
];

interface Args {
  sections: string[] | null;
  onlyPlatform: Platform | null;
  runIdAndroid: string | null;
  runIdIos: string | null;
  skipUnlock: boolean;
  skipShareToken: boolean;
  androidSerial: string | null;
  iosUdid: string | null;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    sections: null,
    onlyPlatform: null,
    runIdAndroid: null,
    runIdIos: null,
    skipUnlock: false,
    skipShareToken: false,
    androidSerial: null,
    iosUdid: null,
  };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--section=')) {
      out.sections = a.slice('--section='.length).split(',').map((s) => s.trim()).filter(Boolean);
    } else if (a.startsWith('--platform=')) {
      const v = a.slice('--platform='.length);
      if (v !== 'android' && v !== 'ios') throw new Error(`platform must be android|ios, got: ${v}`);
      out.onlyPlatform = v;
    } else if (a.startsWith('--run-id-android=')) {
      out.runIdAndroid = a.slice('--run-id-android='.length);
    } else if (a.startsWith('--run-id-ios=')) {
      out.runIdIos = a.slice('--run-id-ios='.length);
    } else if (a === '--skip-unlock') {
      out.skipUnlock = true;
    } else if (a === '--skip-share-token') {
      out.skipShareToken = true;
    } else if (a.startsWith('--android-serial=')) {
      out.androidSerial = a.slice('--android-serial='.length);
    } else if (a.startsWith('--ios-udid=')) {
      out.iosUdid = a.slice('--ios-udid='.length);
    } else {
      throw new Error(`unknown arg: ${a}`);
    }
  }
  return out;
}

interface Target {
  platform: Platform;
  device: string;
  appId: string;
  appVersion: string;
  runId: string;
}

function discoverTargets(
  only: Platform | null,
  runIdAndroid: string | null,
  runIdIos: string | null,
  androidSerialFilter: string | null,
  iosUdidFilter: string | null,
): { targets: Target[]; warnings: string[] } {
  const targets: Target[] = [];
  const warnings: string[] = [];

  if (only !== 'ios') {
    let androids = listAndroidDevices();
    if (androidSerialFilter) {
      androids = androids.filter((d) => d.serial === androidSerialFilter);
      if (androids.length === 0) {
        warnings.push(`No Android device matched --android-serial=${androidSerialFilter}.`);
      }
    }
    if (androids.length === 0 && !androidSerialFilter) {
      warnings.push('No Android device detected. Boot an emulator or plug in a device, then re-run.');
    }
    for (const d of androids) {
      if (!isAppInstalledAndroid(d.serial, APP_ID_ANDROID)) {
        warnings.push(`Android ${d.serial}: ${APP_ID_ANDROID} is not installed.`);
        continue;
      }
      const version = getAppVersionAndroid(d.serial, APP_ID_ANDROID) ?? 'unknown';
      targets.push({
        platform: 'android',
        device: d.serial,
        appId: APP_ID_ANDROID,
        appVersion: version,
        runId: runIdAndroid ?? randomUUID(),
      });
    }
  }

  if (only !== 'android') {
    let ios = listBootedIosSimulators();
    if (iosUdidFilter) {
      ios = ios.filter((d) => d.udid === iosUdidFilter);
      if (ios.length === 0) {
        warnings.push(`No iOS simulator matched --ios-udid=${iosUdidFilter}.`);
      }
    }
    if (ios.length === 0 && !iosUdidFilter) {
      warnings.push('No booted iOS simulator detected. Boot one and re-run.');
    }
    for (const d of ios) {
      if (!isAppInstalledIos(d.udid, APP_ID_IOS)) {
        warnings.push(`iOS ${d.name} (${d.udid}): ${APP_ID_IOS} is not installed.`);
        continue;
      }
      const version = getAppVersionIos(d.udid, APP_ID_IOS) ?? 'unknown';
      targets.push({
        platform: 'ios',
        device: d.udid,
        appId: APP_ID_IOS,
        appVersion: version,
        runId: runIdIos ?? randomUUID(),
      });
    }
  }

  return { targets, warnings };
}

function activeSections(filter: string[] | null): string[] {
  const candidates = filter ?? ORDERED_SECTIONS;
  const out: string[] = [];
  for (const s of candidates) {
    const dir = path.join(ROOT, 'flows', s);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => /^[A-Z].*\.yaml$/.test(f));
    if (files.length === 0) continue;
    out.push(s);
  }
  return out;
}

function maestroArgsFor(target: Target, section: string, junitPath: string, shareToken: string): string[] {
  const free = TEST_CREDS[target.platform].free;
  const premium = TEST_CREDS[target.platform].premium;
  const flowsDir = path.join(ROOT, 'flows', section);
  return [
    '--device', target.device,
    'test',
    '--env', `APP_ID=${target.appId}`,
    '--env', `TEST_EMAIL=${free.email}`,
    '--env', `TEST_PASSWORD=${free.password}`,
    '--env', `TEST_FREE_EMAIL=${free.email}`,
    '--env', `TEST_FREE_PASSWORD=${free.password}`,
    '--env', `TEST_PREMIUM_EMAIL=${premium.email}`,
    '--env', `TEST_PREMIUM_PASSWORD=${premium.password}`,
    '--env', `TEST_NEW_NAME=E2E Smoke User`,
    '--env', `TEST_NEW_EMAIL=e2e+smoke-${Date.now()}@travelpilotapp.com`,
    // Per-invocation run id so flows that register multiple users in the
    // same maestro session can each pick a unique email (e.g.,
    // `e2e+r11-${TEST_RUN_ID}@…`). Otherwise the second register would
    // collide with the first on the same TEST_NEW_EMAIL.
    '--env', `TEST_RUN_ID=${Date.now()}`,
    // Boundary names for AUTH-R-13 (255-char name boundary).
    '--env', `TEST_NAME_255=${'a'.repeat(255)}`,
    '--env', `TEST_NAME_256=${'a'.repeat(256)}`,
    // A second TEST_NEW_EMAIL slot for flows that register two distinct
    // users in one session (AUTH-R-13 boundary test).
    '--env', `TEST_NEW_EMAIL_2=e2e+smoke2-${Date.now()}@travelpilotapp.com`,
    // Dedicated lockout user for AUTH-L-05 / L-06. Orchestrator unlocks
    // this user at section start; the test then triggers lockout via 5
    // wrong-password attempts and asserts the lockout dialog.
    '--env', `TEST_LOCKED_EMAIL=e2e+locked@travelpilotapp.com`,
    '--env', `TEST_LOCKED_PASSWORD=E2eLocked!1`,
    // Dedicated reset user for AUTH-F-12 / F-13. Orchestrator changes
    // this user's password to TEST_NEW_PASSWORD before the section runs;
    // the OLD password is the seed value (which then becomes "stale").
    '--env', `TEST_RESET_EMAIL=e2e+reset@travelpilotapp.com`,
    '--env', `TEST_RESET_OLD_PASSWORD=E2eReset!1`,
    // TEST_EXPIRED_RECOVERY_CODE is filled in at runtime after the
    // orchestrator's setup step (resetE2eState helper) calls the
    // seed-expired-recovery-code endpoint.
    '--env', `TEST_EXPIRED_RECOVERY_CODE=${process.env.TEST_EXPIRED_RECOVERY_CODE ?? ''}`,
    // Password uses ONLY first-symbol-page characters on the iOS keyboard
    // (avoids `#` and `%` on the second symbol page). Maestro's `inputText`
    // appears unreliable when the iOS keyboard has to switch symbol pages
    // mid-string — the resulting field value loses everything after the
    // page-switch. Strict validators are still satisfied: 13 chars, multiple
    // upper + lower, multiple digits, special.
    '--env', `TEST_NEW_PASSWORD=Password!1234`,
    '--env', `TEST_SHARE_TOKEN=${shareToken}`,
    '--env', `MAESTRO_API_BASE_URL=${API_BASE_URL}`,
    '--env', `MAESTRO_TEST_RESET_TOKEN=${TEST_RESET_TOKEN}`,
    '--format', 'junit',
    '--output', junitPath,
    `--include-tags=${section}`,
    // `manual-only`: flows that exercise scenarios Maestro can't simulate
    // on a sim/emulator (e.g. real cross-device session revocation, real
    // airplane-mode network disconnect). Kept in the dashboard catalog for
    // human QA but excluded from automated runs.
    `--exclude-tags=needs-implementation,archived,helper,manual-only,${target.platform === 'ios' ? 'android-only' : 'ios-only'}`,
    '--continuous=false',
    flowsDir,
  ];
}

function preGrantPermissions(target: Target): void {
  if (target.platform === 'ios') {
    // user-tracking pre-grants the App Tracking Transparency prompt that
    // otherwise pops up mid-flow (when an analytics/ads SDK initializes
    // post-login) and covers the Home screen, breaking subsequent
    // assertions. Best-effort: silently skipped on Xcode versions that
    // don't accept the service name.
    const perms = ['notifications', 'location', 'location-always', 'photos', 'camera', 'microphone', 'contacts', 'calendar', 'user-tracking'];
    for (const p of perms) {
      spawnSync('xcrun', ['simctl', 'privacy', target.device, 'grant', p, target.appId], {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
    }
  } else {
    const perms = [
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.CAMERA',
    ];
    for (const p of perms) {
      spawnSync('adb', ['-s', target.device, 'shell', 'pm', 'grant', target.appId, p], {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
    }
  }
}

interface SectionOutcome {
  target: Target;
  section: string;
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  pending: number;
  failingCodes: string[];
  durationSec: number;
  ranOk: boolean;
  junitPath: string;
}

function tagFor(p: Platform): string {
  return p === 'android' ? '\x1b[32m[android]\x1b[0m' : '\x1b[35m[ios]\x1b[0m';
}

function runMaestroSection(target: Target, section: string, shareToken: string): Promise<SectionOutcome> {
  const reportDir = path.join(ROOT, 'results', target.platform);
  fs.mkdirSync(reportDir, { recursive: true });
  const junitPath = path.join(reportDir, `${section}.xml`);
  fs.rmSync(junitPath, { force: true });

  const tag = tagFor(target.platform);
  const startedAt = Date.now();
  console.log(`${tag} → ${section} starting`);
  preGrantPermissions(target);

  return new Promise((resolve) => {
    const child = spawn('maestro', maestroArgsFor(target, section, junitPath, shareToken), { cwd: ROOT });

    // Same iOS xcuitest hang guard as run-e2e.ts: once JUnit lands, give a
    // short grace window then SIGKILL anything still alive.
    const POST_REPORT_GRACE_MS = 30_000;
    let reportSeenAt: number | null = null;
    const reportWatcher = setInterval(() => {
      if (reportSeenAt === null) {
        if (fs.existsSync(junitPath)) reportSeenAt = Date.now();
      } else if (Date.now() - reportSeenAt > POST_REPORT_GRACE_MS) {
        try { child.kill('SIGKILL'); } catch { /* ignore */ }
        clearInterval(reportWatcher);
      }
    }, 1000);

    const pipe = (stream: NodeJS.ReadableStream): void => {
      let buf = '';
      stream.on('data', (chunk: Buffer) => {
        buf += chunk.toString();
        let idx;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.trim()) process.stdout.write(`${tag} ${line}\n`);
        }
      });
      stream.on('end', () => {
        if (buf.trim()) process.stdout.write(`${tag} ${buf}\n`);
      });
    };
    pipe(child.stdout);
    pipe(child.stderr);

    child.on('close', () => {
      clearInterval(reportWatcher);
      const durationSec = Math.round((Date.now() - startedAt) / 10) / 100;
      const counts = parseJunitCounts(junitPath);
      console.log(`${tag} ← ${section} done in ${durationSec}s (pass=${counts.passed}/${counts.total} fail=${counts.failed} blocked=${counts.blocked})`);
      resolve({
        target,
        section,
        ...counts,
        durationSec,
        ranOk: fs.existsSync(junitPath),
        junitPath,
      });
    });
  });
}

function parseJunitCounts(junitPath: string): {
  total: number; passed: number; failed: number; blocked: number; pending: number; failingCodes: string[];
} {
  const out = { total: 0, passed: 0, failed: 0, blocked: 0, pending: 0, failingCodes: [] as string[] };
  if (!fs.existsSync(junitPath)) return out;
  const xml = fs.readFileSync(junitPath, 'utf8');
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    isArray: (n) => n === 'testsuite' || n === 'testcase',
  });
  const parsed = parser.parse(xml);
  const root = parsed.testsuites ?? parsed;
  const suites = root.testsuite ?? [];
  for (const suite of suites) {
    for (const tc of suite.testcase ?? []) {
      out.total += 1;
      const code = String(tc['@_name'] ?? '').trim().toUpperCase();
      if (tc.failure || tc.failure === '') {
        out.failed += 1;
        if (code) out.failingCodes.push(code);
      } else if (tc.error || tc.error === '') {
        out.blocked += 1;
      } else if (tc.skipped || tc.skipped === '') {
        out.pending += 1;
      } else {
        out.passed += 1;
      }
    }
  }
  return out;
}

async function reportSection(target: Target, junitPath: string, token: string): Promise<void> {
  const result = spawnSync(
    'npx',
    [
      'tsx',
      'scripts/report-results.ts',
      `--platform=${target.platform}`,
      `--junit=${junitPath}`,
      `--run-id=${target.runId}`,
      '--register',
    ],
    {
      stdio: 'inherit',
      cwd: ROOT,
      env: {
        ...process.env,
        ADMIN_TOKEN: token,
        API_BASE_URL,
        APP_VERSION: target.appVersion,
      },
    },
  );
  if (result.status !== 0) {
    console.warn(`! report-results failed for ${target.platform} (section dashboard push may be incomplete).`);
  }
}

function summarizeRunning(by: Map<Platform, { passed: number; failed: number; blocked: number; pending: number; total: number }>, p: Platform): string {
  const r = by.get(p);
  if (!r) return '';
  return `total ${r.passed}✓ ${r.failed}✗ ${r.blocked}⊘ ${r.pending}…`;
}

function feedbackLine(section: string, results: SectionOutcome[], running: Map<Platform, { passed: number; failed: number; blocked: number; pending: number; total: number }>, showRunning: boolean): string {
  const lines: string[] = [];
  for (const o of results) {
    const failBlurb = o.failingCodes.length
      ? ` [fail: ${o.failingCodes.slice(0, 5).join(',')}${o.failingCodes.length > 5 ? '…' : ''}]`
      : '';
    const platLabel = o.target.platform === 'android' ? 'Android' : 'iOS    ';
    const head = `  ${platLabel}: ${o.passed}/${o.total} ✓  ${o.failed} ✗  ${o.blocked} ⊘  (Δ ${o.durationSec}s)${failBlurb}`;
    const tail = showRunning ? `   |   running ${summarizeRunning(running, o.target.platform)}` : '';
    lines.push(head + tail);
  }
  return `\n${section}\n${lines.join('\n')}`;
}

/**
 * Per-section pre-flow setup that needs the API:
 *   - sets the reset-flow user's password to TEST_NEW_PASSWORD so AUTH-F-12
 *     can log in with the "new" password and AUTH-F-13 sees its old
 *     password rejected;
 *   - seeds an expired password-reset code for the same user so AUTH-F-07
 *     can input it and verify the "Invalid reset token" dialog.
 * Soft-fails if the test route is gated off — the affected flows will
 * just keep failing in their current shape.
 */
async function setupAuthFlowState(): Promise<void> {
  const token = process.env.TEST_RESET_TOKEN;
  if (!token) return;
  const newPassword = 'Password!1234';

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/set-password`, {
      method: 'POST',
      headers: { 'X-Test-Reset-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'e2e+reset@travelpilotapp.com', password: newPassword }),
    });
    if (res.ok) console.log(`✓ set password for e2e+reset@ (AUTH-F-12/F-13 setup)`);
    else console.warn(`! set-password → ${res.status} (continuing)`);
  } catch (err) {
    console.warn(`! set-password threw: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/seed-expired-recovery-code`, {
      method: 'POST',
      headers: { 'X-Test-Reset-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'e2e+reset@travelpilotapp.com' }),
    });
    if (res.ok) {
      const body = (await res.json()) as { code?: string };
      if (body.code) {
        process.env.TEST_EXPIRED_RECOVERY_CODE = body.code;
        console.log(`✓ seeded expired recovery code (AUTH-F-07 setup)`);
      }
    } else {
      console.warn(`! seed-expired-recovery-code → ${res.status} (continuing)`);
    }
  } catch (err) {
    console.warn(`! seed-expired-recovery-code threw: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * Reset the seeded e2e users + clear their travel plans / refresh tokens /
 * notifications. Replaces the legacy `_reset_data.yaml` runFlow which used
 * Maestro's `runScript` and crashes on Maestro 2.5.1's GraalVM serializer
 * bug. Idempotent — soft-fails if the route is gated off (no
 * TEST_RESET_TOKEN configured).
 */
async function resetE2eState(): Promise<void> {
  const token = process.env.TEST_RESET_TOKEN;
  if (!token) {
    console.warn('! resetE2eState: TEST_RESET_TOKEN unset, skipping');
    return;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/reset`, {
      method: 'POST',
      headers: { 'X-Test-Reset-Token': token, 'Content-Type': 'application/json' },
      body: '{}',
    });
    if (res.ok) {
      const body = (await res.json()) as { reset_users?: unknown[] };
      console.log(`✓ reset e2e state (${body.reset_users?.length ?? 0} users)`);
    } else {
      console.warn(`! resetE2eState → ${res.status} (continuing)`);
    }
  } catch (err) {
    console.warn(`! resetE2eState threw (continuing): ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function unlockAccounts(token: string): Promise<void> {
  const allEmails = [
    TEST_CREDS.android.free.email, TEST_CREDS.android.premium.email,
    TEST_CREDS.ios.free.email, TEST_CREDS.ios.premium.email,
  ];
  for (const email of allEmails) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/actions/unlock-account`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        const body = (await res.json()) as { cleared?: boolean };
        console.log(`✓ unlocked ${email}${body.cleared ? ' (cleared lockout)' : ''}`);
      } else {
        console.warn(`! unlock ${email} → ${res.status} (continuing)`);
      }
    } catch (err) {
      console.warn(`! unlock ${email} threw (continuing): ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

async function mintShareToken(): Promise<string> {
  const ownerEmail = TEST_CREDS.android.premium.email;
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/seed-share-token`, {
      method: 'POST',
      headers: { 'X-Test-Reset-Token': TEST_RESET_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerEmail }),
    });
    if (res.ok) {
      const body = (await res.json()) as { share_token?: string };
      return body.share_token ?? '';
    }
    console.warn(`! seed-share-token → ${res.status} (SMK-09 will fail to expand the link)`);
  } catch (err) {
    console.warn(`! seed-share-token threw (continuing): ${err instanceof Error ? err.message : String(err)}`);
  }
  return '';
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  const { targets, warnings } = discoverTargets(args.onlyPlatform, args.runIdAndroid, args.runIdIos, args.androidSerial, args.iosUdid);
  for (const w of warnings) console.warn(`! ${w}`);
  if (targets.length === 0) {
    console.error('No runnable targets. Aborting.');
    process.exit(1);
  }

  const sections = activeSections(args.sections);
  if (sections.length === 0) {
    console.error('No populated sections found. Aborting.');
    process.exit(1);
  }

  console.log('targets:');
  for (const t of targets) {
    console.log(`  - ${t.platform}: ${t.device} (app v${t.appVersion}) run_id=${t.runId}`);
  }
  console.log(`sections: ${sections.join(' → ')}\n`);

  const { token } = await mintAdminToken(API_BASE_URL);
  console.log(`✓ minted admin token (${token.length} chars)`);

  if (!args.skipUnlock) await unlockAccounts(token);
  await resetE2eState();
  await setupAuthFlowState();
  const shareToken = args.skipShareToken ? (process.env.TEST_SHARE_TOKEN || '') : await mintShareToken();
  if (shareToken) console.log(`✓ share token (${shareToken.length} chars)`);

  const startAll = Date.now();
  const running = new Map<Platform, { passed: number; failed: number; blocked: number; pending: number; total: number }>();
  for (const t of targets) running.set(t.platform, { passed: 0, failed: 0, blocked: 0, pending: 0, total: 0 });

  let sectionIdx = 0;
  for (const section of sections) {
    sectionIdx += 1;
    console.log(`\n=== section ${sectionIdx}/${sections.length}: ${section} ===`);
    const outcomes = await Promise.all(targets.map((t) => runMaestroSection(t, section, shareToken)));

    // Post per-platform results sequentially (single shared admin token).
    for (const o of outcomes) {
      if (!o.ranOk) {
        console.warn(`! ${o.target.platform} ${section}: no JUnit produced — skipping dashboard push`);
        continue;
      }
      await reportSection(o.target, o.junitPath, token);
    }

    for (const o of outcomes) {
      const r = running.get(o.target.platform);
      if (!r) continue;
      r.passed += o.passed;
      r.failed += o.failed;
      r.blocked += o.blocked;
      r.pending += o.pending;
      r.total += o.total;
    }

    const showRunning = sectionIdx >= 3;
    console.log(feedbackLine(section, outcomes, running, showRunning));
  }

  const totalSec = Math.round((Date.now() - startAll) / 1000);
  console.log(`\nRun complete in ${totalSec}s`);
  for (const t of targets) {
    const r = running.get(t.platform)!;
    const label = t.platform === 'android' ? 'Android' : 'iOS    ';
    console.log(`  ${label}  run_id=${t.runId}  pass ${r.passed}/${r.total}  fail ${r.failed}  blocked ${r.blocked}  pending ${r.pending}`);
  }
  console.log(`  Dashboard: ${API_BASE_URL}/admin → Test Suite → Automated Tests Results`);

  // Don't fail-exit on test failures; we already printed them. Only crash on
  // infra issues (which throw earlier).
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
