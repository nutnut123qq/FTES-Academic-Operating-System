## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, and `gamification`. The backend notification domain in `vn.ftes.aos.notification.web` exposes two REST controllers:

- `NotificationController` — `/api/v1/notifications/**` (user-scoped reads and writes).
- `NotificationTemplateController` — `/api/v1/admin/notification/templates/**` (admin template CRUD).

The frontend already has GraphQL operations that overlap with the main bell flow: `myNotifications` (list + unread count), `markNotificationAsRead`, and `markAllNotificationsAsRead`. Those GraphQL operations are the preferred data layer for the bell list and read actions, so the corresponding REST reads/writes are skipped. The realtime `/notifications/stream` endpoint is an SSE connection, not a request/response REST call, so it is also excluded from this REST-fetch layer.

The remaining notification REST surface — user preferences, user mutes, and admin templates — has no GraphQL equivalent and gets typed REST clients.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/notification/` for notification endpoints not covered by GraphQL/SSE.
- Add SWR mutation wrappers for every writing REST endpoint we expose.
- Add SWR query wrappers for read endpoints we expose.
- Update `src/modules/api/rest/index.ts` to re-export `./notification`.
- Document skipped endpoints and the GraphQL/SSE operations that cover them.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add REST clients for bell list/read actions already covered by GraphQL.
- Do not add an SSE client wrapper for `/notifications/stream`.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping. Notification needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/notification/`
**Rationale:** Mirrors the backend package `notification.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Skip GraphQL/SSE-covered user endpoints
**Rationale:** Avoid duplicate data layers and conflicting cache semantics. Skipped:
- `GET /api/v1/notifications` → `queryMyNotifications` GraphQL
- `GET /api/v1/notifications/unread-count` → included in `queryMyNotifications` and SSE
- `POST /api/v1/notifications/{id}/read` → `mutateMarkNotificationAsRead` GraphQL
- `POST /api/v1/notifications/read-all` → `mutateMarkAllNotificationsAsRead` GraphQL
- `GET /api/v1/notifications/stream` → SSE realtime stream (not a REST fetch)

### 4. Expose notification preferences and mutes via REST
**Rationale:** No GraphQL operations exist for the per-channel preference matrix or per-scope mutes. These endpoints are implemented.

### 5. Expose all admin template endpoints via REST
**Rationale:** No GraphQL operations exist for admin notification template CRUD. All template endpoints are implemented.

### 6. Read endpoints get SWR query hooks
**Rationale:** `getNotificationPreferences`, `getNotificationMutes`, `listNotificationTemplates`, and `listNotificationTemplateItems` are reads with no GraphQL equivalent. They get `useGet*Swr` query hooks.

### 7. Types inferred from `NotificationViews.java`
**Rationale:** These records are the backend source of truth. We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps. `PageView<T>` is renamed to `NotificationPageView<T>` to avoid a collision with the existing `PageView<T>` from the commerce module.

## Risks / Trade-offs

- **[Risk]** Skipping the REST notification list assumes `queryMyNotifications` returns equivalent data. The REST `NotificationView` shape is richer (deepLink, refType, refId, groupCount, status) and uses a different pagination model. If a feature needs the REST view specifically, the list endpoint may need to be added later.
- **[Risk]** Skipping `GET /notifications/stream` means components needing realtime updates must still implement SSE separately; this change only covers request/response REST.
- **[Trade-off]** Admin template endpoints share the same response shape for create/update. The REST client exposes separate functions for clarity and to match the backend controller exactly.

## Affected Files / Modules

- `src/modules/api/rest/notification/types.ts`
- `src/modules/api/rest/notification/notification.ts`
- `src/modules/api/rest/notification/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
