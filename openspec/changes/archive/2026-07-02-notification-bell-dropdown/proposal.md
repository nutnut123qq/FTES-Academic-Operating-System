## Why

Notifications are surfaced in two disconnected places: a sidebar nav row leading to the
`/notifications` page, and a navbar bell popover that is wired to a different (GraphQL-shaped)
mock than the page. In an FE-only mock build this means the bell and the full page show
different content, and notifications occupy a primary sidebar slot better reserved for
domain navigation. Consolidating on the bell (the pattern every app uses) with a single mock
source fixes both.

## What Changes

- Rewire the navbar `NotificationBell` popover to the same FE mock hook the `/notifications`
  page uses (`useQueryNotificationsSwr`), so the bell and the full page always agree.
- Bell popover contents: unread-count badge on the bell; header "Thông báo" + a
  "mark all read" link; the ~5 most-recent notifications (type icon + text + relative time +
  unread dot); a footer "Xem tất cả" link to `/notifications`.
- Extract the notification type→icon map into a shared module reused by both the bell and the
  `NotificationCenter` page (no duplication).
- **BREAKING (nav)**: remove the "Notifications" row from the sidebar's "you" group. The group
  keeps Activity + Wallet. The `notifications` path builder and the `/notifications` page are
  unchanged — the bell footer still routes there.
- i18n: reuse the existing `notificationCenter.*` keys and add `notificationCenter.viewAll`
  to `en.json` and `vi.json`.

## Capabilities

### New Capabilities
- `notification-bell`: the navbar bell — unread badge, recent-items popover backed by the
  shared FE notification mock, mark-all-read affordance, and a link to the full center.

### Modified Capabilities
<!-- No existing spec captures the sidebar nav or the /notifications page; those stay as-is. -->

## Impact

- `src/components/features/navbar/Navbar/NotificationBell/index.tsx` — rewritten onto the mock hook.
- `src/components/features/notification/` — new shared type→icon module; `NotificationCenter`
  imports it instead of its local copy.
- `src/components/features/app-shell/useAppNav.tsx` — drop the `notifications` item from the "you" group.
- `src/messages/en.json`, `src/messages/vi.json` — add `notificationCenter.viewAll`.
- Unchanged: `src/resources/path/index.ts` (`notifications` builder) and the `/notifications` route.
