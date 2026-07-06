## ADDED Requirements

### Requirement: Notification REST client reuses the shared REST wrapper
The notification REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

### Requirement: NotificationController non-GraphQL/non-SSE endpoints are exposed via REST
The notification REST client SHALL expose typed functions for `NotificationController` endpoints not already covered by GraphQL or SSE.

#### Scenario: Get notification preferences
- **WHEN** `getNotificationPreferences()` is called
- **THEN** it performs `GET /api/v1/notifications/preferences` and returns `Array<PreferenceCell>`

#### Scenario: Put notification preferences
- **WHEN** `putNotificationPreferences(request)` is called
- **THEN** it performs `PUT /api/v1/notifications/preferences` with `Array<PreferenceUpdate>` and returns `Array<PreferenceCell>`

#### Scenario: Get notification mutes
- **WHEN** `getNotificationMutes()` is called
- **THEN** it performs `GET /api/v1/notifications/mutes` and returns `Array<MuteView>`

#### Scenario: Create notification mute
- **WHEN** `createNotificationMute(request)` is called
- **THEN** it performs `POST /api/v1/notifications/mutes` with `MuteRequest` and returns `MuteView`

#### Scenario: Delete notification mute
- **WHEN** `deleteNotificationMute(id)` is called
- **THEN** it performs `DELETE /api/v1/notifications/mutes/{id}` and resolves with `void`

### Requirement: NotificationTemplateController endpoints are exposed via REST
The notification REST client SHALL expose typed functions for all `NotificationTemplateController` endpoints.

#### Scenario: List notification templates
- **WHEN** `listNotificationTemplates()` is called
- **THEN** it performs `GET /api/v1/admin/notification/templates` and returns `Array<TemplateView>`

#### Scenario: Create notification template
- **WHEN** `createNotificationTemplate(request)` is called
- **THEN** it performs `POST /api/v1/admin/notification/templates` with `TemplateRequest` and returns `TemplateView`

#### Scenario: Update notification template
- **WHEN** `updateNotificationTemplate(id, request)` is called
- **THEN** it performs `PUT /api/v1/admin/notification/templates/{id}` with `TemplateRequest` and returns `TemplateView`

#### Scenario: Delete notification template
- **WHEN** `deleteNotificationTemplate(id)` is called
- **THEN** it performs `DELETE /api/v1/admin/notification/templates/{id}` and resolves with `void`

### Requirement: SWR mutation wrappers exist for every writing endpoint
For every POST/PUT/DELETE notification REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use put notification preferences hook
- **WHEN** a component calls `usePostPutNotificationPreferencesSwr().trigger(request)`
- **THEN** the hook invokes `putNotificationPreferences(request)` through `useSWRMutation`

#### Scenario: Use create notification mute hook
- **WHEN** a component calls `usePostCreateNotificationMuteSwr().trigger(request)`
- **THEN** the hook invokes `createNotificationMute(request)` through `useSWRMutation`

#### Scenario: Use delete notification mute hook
- **WHEN** a component calls `usePostDeleteNotificationMuteSwr().trigger(id)`
- **THEN** the hook invokes `deleteNotificationMute(id)` through `useSWRMutation`

#### Scenario: Use create notification template hook
- **WHEN** a component calls `usePostCreateNotificationTemplateSwr().trigger(request)`
- **THEN** the hook invokes `createNotificationTemplate(request)` through `useSWRMutation`

#### Scenario: Use update notification template hook
- **WHEN** a component calls `usePostUpdateNotificationTemplateSwr().trigger({ id, request })`
- **THEN** the hook invokes `updateNotificationTemplate(id, request)` through `useSWRMutation`

#### Scenario: Use delete notification template hook
- **WHEN** a component calls `usePostDeleteNotificationTemplateSwr().trigger(id)`
- **THEN** the hook invokes `deleteNotificationTemplate(id)` through `useSWRMutation`

### Requirement: SWR query wrappers exist for read endpoints
For every GET notification REST function we expose, a corresponding `useGet*Swr` hook SHALL exist in `src/hooks/swr/api/rest/queries/`.

#### Scenario: Use get notification preferences hook
- **WHEN** a component calls `useGetNotificationPreferencesSwr()`
- **THEN** the hook invokes `getNotificationPreferences()` through `useSWR`

#### Scenario: Use get notification mutes hook
- **WHEN** a component calls `useGetNotificationMutesSwr()`
- **THEN** the hook invokes `getNotificationMutes()` through `useSWR`

#### Scenario: Use list notification templates hook
- **WHEN** a component calls `useGetNotificationTemplatesSwr()`
- **THEN** the hook invokes `listNotificationTemplates()` through `useSWR`

### Requirement: Notification module is re-exported from the REST barrel
- **WHEN** `src/modules/api/rest/index.ts` is updated
- **THEN** it adds `export * from "./notification"` alongside existing module exports

### Requirement: GraphQL/SSE-covered endpoints are documented and skipped
Endpoints already served by GraphQL operations or SSE SHALL NOT receive duplicate REST clients in this change.

#### Scenario: Skip GraphQL-covered bell list
- **WHEN** reviewing the notification surface
- **THEN** `GET /api/v1/notifications` is listed as covered by `queryMyNotifications` and omitted

#### Scenario: Skip GraphQL-covered read actions
- **WHEN** reviewing the notification surface
- **THEN** `POST /api/v1/notifications/{id}/read` and `POST /api/v1/notifications/read-all` are listed as covered by `mutateMarkNotificationAsRead` / `mutateMarkAllNotificationsAsRead` and omitted

#### Scenario: Skip SSE realtime stream
- **WHEN** reviewing the notification surface
- **THEN** `GET /api/v1/notifications/stream` is listed as an SSE realtime stream and omitted from the REST fetch layer
