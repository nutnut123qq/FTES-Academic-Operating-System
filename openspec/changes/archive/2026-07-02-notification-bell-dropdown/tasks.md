## 1. Shared type→icon map

- [x] 1.1 Create `src/components/features/notification/typeIcon.ts` exporting `NOTIFICATION_TYPE_ICON: Record<NotificationType, Icon>` (phosphor `Icon` type; moved from `NotificationCenter`).
- [x] 1.2 Update `NotificationCenter/index.tsx` to import `NOTIFICATION_TYPE_ICON` and delete its local `TYPE_ICON`.

## 2. Rewire NotificationBell to the mock

- [x] 2.1 Rewrite `NotificationBell/index.tsx` onto `useQueryNotificationsSwr`: unread badge (hidden at 0), local mark-all-read state.
- [x] 2.2 Popover contents: header "Thông báo" + mark-all link; ~5 recent items via `ListRow` (type icon, text, `item.time`, unread dot); `Separator`; footer "Xem tất cả" link → notifications path.
- [x] 2.3 Follow HeroUI pitfalls (Button variant + icon children; Typography `className="text-accent"`).

## 3. Remove notifications from sidebar nav

- [x] 3.1 Drop the `notifications` item from the "you" group in `useAppNav.tsx` (keep activity + wallet); remove the now-unused `BellIcon` import.

## 4. i18n

- [x] 4.1 Add `notificationCenter.viewAll` to `src/messages/en.json` and `src/messages/vi.json`.

## 5. Verify

- [x] 5.1 `npm run build` (webpack) green + `npx tsc --noEmit` clean + eslint clean.
