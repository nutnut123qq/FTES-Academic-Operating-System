## Why

The web frontend needs typed REST clients and SWR hooks for the backend Identity-Security module (`DeviceController`, `LoginHistoryController`, `AdminSecurityController`) so that user device management, login history, verification status, and admin security operations can be built on the shared REST infrastructure.

## What Changes

- Add a new REST module `src/modules/api/rest/identity-security` with typed DTOs and call functions for:
  - `DeviceController` (`/api/v1/identity/devices`) — list my devices, trust/untrust, revoke.
  - `LoginHistoryController` (`/api/v1/identity/login-history`, `/api/v1/identity/me/verification-status`) — my login history and verification status.
  - `AdminSecurityController` (`/api/v1/identity/admin`) — admin sessions, login history, lock/unlock, security log.
- Add SWR query hooks in `src/hooks/swr/api/rest/queries/` for read endpoints.
- Add SWR mutation hooks in `src/hooks/swr/api/rest/mutations/` for write endpoints.
- Re-export the new module from `src/modules/api/rest/index.ts`.
- Prefix every exported type with `Security*` to avoid collisions in the top-level barrel.
- Document GraphQL deduplication findings in `design.md`.

## Capabilities

### New Capabilities

- `identity-security-rest-client`: REST client + SWR hooks for identity security devices, login history, verification status, and admin security operations.

### Modified Capabilities

- None (this change only wires new REST consumers; it does not alter existing product requirements).

## Impact

- Affected code: `src/modules/api/rest/identity-security/*`, `src/modules/api/rest/index.ts`, `src/hooks/swr/api/rest/queries/*`, `src/hooks/swr/api/rest/mutations/*`.
- No new runtime dependencies; reuses `restRequest` and SWR patterns already in the repo.
- No backend changes.
