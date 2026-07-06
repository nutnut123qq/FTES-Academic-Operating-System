## Why

The web frontend needs typed REST clients and SWR hooks for the backend Integration module (`ApiKeyController` and `ConnectionController`) so that the Integration Hub UI can manage API keys and third-party connections through the shared REST infrastructure.

## What Changes

- Add a new REST module `src/modules/api/rest/integration` with typed DTOs and call functions for:
  - `ApiKeyController` (`/api/v1/integration/api-keys`)
  - `ConnectionController` (`/api/v1/integration/connections`)
- Add SWR query hooks in `src/hooks/swr/api/rest/queries/` for read endpoints.
- Add SWR mutation hooks in `src/hooks/swr/api/rest/mutations/` for write endpoints.
- Re-export the new module from `src/modules/api/rest/index.ts`.
- Prefix all exported types with `Integration*` to avoid collisions in the top-level barrel.
- Skip endpoints already covered by GraphQL operations and document skips in `design.md`.

## Capabilities

### New Capabilities

- `integration-rest-client`: REST client + SWR hooks for API-key and connection management endpoints under `/api/v1/integration/api-keys` and `/api/v1/integration/connections`.

### Modified Capabilities

- None (this change only wires new REST consumers; it does not alter existing product requirements).

## Impact

- Affected code: `src/modules/api/rest/integration/*`, `src/modules/api/rest/index.ts`, `src/hooks/swr/api/rest/queries/*`, `src/hooks/swr/api/rest/mutations/*`.
- No new runtime dependencies; reuses `restRequest` and SWR patterns already in the repo.
- No backend changes.
