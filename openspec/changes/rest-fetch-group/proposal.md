## Why

The web frontend needs typed REST clients and SWR hooks for the backend Group module (`GroupController` and `InvitationController`) so that group discovery, membership, content, and invitation features can be built on the shared REST infrastructure.

## What Changes

- Add a new REST module `src/modules/api/rest/group` with typed DTOs and call functions for:
  - `GroupController` (`/api/v1/groups`)
  - `InvitationController` (`/api/v1/invitations`)
- Add SWR query hooks in `src/hooks/swr/api/rest/queries/` for read endpoints.
- Add SWR mutation hooks in `src/hooks/swr/api/rest/mutations/` for write endpoints.
- Re-export the new module from `src/modules/api/rest/index.ts`.
- Prefix all exported types with `Group*` to avoid barrel collisions.
- Skip endpoints already covered by GraphQL operations and document skips in `design.md`.

## Capabilities

### New Capabilities

- `group-rest-client`: REST client + SWR hooks for group and invitation endpoints under `/api/v1/groups` and `/api/v1/invitations`.

### Modified Capabilities

- None (this change only wires new REST consumers; it does not alter existing product requirements).

## Impact

- Affected code: `src/modules/api/rest/group/*`, `src/modules/api/rest/index.ts`, `src/hooks/swr/api/rest/queries/*`, `src/hooks/swr/api/rest/mutations/*`.
- No new runtime dependencies; reuses `restRequest` and SWR patterns already in the repo.
- No backend changes.
