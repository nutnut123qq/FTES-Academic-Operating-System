# Push Notifications (Non-Realtime) — Proposal

## Why

The notification stack is split-brain: the navbar bell is already wired to the real GraphQL
API (`queryMyNotifications` + mark-read mutations, 60s SWR polling), but the `/notifications`
center still renders the old FE mock hook with a no-op "mark all read" — the two surfaces can
show divergent content, and the center cannot actually mark anything read. The user has
explicitly decided realtime is NOT needed ("không cần realtime"), so polling must be promoted
from a stopgap to the documented delivery mechanism, and the dormant Socket.io hooks stay
unwired. There is also no way for a user to control which notifications they receive.

## What Changes

- **Rewire `NotificationCenter`** (`/notifications`) to the SAME real GraphQL query and
  mutations the bell uses: paginated list (infinite scroll via `limit`/`offset`), all/unread
  filter backed by `unreadOnly`, working mark-single-read + mark-all-read, per-type icon,
  and click-through route resolution (`queryResolveRoute`) — replacing the mock
  `useQueryNotificationsSwr` hook and fake actions.
- **Re-key the shared type→icon map** from the 7 legacy mock types (`mention`, `course`, …)
  to the real `NotificationType` enum (8 values: `system`, `challengeGraded`, `codingGraded`,
  `milestoneGraded`, `newFollower`, `commentReply`, `subscriptionGranted`, `announcement`).
- **Codify polling as THE delivery mechanism** (no socket): 60s badge refresh, polling paused
  while the tab is hidden (visibility-aware), immediate refetch when the tab regains focus.
  Bell and center share one SWR cache key so a poll updates both.
- **Notification preferences**: a new preferences surface with per-type toggles (one per
  `NotificationType`) and a "mute all" master switch, persisted via a mock mutation
  (FE-only; BE contract assumption documented). Muted types are hidden from bell + center
  and excluded from the unread badge.
- **Browser Web Push — explicitly DEFERRED.** No service worker, no push subscription, no
  permission prompt ships in this change. This repo is FE-only against a mock BE; a real
  Web Push pipeline needs a BE that stores subscriptions and sends pushes (VAPID). The
  preferences surface reserves an opt-in row for it (rendered disabled with a "coming soon"
  note) so the UX slot exists. The deferred capability and its BE contract assumptions are
  recorded in `design.md`.
- Socket.io notification hooks remain unwired (intentional — realtime out of scope).

## Capabilities

### New Capabilities

- `notification-center`: the `/notifications` page backed by the real notification query —
  pagination/infinite scroll, all/unread filter, mark single + mark all read, per-type icon,
  route resolution on click, i18n vi/en, a11y.
- `notification-polling`: polling as the sole delivery mechanism — shared SWR key, 60s
  interval, pause when tab hidden, immediate refetch on focus/reconnect.
- `notification-preferences`: per-type toggles + mute-all stored via mock mutation, applied
  as a client-side filter on bell/center/badge; reserved (disabled) browser-push opt-in row.

### Modified Capabilities

- `notification-bell`: the "backed by the shared notification mock" requirement is replaced —
  the shared source is now the real `myNotifications` query (one SWR key with the center);
  the "Shared type→icon map" requirement changes to be keyed by the real `NotificationType`
  enum and rendered by both bell and center.

## Impact

- `src/components/features/notification/NotificationCenter/` — rewritten onto real hooks.
- `src/components/features/notification/typeIcon.ts` — re-keyed to `NotificationType`;
  `src/components/features/notification/hooks/useQueryNotificationsSwr` (mock) retired.
- `src/hooks/swr/api/graphql/queries/useQueryMyNotificationsSwr.ts` — polling options
  (visibility pause / focus revalidate) + shared-key strategy; new infinite variant for the
  center page.
- `src/components/layouts/shell/Navbar/NotificationBell/index.tsx` — consumes the shared
  icon map; no behavior regression.
- New mock mutation + SWR hook + UI for notification preferences; new i18n keys in
  `messages/vi.json` + `messages/en.json`.
- No `public/` service worker, no manifest push config (web push deferred).
- No breaking changes to routes; `/notifications` URL unchanged.
