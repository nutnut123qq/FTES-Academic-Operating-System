## Why

The web frontend needs typed REST clients and SWR hooks for the backend Admin module (`AdminConsoleController`, `AdminBulkController`, `AdminContentPublicController`, and `AdminAnalyticsProxyController`) so that admin console, bulk operations, public admin content, and analytics proxy features can be built on the shared REST infrastructure.

## What Changes

- Add a new REST module `src/modules/api/rest/admin` with typed DTOs and call functions for:
  - `AdminConsoleController` (`/api/v1/admin`) — banners and announcements management.
  - `AdminBulkController` (`/api/v1/admin`) — bulk user lock/unlock.
  - `AdminContentPublicController` (`/api/v1/admin-content`) — public banners and announcements.
  - `AdminAnalyticsProxyController` (`/api/v1/admin/analytics`) — analytics proxy.
- Add SWR query hooks in `src/hooks/swr/api/rest/queries/` for read endpoints.
- Add SWR mutation hooks in `src/hooks/swr/api/rest/mutations/` for write endpoints.
- Re-export the new module from `src/modules/api/rest/index.ts`.
- Prefix all exported types with `Admin*` to avoid collisions in the top-level barrel.
- Skip endpoints already covered by GraphQL operations and document skips in `design.md`.

## Capabilities

### New Capabilities

- `admin-rest-client`: REST client + SWR hooks for admin console, bulk operations, public admin content, and analytics proxy endpoints.

### Modified Capabilities

- None (this change only wires new REST consumers; it does not alter existing product requirements).

## Impact

- Affected code: `src/modules/api/rest/admin/*`, `src/modules/api/rest/index.ts`, `src/hooks/swr/api/rest/queries/*`, `src/hooks/swr/api/rest/mutations/*`.
- No new runtime dependencies; reuses `restRequest` and SWR patterns already in the repo.
- No backend changes.
