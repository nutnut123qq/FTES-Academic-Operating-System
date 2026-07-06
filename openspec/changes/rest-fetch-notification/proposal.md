## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, and `gamification`. The notification domain exposes two REST controllers in `vn.ftes.aos.notification.web` — `NotificationController` for user-facing operations and `NotificationTemplateController` for admin template management — but the frontend currently has no typed REST layer for them. Several notification reads and writes (paginated bell list, unread count, mark-read, mark-all-read) are already covered by existing GraphQL operations; this change focuses on the notification REST surface that GraphQL does not serve: user preferences/mutes and admin templates.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client under `src/modules/api/rest/notification/` covering:
  - `NotificationController` — preferences and mute management (list/read/archive/stream/read-all are skipped because GraphQL already covers them or they use SSE).
  - `NotificationTemplateController` — full admin CRUD for notification templates.
- Add `usePost*Swr` mutation hooks for every writing REST endpoint we expose.
- Add `useGet*Swr` query hooks for read endpoints without GraphQL coverage.
- Update `src/modules/api/rest/index.ts` to re-export `./notification`.
- Explicitly document notification endpoints already covered by GraphQL/SSE and skip their REST clients.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-notification`: REST client + SWR wrappers for the notification controller cluster, deduplicated against existing GraphQL and SSE.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/notification/` and `src/hooks/swr/api/rest/mutations/` (plus query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
