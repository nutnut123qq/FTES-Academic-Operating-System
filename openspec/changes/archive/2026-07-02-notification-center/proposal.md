## Why

`/notifications` was 404 — the app produces notification-worthy events (mentions,
deadlines, new lessons, challenge completions, coin rewards, group posts, events)
across §3/§15 but there was no place to see them. This ships the notification
center (§15), turning `/notifications` into a real 200 route so the chrome's bell
has a destination.

## What Changes

- Add `features/notification/NotificationCenter` + `[locale]/notifications/page.tsx`:
  header + all/unread filter + a list of notification rows (type icon, text,
  relative time, unread accent) + a mock "mark all read" action + empty state.
  Mirrors the house catalog/list archetype (`SubjectCatalog`).
- Add `useQueryNotificationsSwr` (mock feed of ~8 typed items, SWR-shaped).
- Add `notificationCenter.*` i18n (vi/en).

## Capabilities

### New Capabilities
- `notification-center`: the notification feed at `/notifications`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/notification/NotificationCenter`, `notifications/page.tsx`,
  `useQueryNotificationsSwr`; new `notificationCenter.*` i18n. No BE (mock).
  No shared-file edits (nav/path wiring deferred).
