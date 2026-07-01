## Why

The skeleton only ships Keycloak sign-in (password + Google/GitHub). Spec §1 Identity &
Security requires the full account lifecycle — self-registration, OTP verification, 2FA,
password recovery, remember-me, and captcha. These are Phase 0 foundations that gate every
later domain, so they land first. This change delivers the **frontend** surfaces; backend
contracts are mocked and flagged where absent.

## What Changes

- Add **registration** flow (email + password, agree-to-terms) with a post-signup verify step.
- Add **OTP verification** UI (email and phone) — code entry, resend-with-cooldown, expiry.
- Add **2FA** setup + challenge UI (TOTP authenticator: QR + secret, verify; challenge on login).
- Add **forgot / reset password** flow (request link/OTP → set new password).
- Add **remember-me** on sign-in (persisted preference; extends session hint intent).
- Add **captcha** gate (Turnstile) on register + forgot-password, using existing `captcha` public env.
- Wire these into the existing `AuthenticationModal` / auth shell without breaking current sign-in.
- Mock BE: OTP/2FA/reset call placeholder async services returning success; **no** real endpoints invented.

## Capabilities

### New Capabilities
- `auth-registration`: self-service account creation + agree-to-terms + captcha.
- `auth-otp-verification`: email/phone OTP entry, resend cooldown, expiry handling.
- `auth-two-factor`: TOTP 2FA enrolment and login challenge.
- `auth-password-recovery`: forgot-password request and reset-password completion.
- `auth-session-preferences`: remember-me persistence on sign-in.

### Modified Capabilities
- (none — no existing OpenSpec specs yet)

## Impact

- FE: `components/modals/AuthenticationModal/*`, new auth forms/components under the design system,
  new hooks under `hooks/` for OTP/2FA/reset (mocked), i18n keys (vi/en), zustand/redux auth state.
- Env: reuses `captcha.siteKey` / `captcha.enabled` (already in `resources/env/public.ts`).
- No BE endpoints added; mocked services isolated so real wiring is a drop-in later.
- Build must stay green (`npm run build` webpack + tsc).
