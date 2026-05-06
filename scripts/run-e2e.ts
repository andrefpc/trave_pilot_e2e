/**
 * One-command orchestrator: mint admin token, detect connected devices,
 * run Maestro on each platform that has a booted device + installed app,
 * push results to the dashboard matrix.
 *
 *   npm run e2e                       # all flows on every booted device
 *   npm run e2e -- --section=smk      # only smk/ flows
 *   npm run e2e -- --platform=android # only Android (ignore iOS sim)
 *   npm run e2e -- --dry-run          # plan only, don't actually run maestro
 *
 * Credentials: see scripts/lib/credentials.ts (env / ~/.config / keychain).
 */

import path from 'node:path';
import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mintAdminToken } from './lib/credentials.ts';
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

// Per-platform credentials so Android and iOS runs don't contend over the
// same user (lockout, refresh-token churn, share state).
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

interface Args {
  section: string | null;
  onlyPlatform: Platform | null;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { section: null, onlyPlatform: null, dryRun: false };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--section=')) out.section = a.slice('--section='.length);
    else if (a.startsWith('--platform=')) {
      const v = a.slice('--platform='.length);
      if (v !== 'android' && v !== 'ios') throw new Error(`platform must be android|ios, got: ${v}`);
      out.onlyPlatform = v;
    } else if (a === '--dry-run') out.dryRun = true;
    else throw new Error(`unknown arg: ${a}`);
  }
  return out;
}

interface Target {
  platform: Platform;
  device: string; // serial / udid
  appId: string;
  appVersion: string;
}

function discoverTargets(only: Platform | null): { targets: Target[]; warnings: string[] } {
  const targets: Target[] = [];
  const warnings: string[] = [];

  if (only !== 'ios') {
    const androids = listAndroidDevices();
    if (androids.length === 0) {
      warnings.push('No Android device detected. Boot an emulator or plug in a device, then re-run.');
    }
    for (const d of androids) {
      if (!isAppInstalledAndroid(d.serial, APP_ID_ANDROID)) {
        warnings.push(`Android ${d.serial}: ${APP_ID_ANDROID} is not installed.`);
        continue;
      }
      const version = getAppVersionAndroid(d.serial, APP_ID_ANDROID) ?? 'unknown';
      targets.push({ platform: 'android', device: d.serial, appId: APP_ID_ANDROID, appVersion: version });
    }
  }

  if (only !== 'android') {
    const ios = listBootedIosSimulators();
    if (ios.length === 0) {
      warnings.push('No booted iOS simulator detected. Boot one with `xcrun simctl boot "iPhone 15"` and re-run.');
    }
    for (const d of ios) {
      if (!isAppInstalledIos(d.udid, APP_ID_IOS)) {
        warnings.push(`iOS ${d.name} (${d.udid}): ${APP_ID_IOS} is not installed.`);
        continue;
      }
      const version = getAppVersionIos(d.udid, APP_ID_IOS) ?? 'unknown';
      targets.push({ platform: 'ios', device: d.udid, appId: APP_ID_IOS, appVersion: version });
    }
  }

  return { targets, warnings };
}

function flowsPath(section: string | null): string {
  const base = path.join(ROOT, 'flows');
  if (!section) return base;
  const dir = path.join(base, section);
  if (!fs.existsSync(dir)) throw new Error(`section folder not found: flows/${section}`);
  return dir;
}

type RunOutcome = 'pass' | 'fail' | 'no-flows';

function maestroArgsFor(target: Target, flowsDir: string, junitPath: string, shareToken: string): string[] {
  const free = TEST_CREDS[target.platform].free;
  const premium = TEST_CREDS[target.platform].premium;
  const args = [
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
    '--env', `TEST_NEW_PASSWORD=E2eSmoke!1`,
    '--env', `TEST_SHARE_TOKEN=${shareToken}`,
    '--env', `MAESTRO_API_BASE_URL=${API_BASE_URL}`,
    '--env', `MAESTRO_TEST_RESET_TOKEN=${TEST_RESET_TOKEN}`,
    '--format', 'junit',
    '--output', junitPath,
    // --debug-output omitted: Maestro 2.5.1 crashes serializing JS runScript
    // results via GraalVM (CompilerDirectives$ShouldNotReachHere). When that
    // upstream bug is fixed, re-add: '--debug-output', debugDir,
    // Per-platform exclusions: a flow tagged `ios-only` is skipped on Android
    // and vice versa. Keeps platform-divergent UX (e.g. Apple Sign-In on iOS,
    // Google Sign-In on Android) from polluting the cross-platform matrix.
    `--exclude-tags=needs-implementation,archived,helper,${target.platform === 'ios' ? 'android-only' : 'ios-only'}`,
    '--continuous=false',
    flowsDir,
  ];
  // Always pass --device explicitly so two parallel maestro processes don't
  // race over device selection. iOS uses simulator UDID; Android uses serial.
  args.unshift('--device', target.device);
  return args;
}

/**
 * Pre-grant common runtime permissions at the OS level so the app never sees
 * a permission prompt mid-flow. Best-effort: any failure is logged and
 * ignored (the per-flow `_dismiss_interrupts.yaml` is the safety net).
 */
function preGrantPermissions(target: Target): void {
  if (target.platform === 'ios') {
    const perms = ['notifications', 'location', 'location-always', 'photos', 'camera', 'microphone', 'contacts', 'calendar'];
    for (const p of perms) {
      const r = spawnSync('xcrun', ['simctl', 'privacy', target.device, 'grant', p, target.appId], {
        stdio: ['ignore', 'ignore', 'ignore'],
      });
      if (r.status !== 0) {
        // notifications isn't a valid simctl privacy service in older Xcode;
        // silently ignore.
      }
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

/**
 * Launch maestro for a single target. Captures stdout/stderr line-by-line and
 * prefixes each line with the platform tag so two concurrent runs interleave
 * cleanly in a single terminal.
 */
function runMaestroAsync(target: Target, flowsDir: string, shareToken: string): Promise<{ target: Target; outcome: RunOutcome; junitPath: string }> {
  const reportDir = path.join(ROOT, 'results', target.platform);
  fs.mkdirSync(reportDir, { recursive: true });
  const junitPath = path.join(reportDir, 'report.xml');
  fs.rmSync(junitPath, { force: true });

  const tag = target.platform === 'android' ? '\x1b[32m[android]\x1b[0m' : '\x1b[35m[ios]\x1b[0m';
  console.log(`${tag} starting on ${target.device} (app v${target.appVersion})`);
  preGrantPermissions(target);

  return new Promise((resolve) => {
    const child = spawn('maestro', maestroArgsFor(target, flowsDir, junitPath, shareToken), { cwd: ROOT });

    // iOS xcuitest driver occasionally hangs after the suite finishes (last
    // log line is the housekeeping `deleteOldFiles` and the process never
    // exits). Once the JUnit report is on disk every test has reported, so we
    // can safely tear down. Watch for the file to appear, then give maestro a
    // short grace window to exit cleanly; SIGKILL anything still alive.
    const POST_REPORT_GRACE_MS = 30_000;
    let reportSeenAt: number | null = null;
    const reportWatcher = setInterval(() => {
      if (reportSeenAt === null) {
        if (fs.existsSync(junitPath)) {
          reportSeenAt = Date.now();
        }
      } else if (Date.now() - reportSeenAt > POST_REPORT_GRACE_MS) {
        process.stdout.write(
          `${tag} report on disk but maestro hasn't exited after ${POST_REPORT_GRACE_MS / 1000}s — force-killing (likely the iOS xcuitest hang).\n`,
        );
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

    child.on('close', (code) => {
      clearInterval(reportWatcher);
      const exists = fs.existsSync(junitPath);
      const outcome: RunOutcome = !exists ? 'no-flows' : code === 0 ? 'pass' : 'fail';
      console.log(`${tag} finished (${outcome}, exit=${code})`);
      resolve({ target, outcome, junitPath });
    });
  });
}

async function reportResults(target: Target, junitPath: string, token: string): Promise<void> {
  const result = spawnSync(
    'npx',
    ['tsx', 'scripts/report-results.ts', `--platform=${target.platform}`, `--junit=${junitPath}`, '--register'],
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
    console.warn(`! report-results failed for ${target.platform}; matrix may be out of sync.`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  const flowsDir = flowsPath(args.section);
  console.log(`flows dir: ${path.relative(ROOT, flowsDir) || '.'}`);

  const { targets, warnings } = discoverTargets(args.onlyPlatform);
  for (const w of warnings) console.warn(`! ${w}`);
  if (targets.length === 0) {
    console.error('No runnable targets. Aborting.');
    process.exit(1);
  }

  console.log('targets:');
  for (const t of targets) console.log(`  - ${t.platform}: ${t.device} (app v${t.appVersion})`);

  if (args.dryRun) {
    console.log('--dry-run: not invoking maestro.');
    return;
  }

  const { token } = await mintAdminToken(API_BASE_URL);
  console.log(`✓ minted admin token (${token.length} chars)`);

  // Pre-unlock all seeded e2e users so any prior AUTH-L-05 / SEC-13 lockout
  // doesn't leak into this run. Production-safe (admin-authed endpoint).
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

  // Mint a fresh share token from the seeded premium plan owner so SMK-09
  // and any other deep-link share flow has a valid token to expand.
  // Soft-fail: if the test endpoint is unreachable, leave it empty — flows
  // that need it will fail with a clear maestro error.
  const ownerEmail = TEST_CREDS.android.premium.email;
  let shareToken = '';
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/seed-share-token`, {
      method: 'POST',
      headers: { 'X-Test-Reset-Token': TEST_RESET_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ownerEmail }),
    });
    if (res.ok) {
      const body = (await res.json()) as { share_token?: string };
      shareToken = body.share_token ?? '';
      console.log(`✓ minted share token (${shareToken.length} chars)`);
    } else {
      console.warn(`! seed-share-token → ${res.status} (continuing; SMK-09 will fail to expand the link)`);
    }
  } catch (err) {
    console.warn(`! seed-share-token threw (continuing): ${err instanceof Error ? err.message : String(err)}`);
  }

  // Fire all platform runs in parallel — each maestro process drives a
  // different device, so they don't contend.
  console.log(`\nrunning ${targets.length} platform(s) in parallel\n`);
  const completed = await Promise.all(targets.map((t) => runMaestroAsync(t, flowsDir, shareToken)));

  // Then report each platform's results sequentially so the matrix posts
  // don't stomp each other under concurrent admin token use.
  const summary: { target: Target; outcome: RunOutcome }[] = [];
  for (const c of completed) {
    summary.push({ target: c.target, outcome: c.outcome });
    if (c.outcome === 'no-flows') {
      console.log(`  ⊘ ${c.target.platform}: no runnable flows`);
    } else {
      await reportResults(c.target, c.junitPath, token);
    }
  }

  console.log('\n=== summary ===');
  for (const s of summary) {
    const icon = s.outcome === 'pass' ? '✓ pass' : s.outcome === 'fail' ? '✗ fail' : '⊘ no flows';
    console.log(`  ${icon}  ${s.target.platform} (${s.target.device}) v${s.target.appVersion}`);
  }
  const anyFail = summary.some((s) => s.outcome === 'fail');
  process.exit(anyFail ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
