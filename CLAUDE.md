# trave_pilot_e2e — Claude playbook

End-to-end Maestro suite for the Travel Pilot mobile apps.

## Sister repos

- API: `/Users/andrefpc/Code/NodeJs/trave_pilot_api` — owns the test case
  catalog (`prisma/rewrite-test-cases.ts`) and the dashboard at
  `https://api.travelpilotapp.com/admin`.
- Android: separate repo (mobile team owns).
- iOS: separate repo (mobile team owns).

## When the user says "run the tests"

Single entrypoint:

```bash
cd /Users/andrefpc/Code/NodeJs/trave_pilot_e2e
npm run e2e                       # all flows on every booted device
npm run e2e -- --section=smk      # just §0 Smoke
npm run e2e -- --platform=android # ignore iOS even if booted
npm run e2e -- --dry-run          # plan only, no maestro invocation
```

The orchestrator in `scripts/run-e2e.ts`:

1. Mints an admin JWT via `POST /api/v1/admin/login` (see
   `scripts/lib/credentials.ts` for credential resolution order).
2. Detects every connected Android device + booted iOS simulator
   (`scripts/lib/devices.ts`).
3. Runs `maestro test` per platform, excluding `needs-implementation`
   and `archived` tags.
4. Pipes the JUnit report into `report-results.ts`, which PUTs each
   pass/fail back to `/api/v1/admin/app-versions/:id/test-runs`.
5. Prints a per-target summary and exits non-zero on any failure.

## Credentials (admin password)

`scripts/lib/credentials.ts` looks for `ADMIN_PASSWORD` in this order:

1. `ADMIN_PASSWORD=...` env var (one-shot).
2. `~/.config/trave-pilot-e2e/.env` (file lives outside the repo).
3. macOS keychain entry `travel-pilot-admin`.

Do **not** persist the password without explicit user confirmation. If
none is set, surface the three setup options and stop.

`ADMIN_EMAIL` defaults to `admin@travelpilot.com` (matches Railway prod).

## Authoring a flow

Each `.yaml` under `flows/<section>/<CODE>.yaml` corresponds 1:1 with a
test case `code` in the dashboard. The `# >>> dashboard-meta` block at
the top is **auto-managed** by `npm run sync` — never hand-edit between
those sentinels (your edits will be overwritten on the next dashboard
mutation). Hand-author everything below.

When a flow needs a new accessibility id, add it to `docs/selectors.md`
and produce a Mobile Repo Prompt for the iOS + Android teams to add it
to their app code. The flow stays in `needs-implementation` until the
ids ship.

To remove the `needs-implementation` tag, edit the `tags:` line in the
YAML — the auto-sync script preserves everything outside the sentinel
block, so manual tag changes survive.

## Dashboard interaction

- **Sync stubs**: `ADMIN_TOKEN=$(... login ...) API_BASE_URL=... npm run sync`
- **List missing flows**: `npm run missing`
- **Push results manually** (CI does this automatically):
  `npm run report -- --platform=android --junit=results/android/report.xml --register`

## What's NOT here

- Mobile build artifacts. Either install the app yourself before running
  (`adb install ...` / `xcrun simctl install ...`) or wire up a
  download step. The orchestrator surfaces a clear warning if the app
  isn't installed on a discovered device.
- The `e2e-bot` admin user. Not yet created — the playbook currently
  reuses the existing `admin@travelpilot.com`. Swap to `e2e-bot` once it
  exists by setting `ADMIN_EMAIL` in `~/.config/trave-pilot-e2e/.env`.
- A staging Railway environment. CI today targets prod; a `staging` env
  is on the roadmap.
