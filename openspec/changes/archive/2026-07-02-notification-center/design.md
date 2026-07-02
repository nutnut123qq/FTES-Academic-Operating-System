## Layout — list archetype (mirrors SubjectCatalog)

The house already decided the list shape (header + filter buttons + rows). Reuse
it rather than re-brainstorm a standard feed:
- `mx-auto max-w-3xl p-6` column; bell icon + title + subtitle; a right-aligned
  "mark all read" ghost Button (disabled when nothing is unread).
- Filter buttons `all` + `unread`, `secondary` when active else `ghost`
  (`useState<"all" | "unread">`).
- Rows = house link-card class `rounded-large border border-separator p-4`; unread
  rows tinted `bg-default/40`. Leading slot = accent circle `bg-accent/10 text-accent`
  with a per-type Phosphor icon; body = text + (type label · relative time); trailing
  = a `size-2 rounded-full bg-accent` dot on unread rows (with `aria-label`).
- Empty state when the filter matches nothing (`notificationCenter.empty`).

## Data
`useQueryNotificationsSwr` — mock feed of ~8 `{ id, type, text, time, read }`,
SWR-shaped so the swap to a real `notifications()` query is drop-in. `type` ∈
`mention | course | event | deadline | challenge | coin | group` and drives both
the row icon and the `notificationCenter.types.*` label. `ponytail:` note marks
the BE swap point.

## Not doing
- No real "mark all read" mutation (mock no-op) — wire when the BE endpoint lands.
- No per-notification navigation / deep links (mock text only).
- No nav/path/bell-badge wiring into the chrome (shared files) — deferred to keep
  this change inside the notification domain.
