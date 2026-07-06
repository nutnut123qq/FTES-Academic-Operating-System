## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, and `subject`. The identity/auth domain exposes its own REST controllers (`AuthController`, `MfaController`, `PasswordController`, `SessionController`) under `/api/v1/auth/**` and `/api/v1/identity/**`, which the frontend currently calls through ad-hoc mocks or older GraphQL/Keycloak paths. Surfacing these endpoints through the same typed REST layer lets UI flows (email verification, password recovery, TOTP 2FA, session management) use a consistent fetch pattern.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client for the identity/auth controller cluster under `src/modules/api/rest/identity/` covering:
  - `AuthController` public flows: email verification, resend verification, MFA challenge verification, Google login, OTP request/verify, forgot/reset password, token refresh.
  - `MfaController` TOTP management: status, enroll, activate, disable.
  - `PasswordController` authenticated password change.
  - `SessionController` list, revoke one, and revoke all sessions.
- Add `usePost*Swr` mutation hooks in `src/hooks/swr/api/rest/mutations/` for every mutating REST endpoint.
- Add `useGet*Swr` query hooks in `src/hooks/swr/api/rest/queries/` for the two read endpoints (MFA status, session list).
- Update `src/modules/api/rest/index.ts` to re-export `./identity`.
- Explicitly document endpoints skipped because they overlap with `keycloak-auth` REST (`/keycloak/auth/login`, `/keycloak/auth/register`, `/keycloak/auth/logout`) or existing GraphQL auth operations.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-identity-auth`: REST client + SWR wrappers for the identity/auth controller cluster.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/identity/` and `src/hooks/swr/api/rest/mutations/` (plus a new `queries/` folder for the two reads).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
