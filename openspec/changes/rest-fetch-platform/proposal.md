## Why

The web frontend needs typed REST clients and SWR hooks for the backend Platform enterprise-infrastructure controllers (`PlatformInfraController` and `PlatformOpsController`) so that admin/ops pages can manage files, feature flags, configurations, AI providers, audit logs, and scheduled jobs through the shared REST infrastructure.

## What Changes

- Add a new REST module `src/modules/api/rest/platform` with typed DTOs and call functions for:
  - `PlatformInfraController` (`/api/v1/platform`) — files, feature flags, configurations.
  - `PlatformOpsController` (`/api/v1/platform`) — AI providers, audit logs, scheduled jobs.
- Add SWR query hooks in `src/hooks/swr/api/rest/queries/` for read endpoints.
- Add SWR mutation hooks in `src/hooks/swr/api/rest/mutations/` for write endpoints.
- Re-export the new module from `src/modules/api/rest/index.ts`.
- Prefix all exported types with `Platform*` to avoid collisions in the top-level barrel.
- Skip endpoints already covered by GraphQL operations and document skips in `design.md`.
- Explicitly exclude `platform/graphql/resolver/*` from this REST change; those are GraphQL resolvers and remain consumed through GraphQL.

## Capabilities

### New Capabilities

- `platform-rest-client`: REST client + SWR hooks for platform infra/ops endpoints under `/api/v1/platform`.

### Modified Capabilities

- None (this change only wires new REST consumers; it does not alter existing product requirements).

## Impact

- Affected code: `src/modules/api/rest/platform/*`, `src/modules/api/rest/index.ts`, `src/hooks/swr/api/rest/queries/*`, `src/hooks/swr/api/rest/mutations/*`.
- No new runtime dependencies; reuses `restRequest` and SWR patterns already in the repo.
- No backend changes.
