# trave_pilot_e2e

End-to-end Maestro suite for the Travel Pilot mobile apps (iOS + Android).

One YAML flow per test case `code` (e.g. `SMK-01.yaml`, `AUTH-L-04.yaml`),
mirroring the test case corpus seeded by the API at
`prisma/rewrite-test-cases.ts` and surfaced through the admin dashboard at
`/api/v1/admin/app-versions/:id/matrix`.

## Layout

```
flows/
  common/           reusable building blocks (login, reset, open app)
  smk/              §0 Smoke
  auth/             §1.1–1.5 Welcome / Login / Register / Recovery / Social
  wizard/           §2 Plan Wizard
  generation/       §3 AI Plan Generation
  home/             §4 Home Dashboard
  plans/            §5 Travel Plans
  itinerary/        §6 Itinerary
  edit/             §7 Edit (Premium)
  reorder/          §8 Reorder Days (Premium)
  sharing/          §9 Sharing
  photos/           §10 Photos
  tickets/          §11 Tickets
  feed/             §12 Feed
  premium/          §13 Subscription
  map/              §14 Travel Map
  profile/          §15 Profile
  settings/         §16 Settings
  notifications/    §17 Notifications
  network/          §18 Network/Offline
  security/         §19 Auth Hardening
  perf/             §20 Performance
  a11y/             §21 Localization/Accessibility
  _archived/        flows whose underlying test case has been archived
```

One `flows/<section>/<CODE>.yaml` per test case. Filename = test case code so
the mapping to the dashboard is 1:1.

## Install

```bash
curl -fsSL "https://get.maestro.mobile.dev" | bash
brew install openjdk@17                              # JDK 11+
brew tap facebook/fb && brew install idb-companion   # iOS only
pip3 install fb-idb                                  # iOS only
maestro --version
npm ci
cp config/.env.example .env && $EDITOR .env
```

## Run a flow

```bash
# Boot a device, install the debug build, then:
maestro test --env APP_ID=com.travelpilotapp flows/smk/SMK-01.yaml

# Whole section:
maestro test --env APP_ID=com.travelpilotapp flows/smk/

# Whole suite, with JUnit + screenshots/video:
maestro test \
  --env APP_ID=com.travelpilotapp \
  --format junit --output report.xml \
  --debug-output debug \
  --exclude-tags=needs-implementation,archived \
  flows/
```

## Scripts

```bash
# Idempotent: pull test cases from API, write/update/archive YAML stubs.
# Used by the sync-test-cases workflow (auto-runs on dashboard mutations).
npm run sync

# Diff: which dashboard codes lack a YAML file?
npm run missing

# After a maestro run: parse JUnit + push results to /admin/.../test-runs.
npm run report -- --platform=android --junit=report.xml
```

Required env (see `config/.env.example`): `API_BASE_URL`, `ADMIN_TOKEN`,
plus `APP_VERSION` + `APP_BUILD` when running the reporter.

## Selector contract

Maestro matches by visible text or accessibility id. We rely on **stable a11y
ids** so flows survive copy changes and pt-BR localization. Canonical id list:
[`docs/selectors.md`](docs/selectors.md). When a flow needs a missing id, add
it there and open a PR in the relevant mobile repo to add the id before the
flow can be merged.
