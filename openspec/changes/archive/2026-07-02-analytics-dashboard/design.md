## Layout — dashboard archetype (mirrors LeaderboardShell)

The house already decided the dashboard shape in `LeaderboardShell` (title + subtitle,
metric cards `rounded-large bg-default/40 p-4`, then themed sections). Reuse it rather
than re-brainstorm:
- `mx-auto max-w-6xl p-6` column, client component; title + subtitle.
- Metric cards grid (`sm:grid-cols-2 lg:grid-cols-3`), each `rounded-large bg-default/40
  p-4`: muted label, big number (`h4`, rounded + `toLocaleString`), then a delta line
  colored `text-success` (≥0) / `text-danger` (<0) with a `TrendUp`/`TrendDown` phosphor
  icon and signed `%`.
- Category tiles grid: each a house link-card class `rounded-large border border-separator
  p-4` with a `ChartBar` icon + section label + an inner placeholder box saying
  `analytics.chartSoon` ("chart coming soon"). Charts land in a later change.

## Data
`useQueryAnalyticsSwr` — mock, SWR-shaped (`useSWR(["analytics","overview"])`). Returns
`metrics` (~6 `{ id, key, value, delta }`) + `sections` (~5 `{ id, key }` category
labels). `ponytail:` note marks the BE swap point (`analyticsOverview()`).

## A11y / formatting
- Numbers rounded + `toLocaleString`; deltas `toFixed(1)` with sign.
- Delta line carries an `aria-label` (`analytics.deltaLabel`) so the up/down icon +
  color are not the only signal; icons `aria-hidden`. Dark-mode via tokens only.

## Not doing
- No real charts yet (placeholder tiles); no date-range / filter controls; no BE.
- No nav/path wiring — reachable by URL for now (avoids editing shared chrome files);
  add a nav row when the dashboard graduates from placeholder.
