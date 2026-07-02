# Push Notifications (Non-Realtime) — Tasks

## 1. Shared foundations

- [x] 1.1 Re-key `src/components/features/notification/typeIcon.ts` to the real
      `NotificationType` enum (8 entries, phosphor icons); drop the import from the mock hook
- [x] 1.2 Extract the base64url global-id encoder from
      `src/components/layouts/shell/Navbar/NotificationBell/index.tsx` into a shared module
      under the notification feature; bell imports it
- [x] 1.3 Render the shared type icon on bell popover rows (no other bell behavior change)

## 2. Polling strategy (delivery mechanism)

- [x] 2.1 Update `useQueryMyNotificationsSwr` options: keep `refreshInterval: 60_000`, add
      `refreshWhenHidden: false`, `revalidateOnFocus: true` with `focusThrottleInterval`
      ~5000, `revalidateOnReconnect: true`; document polling-as-delivery in the JSDoc
- [x] 2.2 Add `useQueryMyNotificationsInfiniteSwr(unreadOnly)` (`useSWRInfinite`,
      limit/offset paging, `getKey` null when previous page short — mirror
      `useQueryUserFollowersInfiniteSwr`; no `refreshInterval`); export from hooks index

## 3. NotificationCenter rewire (real query)

- [x] 3.1 Rewrite `src/components/features/notification/NotificationCenter/index.tsx` onto
      the infinite hook: i18n title/body rendering, shared type icon, relative time, unread
      indicator, loading skeleton and empty state
- [x] 3.2 Wire all/unread filter to `unreadOnly` (server-side) with pagination reset on
      filter switch
- [x] 3.3 Infinite scroll via `InfiniteScrollSentinel` with stop-at-last-page guard
- [x] 3.4 Mark single read on row activation (optimistic + `mutateMarkNotificationAsRead`)
      and working mark-all (`mutateMarkAllNotificationsAsRead`, disabled when none unread);
      revalidate both the badge key and the infinite key
- [x] 3.5 Row click: resolve target via `queryResolveRoute` (shared encoder) and push
      locale-prefixed path; targetless rows mark-read only; rows are keyboard-activatable
      buttons with accessible names
- [x] 3.6 Delete the mock `hooks/useQueryNotificationsSwr` and any now-dead mock data/keys
      (grep importers first); update i18n `notificationCenter` keys in `messages/vi.json` +
      `messages/en.json` as needed

## 4. Notification preferences

- [x] 4.1 Add mock GraphQL pair `myNotificationPreferences` /
      `updateMyNotificationPreferences` (`{ mutedTypes, muteAll }`, standard envelope with
      nullable `data`) in the FE mock API layer + types
- [x] 4.2 Add SWR query hook + mutation hook for preferences (auth-gated)
- [x] 4.3 Build the preferences surface opened from the center header: per-type toggles
      (8 real types) + mute-all master switch (per-type disabled while mute-all on) +
      disabled "browser push — coming soon" row; a11y names, keyboard operable
- [x] 4.4 Apply the muted-type filter to bell list, center list, and badge count
      (page-window approximation per design D5); mute-all hides badge and shows the muted
      hint in both lists
- [x] 4.5 Add i18n keys `notifications.preferences.*` (labels per type, mute-all, push
      coming-soon, muted hint) in `messages/vi.json` + `messages/en.json`

## 5. Verification

- [ ] 5.1 Manual pass over spec scenarios: badge after poll, tab-hidden pause (no requests
      in devtools while hidden), focus refetch, mark read/all cross-surface, unread filter,
      preference toggle + mute-all effects, push row inert, vi/en strings, keyboard
      operation
- [ ] 5.2 `npm run build` (webpack) green
- [x] 5.3 `tsc --noEmit` clean
