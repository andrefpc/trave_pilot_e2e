import { execFileSync } from 'node:child_process';

export type Platform = 'android' | 'ios';

export interface AndroidDevice {
  serial: string;
  state: string;
}

export interface IosDevice {
  udid: string;
  name: string;
  state: string; // "Booted" | "Shutdown"
}

export function listAndroidDevices(): AndroidDevice[] {
  try {
    const out = execFileSync('adb', ['devices'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
    return out
      .split('\n')
      .slice(1)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('*'))
      .map((line) => {
        const [serial, state] = line.split(/\s+/);
        return { serial, state };
      })
      .filter((d) => d.state === 'device');
  } catch {
    return [];
  }
}

export function listBootedIosSimulators(): IosDevice[] {
  try {
    const out = execFileSync(
      'xcrun',
      ['simctl', 'list', 'devices', '--json', 'booted'],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString();
    const json = JSON.parse(out) as { devices: Record<string, IosDevice[]> };
    const all: IosDevice[] = [];
    for (const list of Object.values(json.devices)) {
      for (const d of list) all.push(d);
    }
    return all;
  } catch {
    return [];
  }
}

export function isAppInstalledAndroid(serial: string, appId: string): boolean {
  try {
    const out = execFileSync(
      'adb',
      ['-s', serial, 'shell', 'pm', 'list', 'packages', appId],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString();
    return out.split('\n').some((line) => line.trim() === `package:${appId}`);
  } catch {
    return false;
  }
}

export function isAppInstalledIos(udid: string, appId: string): boolean {
  try {
    execFileSync('xcrun', ['simctl', 'get_app_container', udid, appId], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

export function getAppVersionAndroid(serial: string, appId: string): string | null {
  try {
    const out = execFileSync(
      'adb',
      ['-s', serial, 'shell', 'dumpsys', 'package', appId],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString();
    const m = out.match(/versionName=([^\s]+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export function getAppVersionIos(udid: string, appId: string): string | null {
  try {
    const containerOut = execFileSync(
      'xcrun',
      ['simctl', 'get_app_container', udid, appId, 'app'],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString().trim();
    const plistOut = execFileSync(
      'plutil',
      ['-extract', 'CFBundleShortVersionString', 'raw', '-o', '-', `${containerOut}/Info.plist`],
      { stdio: ['ignore', 'pipe', 'ignore'] },
    ).toString().trim();
    return plistOut || null;
  } catch {
    return null;
  }
}
