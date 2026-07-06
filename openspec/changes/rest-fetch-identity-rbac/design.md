## Context

The frontend already consumes several backend modules through typed REST clients in `src/modules/api/rest/*`. The Identity-RBAC module exposes four REST controllers in `vn.ftes.aos.identity.rbac.web`:

- `RoleController` — role administration under `/api/v1/identity/roles`.
- `PermissionCatalogController` — permission catalog under `/api/v1/identity/permissions`.
- `GrantController` — user role/permission grants under `/api/v1/identity/users/{userId}`.
- `MePermissionsController` — self-service effective permissions and batch checks under `/api/v1/identity`.

This change adds the corresponding frontend REST module and SWR hooks, following the same patterns already established by `rest-fetch-admin`, `rest-fetch-platform`, etc.

## Goals / Non-Goals

**Goals:**
- Provide a typed REST client (`src/modules/api/rest/identity-rbac`) covering the four RBAC controllers listed above.
- Provide SWR query hooks for all read endpoints and SWR mutation hooks for all write endpoints.
- Prefix every exported type with `Rbac*` to avoid collisions in the top-level barrel export.
- Verify TypeScript and webpack build remain green.

**Non-Goals:**
- No Identity-Security controllers (`vn.ftes.aos.identity.security.web`) — those are reserved for a later change.
- No Identity-Auth controllers — already implemented elsewhere.
- No product UI pages or forms.
- No backend changes.
- No new runtime dependencies.

## Decisions

1. **Module name `identity-rbac`.**
   - The directory is named `identity-rbac` to avoid ambiguity with the existing `identity` module that already exists under `src/modules/api/rest/identity`. The exported type prefix is `Rbac*` to keep names short and collision-free in the barrel.

2. **Function naming mirrors backend capability.**
   - `listRbacRoles`, `getRbacRole`, `createRbacRole`, `updateRbacRole`, `deleteRbacRole`, `replaceRbacRolePermissions`.
   - `getRbacPermissionCatalog`.
   - `listRbacUserRoleGrants`, `grantRbacRoleToUser`, `revokeRbacUserRoleGrant`, `listRbacUserPermissionGrants`, `grantRbacPermissionToUser`, `revokeRbacUserPermissionGrant`.
   - `getMyRbacPermissions`, `checkMyRbacPermissions`.

3. **String IDs for path parameters.**
   - Backend uses `UUID` path variables. The REST client accepts `string` parameters, consistent with other modules, and interpolates them directly into URLs.

4. **Batch check request typed as an array of checks.**
   - `RbacCheckRequest` contains `checks: RbacCheckItem[]`; `RbacCheckResponse` contains `results: RbacCheckResult[]`.

5. **GraphQL deduplication.**
   - Searched `src/modules/api/graphql` for `role`, `permission`, `grant`, `rbac`, `mePermissions`, `myPermissions`. No overlapping RBAC operations were found, so no REST endpoints are skipped for GraphQL overlap.

6. **SWR keys use tuple arrays.**
   - Query keys follow existing patterns, e.g. `["rbac", "roles"]`, `["rbac", "role", id]`, `["rbac", "permissions", domain]`, `["rbac", "users", userId, "roles"]`, `["rbac", "me", "permissions"]`.

## Risks / Trade-offs

- [Risk] `MessageResponseStub` returns `{ status: "ok" }`; consumers may ignore it. → Mitigation: type it as `RbacMessageResponseStub` and let callers treat it as an ack.
- [Risk] `GrantController` endpoints require `grant.*` permissions; admin callers must have them. → Mitigation: this is a backend enforcement concern; hooks simply expose the typed calls.
- [Risk] `allowedScopeTypes` and `permissionCodes` are typed as string arrays; any invalid values will be rejected by backend validation. → Mitigation: keep types as `string[]` to match contracts.

## Migration Plan

No migration needed. This is a new additive module.

## Open Questions

None.
