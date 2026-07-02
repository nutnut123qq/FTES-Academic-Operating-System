# Push Notifications (Non-Realtime) — Design

## Context

Current state (verified in source):

- **Bell** (`src/components/layouts/shell/Navbar/NotificationBell/index.tsx`) is REAL:
  `useQueryMyNotificationsSwr` (SWR key `["QUERY_MY_NOTIFICATIONS_SWR"]`, `limit: 20`,
  `refreshInterval: 60_000`, auth-gated) → `queryMyNotifications`; mark-single
  (`mutateMarkNotificationAsRead`) + mark-all (`mutateMarkAllNotificationsAsRead`); click
  resolves the snapshotted target through `queryResolveRoute` with a base64url global id
  (`<entityName>:<id>`), then `router.push` with locale prefix.
- **Center** (`src/components/features/notification/NotificationCenter/index.tsx`) is MOCK:
  old `useQueryNotificationsSwr` local hook, client-side filter, `onPress={() => undefined}`
  mark-all, legacy 7-type icon map in `src/components/features/notification/typeIcon.ts`.
- **Query contract** (`query-my-notifications.ts`): `myNotifications(limit, offset,
  unreadOnly)` → `{ items[], total, unreadCount }`, newest first; server clamps limit to
  [1, 100]. Pagination and the unread filter are already server-supported — the center just
  never used them.
- **Realtime**: Socket.io hooks exist but are not wired. User decision: keep it that way.
- **No service worker / push config** anywhere in `public/` or `src/app/manifest.ts`.

Constraints: FE-only repo with mock BE (per CLAUDE.md — missing BE contracts are mocked with
assumptions recorded, never invented as existing). Verify gate: `npm run build` (webpack) +
`tsc --noEmit`.

## Goals / Non-Goals

**Goals:**

- One data source: bell and center read the same real query; a mark-read in either surface
  is reflected in the other after cache mutation.
- Polling is the delivery mechanism, tuned to be cheap: 60s cadence, silent while hidden,
  instant catch-up on focus.
- Center gains real pagination (infinite scroll), a server-backed unread filter, and working
  mark actions.
- Preferences: per-type mute + mute-all, mock-persisted, filtering applied consistently to
  badge, bell list, and center list.

**Non-Goals:**

- Realtime socket delivery (explicit user decision — hooks stay unwired).
- Browser Web Push (service worker, `PushManager` subscription, permission prompt) —
  **deferred**, see Decision D6. Nothing SW-related ships in this change.
- BE implementation of preferences (mocked; contract assumption recorded below).
- Notification creation/composition — this change only consumes.

## Decisions

**D1 — Shared SWR cache key between bell and center (badge page), separate infinite hook
for the list.** The bell keeps `useQueryMyNotificationsSwr` (page 0, limit 20, carries
`unreadCount` for the badge). The center gets a new
`useQueryMyNotificationsInfiniteSwr(unreadOnly)` built on `useSWRInfinite` (`getKey` returns
null when the previous page came back shorter than the limit — house pattern, mirrored from
`useQueryUserFollowersInfiniteSwr`) with an `InfiniteScrollSentinel` block for load-more.
After any mark mutation, both caches are revalidated (`mutate()` on the bell key + the
infinite key). *Alternative considered*: one giant shared infinite cache for both — rejected
because the bell only ever needs page 0 + `unreadCount`, and coupling the badge poll to an
N-page revalidation multiplies poll cost.

**D2 — Polling profile lives in the SWR options of the badge hook, not a custom timer.**
`refreshInterval: 60_000`, `refreshWhenHidden: false` (SWR then suspends the interval while
`document.visibilityState === "hidden"` — this IS the visibility-API pause, no hand-rolled
listener), `revalidateOnFocus: true` + `focusThrottleInterval` ≈ 5s (immediate catch-up when
the user returns), `revalidateOnReconnect: true`. The center's infinite hook does NOT poll
(no `refreshInterval`); it revalidates on focus and after mutations — the badge poll is the
freshness heartbeat, the center refreshes when looked at. *Alternative*: polling both hooks —
rejected, doubles request volume for no user-visible gain.

**D3 — Center reuses the bell's exact mutation + route-resolution path.** Mark-single =
optimistic local flag + `mutateMarkNotificationAsRead` + revalidate; mark-all =
`mutateMarkAllNotificationsAsRead` + revalidate; row click = mark read then
`queryResolveRoute(base64url("<entityName>:<id>"))` → `router.push("/" + locale + path)`.
The global-id encoder moves out of the bell component into a shared module under the
notification feature so it is written once. Targetless notifications (`target: null`) mark
read but do not navigate.

**D4 — Icon map re-keyed to the real enum.** `NOTIFICATION_TYPE_ICON` becomes
`Record<NotificationType, Icon>` over the 8 real values (`system`, `challengeGraded`,
`codingGraded`, `milestoneGraded`, `newFollower`, `commentReply`, `subscriptionGranted`,
`announcement`) using phosphor icons; the legacy 7-key map and the mock hook it imports its
type from are deleted. Both bell rows and center rows render the icon (the bell today renders
no icon — adding it satisfies the existing "shared type→icon map" spec as written).

**D5 — Preferences are a client-enforced filter over an already-delivered list.**
Shape: `{ mutedTypes: NotificationType[], muteAll: boolean }`. Stored via a NEW mock
GraphQL pair `myNotificationPreferences` / `updateMyNotificationPreferences` (standard
envelope, `data` nullable), served from the FE mock layer. **BE contract assumption**
(recorded, not invented): the real BE would persist per-user rows and ideally filter
server-side; until then the FE filters `items` and derives the badge count as
`unreadCount` minus unread items of muted types *within the fetched page* — an approximation
that is documented in the spec (exact only when unread ≤ page size; acceptable for mock
phase). `muteAll` short-circuits: badge hidden, lists show an "all muted" hint row.
*Alternative*: localStorage-only — rejected: no mock-API seam to swap for the real BE later.

**D6 — Web Push DEFERRED (explicit).** Reasons: (a) FE-only repo — a push needs a real BE
holding `PushSubscription`s and sending VAPID-signed messages; a mock cannot deliver
anything to a closed tab, so shipping the permission prompt now would ask users for a
permission that does nothing (dark-pattern smell, and permission prompts are one-shot UX
capital). (b) The user's stated need — "redo notifications, realtime not needed" — is fully
served by polling + preferences. What ships instead: a disabled "Browser push — coming soon"
row in the preferences surface reserving the slot. **Deferred-work contract, recorded for
the future change**: FE registers `public/sw.js`, `pushManager.subscribe({ userVisibleOnly:
true, applicationServerKey: <VAPID public key from BE> })`, sends the subscription to a
`registerPushSubscription` mutation; permission flow = explicit toggle → browser prompt →
on `denied` show non-blocking guidance and keep the toggle off.

**D7 — Preferences surface = a section on the `/notifications` page** (header gear button
opening the section/sheet), not a new route: keeps this change self-contained, avoids
touching the settings information architecture, and the page is already the canonical
notification home. i18n keys under `notifications.preferences.*` in vi + en.

## Risks / Trade-offs

- [Badge approximation under muted types (D5)] → documented in spec; exact once BE filters
  server-side; page size 20 covers the practical unread window.
- [Two caches (badge + infinite) can briefly disagree after a mutation] → both are
  revalidated in the same handler; optimistic row flag hides the gap.
- [Polling misses events between polls by design] → accepted (user decision: non-realtime);
  focus revalidation catches the common "come back to the tab" case.
- [Deleting the mock hook breaks any other importer] → grep for `useQueryNotificationsSwr`
  importers before removal; only the center and typeIcon reference it today.
- [Old spec scenarios reference the mock] → handled via delta REMOVED/ADDED on
  `notification-bell` so the archived spec stays truthful.

## Migration Plan

1. Land shared icon map + shared global-id encoder (no behavior change).
2. Add infinite hook + rewire center (mock hook still present but unused).
3. Delete mock hook + legacy map; update polling options on the badge hook.
4. Add preferences mock API + surface + filtering.
5. Verify: `npm run build` (webpack) green + `tsc --noEmit` clean; manual pass over
   scenarios. Rollback = revert the single change commit (1 OpenSpec change = 1 commit).

## Open Questions

- None blocking. (Web Push BE contract intentionally parked in D6 for a future change.)
