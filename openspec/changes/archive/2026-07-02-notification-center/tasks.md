## 1. Notification center
- [x] 1.1 `useQueryNotificationsSwr` — mock feed (~8 typed items, SWR-shaped)
- [x] 1.2 `features/notification/NotificationCenter` — header + all/unread filter + rows + empty state
- [x] 1.3 `[locale]/notifications/page.tsx` renders NotificationCenter

## 2. Wiring
- [x] 2.1 i18n `notificationCenter.*` (vi/en) — title/subtitle/filters/markAllRead/empty + types.*

## 3. Verify
- [ ] 3.1 eslint clean + JSON valid (build/tsc deferred per task scope)
