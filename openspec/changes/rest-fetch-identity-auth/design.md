## Context

The `rest-fetch-layer`, `rest-fetch-course`, and `rest-fetch-subject` changes established a shared REST wrapper (`restRequest`) and typed clients for the challenge, course, and subject domains. The backend identity/auth domain lives in `vn.ftes.aos.identity.auth.web` and exposes four REST controllers:

- `AuthController` — public endpoints under `/api/v1/auth/**`.
- `MfaController` — TOTP 2FA management under `/api/v1/identity/mfa/**`.
- `PasswordController` — authenticated password change under `/api/v1/identity/password`.
- `SessionController` — own-session management under `/api/v1/identity/sessions/**`.

The frontend already has `src/modules/api/rest/keycloak-auth/` for the legacy Keycloak login/register/logout paths and several GraphQL auth-related operations (sign-up init, refresh token, my sessions, revoke session). This change extends the REST client layer to the identity/auth REST surface while avoiding duplication.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/identity/` for all non-overlapping identity/auth REST endpoints.
- Add SWR mutation wrappers for every writing endpoint (POST/PUT/DELETE).
- Add SWR query wrappers for the two read endpoints (MFA status, session list).
- Update `src/modules/api/rest/index.ts` to re-export `./identity`.
- Document skipped endpoints and the rationale.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not cover `identity/rbac/**` or `identity/security/**` (explicitly out of scope).
- Do not duplicate the Keycloak login/register/logout REST clients already in `src/modules/api/rest/keycloak-auth/`.
- Do not duplicate GraphQL-covered flows (`signUpInit`, `refreshToken`, `mySessions`, `revokeSession`).
- Do not add new dependencies or backend changes.
- Do not build UI components or pages.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping. Identity/auth needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/identity/`
**Rationale:** Mirrors the backend package `identity.auth.web` and keeps the module boundary clear, consistent with `challenges/`, `course/`, and `subject/`.

### 3. Skip Keycloak-covered auth entry points
**Rationale:** `src/modules/api/rest/keycloak-auth/` already exposes `keycloakLogin`, `keycloakRegister`, and `keycloakLogout` for `/api/v1/keycloak/auth/*`. The identity `AuthController` endpoints `/login`, `/register`, and `/logout` serve the same user-facing capabilities through a different backend stack; adding a second client would create confusion and duplicate SWR hooks. Skipped:
- `POST /api/v1/auth/login` → `keycloakLogin`
- `POST /api/v1/auth/register` → `keycloakRegister`
- `POST /api/v1/auth/logout` → `keycloakLogout`

### 4. Skip GraphQL-covered flows
**Rationale:** Avoid duplicate data layers and conflicting cache semantics. Skipped:
- `POST /api/v1/auth/refresh` → GraphQL `refreshToken` mutation (used by the proactive access-token refresh link).
- `GET /api/v1/identity/sessions` → GraphQL `mySessions` query.
- `DELETE /api/v1/identity/sessions/{sid}` → GraphQL `revokeSession` mutation.

### 5. Expose reads through SWR query hooks
**Rationale:** `MfaController.status` and `SessionController.list` are read endpoints. The existing `src/hooks/swr/api/rest/mutations/` folder only contains mutation hooks; adding query SWR hooks in a new `src/hooks/swr/api/rest/queries/` folder follows SWR semantics and avoids misnaming GET wrappers as mutations.

### 6. Types inferred from `AuthDtos.java`
**Rationale:** `AuthDtos` is the backend source of truth. We mirror record shapes using TypeScript interfaces, using `string` for UUIDs and ISO timestamps.

### 7. Keep `MessageResponse` transparent
**Rationale:** Void-ish endpoints return `{status:"ok"}`. The client functions return `void` (ignoring the body) to match the existing pattern for void REST calls; the SWR wrappers still surface success/error states.

## Risks / Trade-offs

- **[Risk]** Skipping `/api/v1/auth/refresh` means the identity token refresh path is not directly callable through the new REST client. Mitigation: components already rely on the GraphQL refresh link; if a pure REST refresh is needed later, it can be added as a small follow-up.
- **[Risk]** `SessionController.list` and `revoke` are partially covered by GraphQL. We expose the REST versions for cases where the REST envelope error model is preferred, but components should pick one source to avoid cache inconsistency.
- **[Trade-off]** Google login and OTP request/verify are added even though no active UI currently consumes them. They are low-cost to expose and avoid future ad-hoc axios calls.

## Affected Files / Modules

- `src/modules/api/rest/identity/types.ts` — request/response DTOs.
- `src/modules/api/rest/identity/identity.ts` — REST client functions.
- `src/modules/api/rest/identity/index.ts` — barrel export.
- `src/modules/api/rest/index.ts` — add `export * from "./identity"`.
- `src/hooks/swr/api/rest/mutations/usePost*.ts` — mutation hooks for writing endpoints.
- `src/hooks/swr/api/rest/mutations/index.ts` — re-export new mutation hooks.
- `src/hooks/swr/api/rest/queries/useGet*.ts` — query hooks for read endpoints.
- `src/hooks/swr/api/rest/queries/index.ts` — re-export new query hooks.
