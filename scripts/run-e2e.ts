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
import { spawnSync } from 'node:child_process';
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
const TEST_FREE_EMAIL = process.env.TEST_FREE_EMAIL || 'e2e+freeuser@travelpilotapp.com';
const TEST_FREE_PASSWORD = process.env.TEST_FREE_PASSWORD || 'E2eFreeUser!1';
const TEST_RESET_TOKEN = process.env.TEST_RESET_TOKEN || '';

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

function runMaestro(target: Target, flowsDir: string): { outcome: RunOutcome; junitPath: string } {
  const reportDir = path.join(ROOT, 'results', target.platform);
  fs.mkdirSync(reportDir, { recursive: true });
  const junitPath = path.join(reportDir, 'report.xml');
  const debugDir = path.join(reportDir, 'debug');
  fs.rmSync(debugDir, { recursive: true, force: true });
  fs.rmSync(junitPath, { force: true });

  const args = [
    'test',
    '--env', `APP_ID=${target.appId}`,
    '--env', `TEST_EMAIL=${TEST_FREE_EMAIL}`,
    '--env', `TEST_PASSWORD=${TEST_FREE_PASSWORD}`,
    '--env', `MAESTRO_API_BASE_URL=${API_BASE_URL}`,
    '--env', `MAESTRO_TEST_RESET_TOKEN=${TEST_RESET_TOKEN}`,
    '--format', 'junit',
    '--output', junitPath,
    '--debug-output', debugDir,
    '--exclude-tags=needs-implementation,archived',
    flowsDir,
  ];
  if (target.platform === 'android') args.unshift('--device', target.device);
  // Maestro auto-picks the only booted iOS sim, so we don't pass --device for iOS.

  console.log(`\n→ maestro ${target.platform} (${target.device}) v${target.appVersion}`);
  const result = spawnSync('maestro', args, { stdio: 'inherit', cwd: ROOT });

  // Maestro skips writing report.xml when no flows match the include/exclude
  // tag filter. Treat that as a no-op (no flows to run is a config state, not
  // a failure) so the orchestrator exits 0 once Wave 1 implementations land.
  if (!fs.existsSync(junitPath)) {
    return { outcome: 'no-flows', junitPath };
  }
  return { outcome: result.status === 0 ? 'pass' : 'fail', junitPath };
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
    console.error(`! report-results failed for ${target.platform}; matrix may be out of sync.`);
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

  const summary: { target: Target; outcome: RunOutcome }[] = [];
  for (const t of targets) {
    const { outcome, junitPath } = runMaestro(t, flowsDir);
    summary.push({ target: t, outcome });
    if (outcome === 'no-flows') {
      console.log(`  ⊘ no runnable flows (all tagged needs-implementation/archived)`);
    } else {
      await reportResults(t, junitPath, token);
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
