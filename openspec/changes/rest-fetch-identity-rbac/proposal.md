## Why

The web frontend needs typed REST clients and SWR hooks for the backend Identity-RBAC module (`GrantController`, `RoleController`, `PermissionCatalogController`, `MePermissionsController`) so that admin role/permission management and self-service permission introspection can be built on the shared REST infrastructure.

## What Changes

- Add a new REST module `src/modules/api/rest/identity-rbac` with typed DTOs and call functions for:
  - `RoleController` (`/api/v1/identity/roles`) — list, get, create, update, delete roles, and replace role permissions.
  - `PermissionCatalogController` (`/api/v1/identity/permissions`) — list permissions grouped by domain.
  - `GrantController` (`/api/v1/identity/users/{userId}`) — list/grant/revoke user role grants and direct permission grants.
  - `MePermissionsController` (`/api/v1/identity/me`, `/api/v1/identity/permissions/check`) — caller-effective permissions and batch permission checks.
- Add SWR query hooks in `src/hooks/swr/api/rest/queries/` for read endpoints.
- Add SWR mutation hooks in `src/hooks/swr/api/rest/mutations/` for write endpoints.
- Re-export the new module from `src/modules/api/rest/index.ts`.
- Prefix every exported type with the module name (e.g., `RbacRoleView`, `RbacGrantRequest`) to avoid collisions in the top-level barrel.
- Document GraphQL deduplication findings in `design.md`.

## Capabilities

### New Capabilities

- `identity-rbac-rest-client`: REST client + SWR hooks for identity RBAC role, permission, grant, and self-permission endpoints.

### Modified Capabilities

- None (this change only wires new REST consumers; it does not alter existing product requirements).

## Impact

- Affected code: `src/modules/api/rest/identity-rbac/*`, `src/modules/api/rest/index.ts`, `src/hooks/swr/api/rest/queries/*`, `src/hooks/swr/api/rest/mutations/*`.
- No new runtime dependencies; reuses `restRequest` and SWR patterns already in the repo.
- No backend changes.
