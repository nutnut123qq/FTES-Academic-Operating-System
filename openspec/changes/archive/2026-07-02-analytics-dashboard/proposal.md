## Why

`/analytics` was 404 — the platform (§20 Analytics) had no operator-facing view of
its headline health metrics (learners, lessons completed, active groups, resources
shared, average completion, coins circulating). This ships the metrics dashboard,
turning `/analytics` into a real 200 route and giving the analytics domain a home
for its per-category charts.

## What Changes

- Add `features/analytics/AnalyticsDashboard` + `[locale]/analytics/page.tsx`: a grid
  of headline metric cards (label + big number + colored delta) over a row of
  category tiles (placeholder charts per domain). Mirrors the house dashboard
  archetype (`LeaderboardShell`).
- Add `useQueryAnalyticsSwr` (mock `metrics` + `sections`, SWR-shaped).
- Add `analytics.*` i18n (vi/en): title/subtitle, six metric labels, five section
  labels, `chartSoon`, `deltaLabel`.

## Capabilities

### New Capabilities
- `analytics-dashboard`: the analytics metrics dashboard at `/analytics`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/analytics/AnalyticsDashboard`, `analytics/page.tsx`,
  `useQueryAnalyticsSwr`; i18n `analytics.*`. No BE (mock). No shared-file edits
  (nav/path wiring deferred).
