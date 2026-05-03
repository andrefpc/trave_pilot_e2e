// Maps a test case `code` prefix or `section` string to the on-disk folder
// under flows/. Single source of truth for filesystem layout.

const PREFIX_TO_DIR: Record<string, string> = {
  SMK: 'smk',
  AUTH: 'auth',
  WIZ: 'wizard',
  GEN: 'generation',
  HOME: 'home',
  PLN: 'plans',
  ITN: 'itinerary',
  EDIT: 'edit',
  REORD: 'reorder',
  SHARE: 'sharing',
  PHOTO: 'photos',
  TIX: 'tickets',
  FEED: 'feed',
  PREM: 'premium',
  MAP: 'map',
  PROF: 'profile',
  SET: 'settings',
  NOTIF: 'notifications',
  NET: 'network',
  SEC: 'security',
  PERF: 'perf',
  A11Y: 'a11y',
};

const SECTION_TO_DIR: Array<[RegExp, string]> = [
  [/smoke/i, 'smk'],
  [/welcome|login|register|recovery|password|social|sign[- ]?in/i, 'auth'],
  [/wizard|onboarding/i, 'wizard'],
  [/plan generation|ai/i, 'generation'],
  [/home|dashboard/i, 'home'],
  [/travel plans?|plan management/i, 'plans'],
  [/itinerary view/i, 'itinerary'],
  [/edit|rearrange/i, 'edit'],
  [/reorder/i, 'reorder'],
  [/shar/i, 'sharing'],
  [/photo|gallery|milestone/i, 'photos'],
  [/ticket/i, 'tickets'],
  [/feed|recommend/i, 'feed'],
  [/subscription|premium|billing/i, 'premium'],
  [/map/i, 'map'],
  [/profile|account/i, 'profile'],
  [/settings|preferenc/i, 'settings'],
  [/notification|reminder/i, 'notifications'],
  [/network|offline|error/i, 'network'],
  [/security|auth hardening/i, 'security'],
  [/performance|stability/i, 'perf'],
  [/localization|accessibility|theming/i, 'a11y'],
];

export function dirForCase(code: string, section: string): string {
  const prefix = code.split('-')[0]?.toUpperCase() ?? '';
  if (PREFIX_TO_DIR[prefix]) return PREFIX_TO_DIR[prefix];
  for (const [pattern, dir] of SECTION_TO_DIR) {
    if (pattern.test(section)) return dir;
  }
  // Fallback: an "uncategorized" bin so nothing silently disappears.
  return 'uncategorized';
}
