## 1. Notification REST types

- [x] 1.1 Create `src/modules/api/rest/notification/types.ts` with request/response interfaces inferred from backend `NotificationViews.java`. Rename `PageView<T>` to `NotificationPageView<T>` to avoid collision.

## 2. Notification REST client

- [x] 2.1 Create `src/modules/api/rest/notification/notification.ts` exporting REST functions for non-GraphQL/SSE endpoints in `NotificationController` and all endpoints in `NotificationTemplateController`.
- [x] 2.2 Create `src/modules/api/rest/notification/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./notification"`.

### Endpoint mapping

**GraphQL/SSE-covered — BỎ QUA (ghi trong design.md):**
- `GET /api/v1/notifications` → `queryMyNotifications`
- `GET /api/v1/notifications/unread-count` → included in `queryMyNotifications` / SSE
- `POST /api/v1/notifications/{id}/read` → `mutateMarkNotificationAsRead`
- `POST /api/v1/notifications/read-all` → `mutateMarkAllNotificationsAsRead`
- `GET /api/v1/notifications/stream` → SSE realtime stream

**REST-only — implement in `notification.ts`: User**
- `getNotificationPreferences`, `putNotificationPreferences`, `getNotificationMutes`, `createNotificationMute`, `deleteNotificationMute`

**REST-only — implement in `notification.ts`: Admin**
- `listNotificationTemplates`, `createNotificationTemplate`, `updateNotificationTemplate`, `deleteNotificationTemplate`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostPutNotificationPreferencesSwr.ts`
- [x] 3.2 Create `usePostCreateNotificationMuteSwr.ts`
- [x] 3.3 Create `usePostDeleteNotificationMuteSwr.ts`
- [x] 3.4 Create `usePostCreateNotificationTemplateSwr.ts`
- [x] 3.5 Create `usePostUpdateNotificationTemplateSwr.ts`
- [x] 3.6 Create `usePostDeleteNotificationTemplateSwr.ts`
- [x] 3.7 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [x] 4.1 Create `useGetNotificationPreferencesSwr.ts`
- [x] 4.2 Create `useGetNotificationMutesSwr.ts`
- [x] 4.3 Create `useGetNotificationTemplatesSwr.ts`
- [x] 4.4 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 5.2 Run `npm run build` (webpack) and ensure a green build.
