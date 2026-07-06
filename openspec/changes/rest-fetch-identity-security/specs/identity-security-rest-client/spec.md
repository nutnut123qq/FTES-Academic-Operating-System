## ADDED Requirements

### Requirement: Current-user devices are manageable via REST client
The system SHALL provide typed REST functions for listing, trusting, untrusting, and revoking the caller's devices under `/api/v1/identity/devices`.

#### Scenario: List my devices
- **WHEN** the frontend calls `listSecurityDevices`
- **THEN** it sends `GET /api/v1/identity/devices` and returns a list of device views

#### Scenario: Trust a device
- **WHEN** the frontend calls `trustSecurityDevice` with a device ID
- **THEN** it sends `POST /api/v1/identity/devices/{id}/trust` and returns an ack response

#### Scenario: Untrust a device
- **WHEN** the frontend calls `untrustSecurityDevice` with a device ID
- **THEN** it sends `DELETE /api/v1/identity/devices/{id}/trust` and returns an ack response

#### Scenario: Revoke a device
- **WHEN** the frontend calls `revokeSecurityDevice` with a device ID
- **THEN** it sends `DELETE /api/v1/identity/devices/{id}` and returns an ack response

### Requirement: Current-user login history and verification status are readable via REST client
The system SHALL provide typed REST functions for the caller's login history and verification status under `/api/v1/identity/login-history` and `/api/v1/identity/me/verification-status`.

#### Scenario: Get my login history
- **WHEN** the frontend calls `getMyLoginHistory` with optional page, size, and result filter
- **THEN** it sends `GET /api/v1/identity/login-history` and returns a paginated list of login history views

#### Scenario: Get my verification status
- **WHEN** the frontend calls `getMyVerificationStatus`
- **THEN** it sends `GET /api/v1/identity/me/verification-status` and returns the verification status view

### Requirement: Admin security operations are callable via REST client
The system SHALL provide typed REST functions for admin session management, user login history, lock/unlock, and security log under `/api/v1/identity/admin`.

#### Scenario: List admin user sessions
- **WHEN** the frontend calls `listSecurityAdminUserSessions` with a user ID
- **THEN** it sends `GET /api/v1/identity/admin/users/{id}/sessions` and returns a list of admin session views

#### Scenario: Revoke all admin user sessions
- **WHEN** the frontend calls `revokeAllSecurityAdminUserSessions` with a user ID
- **THEN** it sends `DELETE /api/v1/identity/admin/users/{id}/sessions` and returns an ack response

#### Scenario: Revoke one admin user session
- **WHEN** the frontend calls `revokeSecurityAdminUserSession` with a user ID and session ID
- **THEN** it sends `DELETE /api/v1/identity/admin/users/{id}/sessions/{sid}` and returns an ack response

#### Scenario: Get admin user login history
- **WHEN** the frontend calls `getSecurityAdminUserLoginHistory` with a user ID and optional page, size, result filter
- **THEN** it sends `GET /api/v1/identity/admin/users/{id}/login-history` and returns a paginated list of login history views

#### Scenario: Lock a user as admin
- **WHEN** the frontend calls `lockSecurityAdminUser` with a user ID and lock request
- **THEN** it sends `POST /api/v1/identity/admin/users/{id}/lock` and returns an ack response

#### Scenario: Unlock a user as admin
- **WHEN** the frontend calls `unlockSecurityAdminUser` with a user ID
- **THEN** it sends `POST /api/v1/identity/admin/users/{id}/unlock` and returns an ack response

#### Scenario: Query admin security log
- **WHEN** the frontend calls `querySecurityAdminLog` with optional user ID, event type, date range, page, and size
- **THEN** it sends `GET /api/v1/identity/admin/security-log` and returns a list of security log views

### Requirement: Identity-Security types avoid barrel collisions
The system SHALL prefix every exported TypeScript type in the identity-security module with `Security`.

#### Scenario: Type exports
- **WHEN** a developer imports from `@/modules/api/rest/identity-security`
- **THEN** every exported type name starts with `Security`

### Requirement: Identity-Security REST client exposes SWR hooks
The system SHALL provide SWR query hooks for read endpoints and SWR mutation hooks for write endpoints.

#### Scenario: Query hooks
- **WHEN** a component needs devices, login history, verification status, admin sessions, or admin security log
- **THEN** it uses the corresponding `use...Swr` hook exported from `src/hooks/swr/api/rest/queries`

#### Scenario: Mutation hooks
- **WHEN** a component trusts, untrusts, revokes a device, locks/unlocks a user, revokes sessions, or checks permissions
- **THEN** it uses the corresponding `use...Mutation` hook exported from `src/hooks/swr/api/rest/mutations`
