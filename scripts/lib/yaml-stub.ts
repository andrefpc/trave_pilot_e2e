import type { TestCase } from './api.ts';

export const HEADER_START = '# >>> dashboard-meta';
export const HEADER_END = '# <<< dashboard-meta';

function tagsFor(tc: TestCase, sectionDir: string): string[] {
  const tags = ['needs-implementation', sectionDir];
  if (tc.priority) tags.push(tc.priority.toLowerCase());
  return tags;
}

function reproBlock(text: string | null): string {
  if (!text) return '# (no repro steps recorded)';
  return text
    .split(/\r?\n/)
    .map((line) => `# ${line}`)
    .join('\n');
}

export function renderHeader(tc: TestCase, sectionDir: string): string {
  return [
    HEADER_START,
    `# ${tc.code} — ${tc.title}`,
    `# Section: ${tc.section}`,
    `# Priority: ${tc.priority}`,
    '# Repro:',
    reproBlock(tc.repro_steps),
    HEADER_END,
  ].join('\n');
}

export function renderStub(tc: TestCase, sectionDir: string): string {
  const tags = tagsFor(tc, sectionDir);
  const header = renderHeader(tc, sectionDir);
  return [
    'appId: ${APP_ID}',
    `name: ${tc.code}`,
    `tags: [${tags.join(', ')}]`,
    '---',
    header,
    '',
    '# TODO: implement interaction steps. Remove the `needs-implementation`',
    '# tag above once the flow asserts the expected behavior end-to-end.',
    '- runFlow: ../common/_reset_data.yaml',
    '- runFlow: ../common/_open_app.yaml',
    '',
  ].join('\n');
}

/**
 * Replace only the dashboard-meta header inside an existing flow file. Returns
 * the new contents, or null if the file has no sentinel block (in which case
 * the caller should leave it alone — it's a hand-authored file from before
 * sync was wired up).
 */
export function rewriteHeader(existing: string, tc: TestCase, sectionDir: string): string | null {
  const startIdx = existing.indexOf(HEADER_START);
  const endIdx = existing.indexOf(HEADER_END);
  if (startIdx < 0 || endIdx < 0 || endIdx < startIdx) return null;
  const newHeader = renderHeader(tc, sectionDir);
  const before = existing.slice(0, startIdx);
  const after = existing.slice(endIdx + HEADER_END.length);
  return before + newHeader + after;
}
