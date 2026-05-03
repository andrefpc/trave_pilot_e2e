import { z } from 'zod';

const TestCaseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  title: z.string(),
  section: z.string(),
  repro_steps: z.string().nullable(),
  priority: z.string(),
  is_archived: z.boolean(),
});
export type TestCase = z.infer<typeof TestCaseSchema>;

const ListResponseSchema = z.object({
  items: z.array(TestCaseSchema),
  total: z.number(),
  page: z.number(),
  perPage: z.number(),
});

export interface ApiOptions {
  baseUrl: string;
  token: string;
}

export async function fetchAllTestCases(opts: ApiOptions): Promise<TestCase[]> {
  // We ask for 200 but the controller caps at 100. Drive the loop off the
  // server-reported `total` and stop when we've collected everything (or a
  // page comes back empty, as a safety net).
  const requestedPerPage = 200;
  const all: TestCase[] = [];
  let page = 1;
  let total = Infinity;
  while (all.length < total) {
    const url = new URL(`${opts.baseUrl}/api/v1/admin/test-cases`);
    url.searchParams.set('page', String(page));
    url.searchParams.set('per_page', String(requestedPerPage));
    url.searchParams.set('lang', 'en');
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${opts.token}` },
    });
    if (!res.ok) {
      throw new Error(`GET ${url.pathname} failed: ${res.status} ${await res.text().catch(() => '')}`);
    }
    const parsed = ListResponseSchema.parse(await res.json());
    all.push(...parsed.items);
    total = parsed.total;
    if (parsed.items.length === 0) break;
    page += 1;
  }
  return all;
}
