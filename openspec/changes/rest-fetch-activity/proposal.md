## Why

The web frontend needs typed REST clients and SWR hooks for the backend Activity module (`ActivityController`) so that activity timeline, type catalog, privacy settings, and replay features can be built on the shared REST infrastructure.

## What Changes

- Add a new REST module `src/modules/api/rest/activity` with typed DTOs and call functions for `ActivityController` (`/api/v1/activities`).
- Add SWR query hooks in `src/hooks/swr/api/rest/queries/` for read endpoints.
- Add SWR mutation hooks in `src/hooks/swr/api/rest/mutations/` for write endpoints (`privacy-settings` and `replay`).
- Re-export the new module from `src/modules/api/rest/index.ts`.
- Prefix all exported types with `Activity*` to avoid collisions in the top-level barrel.
- Skip endpoints already covered by GraphQL operations and document skips in `design.md`.

## Capabilities

### New Capabilities

- `activity-rest-client`: REST client + SWR hooks for activity timeline, single activity, type catalog, privacy settings, and replay endpoints under `/api/v1/activities`.

### Modified Capabilities

- None (this change only wires new REST consumers; it does not alter existing product requirements).

## Impact

- Affected code: `src/modules/api/rest/activity/*`, `src/modules/api/rest/index.ts`, `src/hooks/swr/api/rest/queries/*`, `src/hooks/swr/api/rest/mutations/*`.
- No new runtime dependencies; reuses `restRequest` and SWR patterns already in the repo.
- No backend changes.
