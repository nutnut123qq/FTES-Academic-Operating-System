## 1. Identity/auth REST types

- [x] 1.1 Create `src/modules/api/rest/identity/types.ts` with request/response interfaces inferred from backend `AuthDtos`.

## 2. Identity/auth REST client

- [x] 2.1 Create `src/modules/api/rest/identity/identity.ts` exporting REST functions for `AuthController`, `MfaController`, `PasswordController`, and `SessionController`.
- [x] 2.2 Create `src/modules/api/rest/identity/index.ts` barrel re-exporting types and functions.
- [x] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./identity"`.

### Endpoint mapping

**Keycloak-covered — BỎ QUA (ghi trong design.md):**
- `POST /api/v1/auth/login` → `keycloakLogin`
- `POST /api/v1/auth/register` → `keycloakRegister`
- `POST /api/v1/auth/logout` → `keycloakLogout`

**GraphQL-covered — BỎ QUA (ghi trong design.md):**
- `POST /api/v1/auth/refresh` → GraphQL `refreshToken`
- `GET /api/v1/identity/sessions` → GraphQL `mySessions`
- `DELETE /api/v1/identity/sessions/{sid}` → GraphQL `revokeSession`

**REST-only — implement in `identity.ts`:**
- Auth: `verifyEmail`, `resendVerificationEmail`, `verifyMfaChallenge`, `loginWithGoogle`, `requestOtp`, `verifyOtp`, `requestPasswordReset`, `resetPassword`
- MFA: `getMfaStatus`, `enrollMfaTotp`, `activateMfaTotp`, `disableMfaTotp`
- Password: `changePassword`
- Sessions: `listSessions`, `revokeSession`, `revokeAllSessions`

## 3. SWR mutation wrappers

- [x] 3.1 Create `usePostVerifyEmailSwr.ts`
- [x] 3.2 Create `usePostResendVerificationEmailSwr.ts`
- [x] 3.3 Create `usePostVerifyMfaChallengeSwr.ts`
- [x] 3.4 Create `usePostLoginWithGoogleSwr.ts`
- [x] 3.5 Create `usePostRequestOtpSwr.ts`
- [x] 3.6 Create `usePostVerifyOtpSwr.ts`
- [x] 3.7 Create `usePostRequestPasswordResetSwr.ts`
- [x] 3.8 Create `usePostResetPasswordSwr.ts`
- [x] 3.9 Create `usePostEnrollMfaTotpSwr.ts`
- [x] 3.10 Create `usePostActivateMfaTotpSwr.ts`
- [x] 3.11 Create `usePostDisableMfaTotpSwr.ts`
- [x] 3.12 Create `usePostChangePasswordSwr.ts`
- [x] 3.13 Create `usePostRevokeSessionSwr.ts`
- [x] 3.14 Create `usePostRevokeAllSessionsSwr.ts`
- [x] 3.15 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [x] 4.1 Create `src/hooks/swr/api/rest/queries/index.ts` if it does not exist.
- [x] 4.2 Create `useGetMfaStatusSwr.ts`
- [x] 4.3 Create `useGetSessionsSwr.ts`
- [x] 4.4 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export the new query hooks.

## 5. Verification

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 5.2 Run `npm run build` (webpack) and ensure a green build.
