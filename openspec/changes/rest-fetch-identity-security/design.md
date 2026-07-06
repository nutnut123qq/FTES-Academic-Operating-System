## Context

The frontend already consumes several backend modules through typed REST clients in `src/modules/api/rest/*`. The Identity-Security module exposes three REST controllers in `vn.ftes.aos.identity.security.web`:

- `DeviceController` — current-user device management under `/api/v1/identity/devices`.
- `LoginHistoryController` — current-user login history and verification status under `/api/v1/identity`.
- `AdminSecurityController` — admin security operations under `/api/v1/identity/admin`.

This change adds the corresponding frontend REST module and SWR hooks, following the same patterns already established by `rest-fetch-identity-rbac`, `rest-fetch-admin`, etc.

## Goals / Non-Goals

**Goals:**
- Provide a typed REST client (`src/modules/api/rest/identity-security`) covering the three security controllers listed above.
- Provide SWR query hooks for all read endpoints and SWR mutation hooks for all write endpoints.
- Prefix every exported type with `Security*` to avoid collisions in the top-level barrel export.
- Verify TypeScript and webpack build remain green.

**Non-Goals:**
- No Identity-RBAC controllers — already implemented in `rest-fetch-identity-rbac`.
- No Identity-Auth controllers — already implemented elsewhere.
- No product UI pages or forms.
- No backend changes.
- No new runtime dependencies.

## Decisions

1. **Module name `identity-security`.**
   - The directory is named `identity-security` to live alongside `identity` and `identity-rbac`. The exported type prefix is `Security*` to keep names short and collision-free in the barrel.

2. **Function naming mirrors backend capability.**
   - `DeviceController`: `listSecurityDevices`, `trustSecurityDevice`, `untrustSecurityDevice`, `revokeSecurityDevice`.
   - `LoginHistoryController`: `getMyLoginHistory`, `getMyVerificationStatus`.
   - `AdminSecurityController`: `listSecurityAdminUserSessions`, `revokeAllSecurityAdminUserSessions`, `revokeSecurityAdminUserSession`, `getSecurityAdminUserLoginHistory`, `lockSecurityAdminUser`, `unlockSecurityAdminUser`, `querySecurityAdminLog`.

3. **String IDs for path parameters.**
   - Backend uses `UUID` path variables. The REST client accepts `string` parameters, consistent with other modules, and interpolates them directly into URLs.

4. **Pagination request shape.**
   - Login history and security log endpoints accept `page`, `size`, and optional filters (`result`, `userId`, `eventType`, `from`, `to`). These are modeled as optional request arguments and passed as query params.

5. **GraphQL deduplication.**
   - Searched `src/modules/api/graphql` for `device`, `loginHistory`, `login-history`, `verification`, `securityLog`, `security`, `session`, `sessions`.
   - Found existing `query-my-sessions` and `mutation-revoke-session` under identity/auth, which cover current-user session listing/revocation. Those are intentionally separate from the device/login-history REST surface and are not duplicated here.
   - No GraphQL operations cover device management, login history, verification status, admin sessions, admin security log, or admin lock/unlock, so all REST endpoints in scope are implemented.

6. **SWR keys use tuple arrays.**
   - Query keys follow existing patterns, e.g. `["security", "devices"]`, `["security", "login-history", { page, size, result }]`, `["security", "me", "verification-status"]`, `["security", "admin", "users", userId, "sessions"]`, `["security", "admin", "log", params]`.

## Risks / Trade-offs

- [Risk] `MessageResponse` returns `{ status: "ok" }`; consumers may ignore it. → Mitigation: type it as `SecurityMessageResponse` and let callers treat it as an ack.
- [Risk] Admin security endpoints require admin permissions; callers must have them. → Mitigation: backend enforcement; hooks simply expose typed calls.
- [Risk] `SecurityLogView.payload` is typed as `unknown` on the frontend because the backend uses `Object`. → Mitigation: document the raw nature; callers can narrow when a concrete use case emerges.

## Migration Plan

No migration needed. This is a new additive module.

## Open Questions

None.
