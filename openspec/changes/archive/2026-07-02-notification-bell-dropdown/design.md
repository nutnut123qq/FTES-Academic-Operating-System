## Context

`NotificationBell` is already a HeroUI `Popover` but is wired to a GraphQL-shaped mock
(`useQueryMyNotificationsSwr` + `query-my-notifications` + resolve-route/mark mutations, StarCi
skeleton residue), while the `/notifications` page (`NotificationCenter`) uses the FE mock
`useQueryNotificationsSwr` (`NotificationItem[]`). Two mock sources → divergent content.
The navbar composes the bell next to `AccountMenuDropdown`, whose popover is the house pattern.

## Goals / Non-Goals

**Goals:**
- Bell reads the same mock as the center; identical content.
- Popover: unread badge, "Thông báo" header + mark-all link, ~5 recent items, "Xem tất cả" footer → `/notifications`.
- One shared type→icon map used by bell and center.
- Remove notifications from the sidebar "you" group; keep the path builder + page.

**Non-Goals:**
- No real mark-read persistence (FE-only mock; local visual clear only, matching the center's no-op).
- No change to the `/notifications` page layout or the `notifications` path builder.
- No removal of the GraphQL notification query/hook files (out of scope; leave for a later cleanup).

## Decisions

- **Data source**: `useQueryNotificationsSwr()` → `{ notifications: NotificationItem[] }`. Unread =
  `notifications.filter(n => !n.read)`. Recent = `notifications.slice(0, 5)`.
- **Mark all read**: local `useState` flag (no mutation endpoint). When set, badge → 0 and dots hidden.
  Mirrors the center's visual-only affordance; a few lines, gives real feedback.
- **Type→icon map**: new `src/components/features/notification/typeIcon.ts` exporting
  `NOTIFICATION_TYPE_ICON: Record<NotificationType, ComponentType<{className?}>>`. `NotificationCenter`
  drops its local `TYPE_ICON` and imports the shared one; the bell imports it too.
- **Popover markup**: mirror `AccountMenuDropdown` — `Button` trigger (`isIconOnly`, `variant="tertiary"`,
  bell + `Badge`), `PopoverContent placement="bottom right" w-[360px]`. Header row (Header + ghost/link
  Button for mark-all), item list via existing `ListRow` block (icon leading, text title, time meta,
  unread `CircleIcon` dot), `Separator`, footer link Button → `router.push` to the notifications path.
- **i18n**: reuse `notificationCenter.{title,markAllRead,empty,types.*}`; add `notificationCenter.viewAll`
  ("Xem tất cả" / "View all") to `en.json` + `vi.json`. Time uses `item.time` (mock relative string).
- **HeroUI pitfalls**: Button uses `variant` + icon-as-children (no `startContent`/`color`); Typography
  colouring via `className="text-accent"` / `color="muted"` only.

## Risks / Trade-offs

- Rewriting a working GraphQL-wired popover to a simpler mock drops resolve-route click-through; acceptable
  because the FE-only mandate + task pick the mock, and the center itself is a no-op mock.
- The GraphQL notification query/hook become unreferenced by the bell but are left in place (harmless dead
  code) to keep this change one commit and reversible; flag for a later audit.
- "you" group drops to 2 items (Activity + Wallet) — still a valid multi-item group, no 1-item group.
