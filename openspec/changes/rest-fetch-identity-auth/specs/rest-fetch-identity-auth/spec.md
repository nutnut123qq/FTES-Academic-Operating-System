## ADDED Requirements

### Requirement: Identity/auth REST client reuses the shared REST wrapper
The identity/auth REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

#### Scenario: Request password reset
- **WHEN** `requestPasswordReset(request)` is called
- **THEN** it performs `POST /api/v1/auth/forgot-password` through `restRequest` and resolves with `void`

### Requirement: AuthController public flows are exposed via REST
The identity/auth REST client SHALL expose typed functions for every `AuthController` endpoint except those already covered by `keycloak-auth` REST or GraphQL.

#### Scenario: Verify email
- **WHEN** `verifyEmail(request)` is called
- **THEN** it performs `POST /api/v1/auth/verify-email` and resolves with `void`

#### Scenario: Resend verification email
- **WHEN** `resendVerificationEmail(request)` is called
- **THEN** it performs `POST /api/v1/auth/resend-verification` and resolves with `void`

#### Scenario: Verify MFA challenge
- **WHEN** `verifyMfaChallenge(request)` is called
- **THEN** it performs `POST /api/v1/auth/mfa/verify` and returns `TokenResponse`

#### Scenario: Login with Google
- **WHEN** `loginWithGoogle(request)` is called
- **THEN** it performs `POST /api/v1/auth/google` and returns `TokenResponse`

#### Scenario: Request OTP
- **WHEN** `requestOtp(request)` is called
- **THEN** it performs `POST /api/v1/auth/otp/request` and resolves with `void`

#### Scenario: Verify OTP
- **WHEN** `verifyOtp(request)` is called
- **THEN** it performs `POST /api/v1/auth/otp/verify` and resolves with `void`

#### Scenario: Reset password
- **WHEN** `resetPassword(request)` is called
- **THEN** it performs `POST /api/v1/auth/reset-password` and resolves with `void`

### Requirement: MfaController endpoints are exposed via REST
The identity/auth REST client SHALL expose typed functions for all TOTP management endpoints in `MfaController`.

#### Scenario: Get MFA status
- **WHEN** `getMfaStatus()` is called
- **THEN** it performs `GET /api/v1/identity/mfa` and returns `MfaStatusResponse`

#### Scenario: Enroll TOTP MFA
- **WHEN** `enrollMfaTotp()` is called
- **THEN** it performs `POST /api/v1/identity/mfa/totp/enroll` and returns `MfaEnrollResponse`

#### Scenario: Activate TOTP MFA
- **WHEN** `activateMfaTotp(request)` is called
- **THEN** it performs `POST /api/v1/identity/mfa/totp/activate` and returns `MfaActivateResponse`

#### Scenario: Disable TOTP MFA
- **WHEN** `disableMfaTotp(request)` is called
- **THEN** it performs `DELETE /api/v1/identity/mfa/totp` and resolves with `void`

### Requirement: PasswordController endpoint is exposed via REST
The identity/auth REST client SHALL expose the authenticated password change endpoint.

#### Scenario: Change password
- **WHEN** `changePassword(request)` is called
- **THEN** it performs `PUT /api/v1/identity/password` and resolves with `void`

### Requirement: SessionController endpoints are exposed via REST
The identity/auth REST client SHALL expose typed functions for session list, revoke one, and revoke all.

#### Scenario: List sessions
- **WHEN** `listSessions()` is called
- **THEN** it performs `GET /api/v1/identity/sessions` and returns `Array<SessionView>`

#### Scenario: Revoke one session
- **WHEN** `revokeSession(sid)` is called
- **THEN** it performs `DELETE /api/v1/identity/sessions/{sid}` and resolves with `void`

#### Scenario: Revoke all sessions
- **WHEN** `revokeAllSessions(keepCurrent)` is called
- **THEN** it performs `DELETE /api/v1/identity/sessions?keepCurrent={keepCurrent}` and resolves with `void`

### Requirement: SWR mutation wrappers exist for every writing endpoint
For every POST/PUT/DELETE identity/auth REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use verify email hook
- **WHEN** a component calls `usePostVerifyEmailSwr().trigger(request)`
- **THEN** the hook invokes `verifyEmail(request)` through `useSWRMutation`

### Requirement: SWR query wrappers exist for read endpoints
For every GET identity/auth REST function, a corresponding `useGet*Swr` hook SHALL exist in `src/hooks/swr/api/rest/queries/`.

#### Scenario: Use MFA status hook
- **WHEN** a component calls `useGetMfaStatusSwr()`
- **THEN** the hook invokes `getMfaStatus()` through `useSWR`

### Requirement: Identity/auth module is re-exported from the REST barrel
- **WHEN** `src/modules/api/rest/index.ts` is updated
- **THEN** it adds `export * from "./identity"` alongside existing module exports

### Requirement: Overlapping endpoints are documented and skipped
Endpoints already served by `keycloak-auth` REST or GraphQL SHALL NOT receive duplicate REST clients in this change.

#### Scenario: Skip Keycloak login
- **WHEN** reviewing the auth surface
- **THEN** `POST /api/v1/auth/login` is listed as covered by `keycloakLogin` and omitted

#### Scenario: Skip GraphQL session list
- **WHEN** reviewing the session surface
- **THEN** `GET /api/v1/identity/sessions` is listed as also covered by GraphQL `mySessions`, and the REST version is still exposed but documented
