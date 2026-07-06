## ADDED Requirements

### Requirement: Role administration is callable via REST client
The system SHALL provide typed REST functions for listing, getting, creating, updating, deleting, and replacing permissions of RBAC roles under `/api/v1/identity/roles`.

#### Scenario: List roles
- **WHEN** the frontend calls `listRbacRoles`
- **THEN** it sends `GET /api/v1/identity/roles` and returns a list of role summaries

#### Scenario: Get role
- **WHEN** the frontend calls `getRbacRole` with a role ID
- **THEN** it sends `GET /api/v1/identity/roles/{id}` and returns the role detail

#### Scenario: Create role
- **WHEN** the frontend calls `createRbacRole` with code, name, description, allowed scope types, and permission codes
- **THEN** it sends `POST /api/v1/identity/roles` and returns the created role

#### Scenario: Update role
- **WHEN** the frontend calls `updateRbacRole` with a role ID and optional name, description, and allowed scope types
- **THEN** it sends `PATCH /api/v1/identity/roles/{id}` and returns the updated role

#### Scenario: Delete role
- **WHEN** the frontend calls `deleteRbacRole` with a role ID
- **THEN** it sends `DELETE /api/v1/identity/roles/{id}` and returns an ack response

#### Scenario: Replace role permissions
- **WHEN** the frontend calls `replaceRbacRolePermissions` with a role ID and a non-empty list of permission codes
- **THEN** it sends `PUT /api/v1/identity/roles/{id}/permissions` and returns the updated role

### Requirement: Permission catalog is readable via REST client
The system SHALL provide a typed REST function for listing permissions grouped by domain under `/api/v1/identity/permissions`.

#### Scenario: List permission catalog
- **WHEN** the frontend calls `getRbacPermissionCatalog` with an optional domain filter
- **THEN** it sends `GET /api/v1/identity/permissions?domain={domain}` and returns a list of permission domain groups

### Requirement: User role grants are manageable via REST client
The system SHALL provide typed REST functions for listing, granting, and revoking role grants of a user under `/api/v1/identity/users/{userId}/roles`.

#### Scenario: List user role grants
- **WHEN** the frontend calls `listRbacUserRoleGrants` with a user ID
- **THEN** it sends `GET /api/v1/identity/users/{userId}/roles` and returns a list of role grant views

#### Scenario: Grant role to user
- **WHEN** the frontend calls `grantRbacRoleToUser` with a user ID, role code, scope type, optional scope ID, and optional expiry
- **THEN** it sends `POST /api/v1/identity/users/{userId}/roles` and returns the created grant ID

#### Scenario: Revoke user role grant
- **WHEN** the frontend calls `revokeRbacUserRoleGrant` with a user ID and grant ID
- **THEN** it sends `DELETE /api/v1/identity/users/{userId}/roles/{grantId}` and returns an ack response

### Requirement: User direct permission grants are manageable via REST client
The system SHALL provide typed REST functions for listing, granting, and revoking direct permission grants of a user under `/api/v1/identity/users/{userId}/permissions`.

#### Scenario: List user permission grants
- **WHEN** the frontend calls `listRbacUserPermissionGrants` with a user ID
- **THEN** it sends `GET /api/v1/identity/users/{userId}/permissions` and returns a list of permission grant views

#### Scenario: Grant permission to user
- **WHEN** the frontend calls `grantRbacPermissionToUser` with a user ID, permission code, scope type, optional scope ID, and optional expiry
- **THEN** it sends `POST /api/v1/identity/users/{userId}/permissions` and returns the created grant ID

#### Scenario: Revoke user permission grant
- **WHEN** the frontend calls `revokeRbacUserPermissionGrant` with a user ID and grant ID
- **THEN** it sends `DELETE /api/v1/identity/users/{userId}/permissions/{grantId}` and returns an ack response

### Requirement: Caller permissions are introspectable via REST client
The system SHALL provide typed REST functions for reading the caller's effective permissions and for batch-checking permissions under `/api/v1/identity/me/permissions` and `/api/v1/identity/permissions/check`.

#### Scenario: Get my permissions
- **WHEN** the frontend calls `getMyRbacPermissions`
- **THEN** it sends `GET /api/v1/identity/me/permissions` and returns the caller's roles and effective permissions grouped by domain

#### Scenario: Batch check permissions
- **WHEN** the frontend calls `checkMyRbacPermissions` with a list of permission checks
- **THEN** it sends `POST /api/v1/identity/permissions/check` and returns the allowed flag for each check

### Requirement: Identity-RBAC types avoid barrel collisions
The system SHALL prefix every exported TypeScript type in the identity-rbac module with `Rbac`.

#### Scenario: Type exports
- **WHEN** a developer imports from `@/modules/api/rest/identity-rbac`
- **THEN** every exported type name starts with `Rbac`

### Requirement: Identity-RBAC REST client exposes SWR hooks
The system SHALL provide SWR query hooks for read endpoints and SWR mutation hooks for write endpoints.

#### Scenario: Query hooks
- **WHEN** a component needs roles, role detail, permission catalog, user grants, or caller permissions
- **THEN** it uses the corresponding `use...Swr` hook exported from `src/hooks/swr/api/rest/queries`

#### Scenario: Mutation hooks
- **WHEN** a component creates, updates, deletes, grants, revokes, or checks RBAC data
- **THEN** it uses the corresponding `use...Mutation` hook exported from `src/hooks/swr/api/rest/mutations`
