import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const USER_ENV_PATH = path.join(os.homedir(), '.config', 'trave-pilot-e2e', '.env');

/**
 * Merge KEY=value lines from ~/.config/trave-pilot-e2e/.env into process.env.
 * Existing process.env entries take precedence (so a one-off
 * `TEST_RESET_TOKEN=… npm run e2e:per-section` still wins). Lines starting
 * with `#` are skipped. Quote-stripping mirrors getAdminPassword().
 *
 * Idempotent — safe to call from every entrypoint.
 */
export function loadUserEnv(): void {
  if (!fs.existsSync(USER_ENV_PATH)) return;
  const text = fs.readFileSync(USER_ENV_PATH, 'utf8');
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx < 1) continue;
    const key = line.slice(0, eqIdx).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = line.slice(eqIdx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    process.env[key] = value;
  }
}

/**
 * Resolve the admin password without storing it in this repo.
 *
 * Lookup order (first hit wins):
 *   1. ADMIN_PASSWORD env var (one-shot, e.g. inline before the command).
 *   2. ~/.config/trave-pilot-e2e/.env (user-managed, gitignored, lives
 *      outside this repo so a stray `git add` can't catch it).
 *   3. macOS keychain entry "travel-pilot-admin" (when present — set up
 *      out-of-band by the user with `security add-generic-password ...`).
 *   4. Throw with instructions for setting one of the above.
 */
export function getAdminPassword(): string {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;

  const userEnvPath = path.join(os.homedir(), '.config', 'trave-pilot-e2e', '.env');
  if (fs.existsSync(userEnvPath)) {
    const text = fs.readFileSync(userEnvPath, 'utf8');
    const m = text.match(/^\s*ADMIN_PASSWORD\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].replace(/^['"]|['"]$/g, '');
  }

  if (process.platform === 'darwin') {
    try {
      const out = execFileSync(
        'security',
        ['find-generic-password', '-s', 'travel-pilot-admin', '-w'],
        { stdio: ['ignore', 'pipe', 'ignore'] },
      ).toString().trim();
      if (out) return out;
    } catch {
      // fall through
    }
  }

  throw new Error(
    [
      'No ADMIN_PASSWORD found. Set it via one of:',
      '  1) Inline:  ADMIN_PASSWORD=... npm run e2e',
      '  2) File:    mkdir -p ~/.config/trave-pilot-e2e && \\',
      '              echo "ADMIN_PASSWORD=..." > ~/.config/trave-pilot-e2e/.env',
      '  3) Keychain (macOS):',
      '              security add-generic-password -s travel-pilot-admin \\',
      '                -a admin@travelpilot.com -w \'<password>\'',
    ].join('\n'),
  );
}

/**
 * Resolve the admin email. Defaults to admin@travelpilot.com (matches Railway
 * production). Override via ADMIN_EMAIL env var if you stand up a separate
 * e2e-bot user later.
 */
export function getAdminEmail(): string {
  return process.env.ADMIN_EMAIL || 'admin@travelpilot.com';
}

export interface AdminLoginResult {
  token: string;
  baseUrl: string;
}

export async function mintAdminToken(baseUrl: string): Promise<AdminLoginResult> {
  const email = getAdminEmail();
  const password = getAdminPassword();
  const res = await fetch(`${baseUrl}/api/v1/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`admin login failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { token?: string };
  if (!json.token) throw new Error('admin login response did not include a token');
  return { token: json.token, baseUrl };
}
