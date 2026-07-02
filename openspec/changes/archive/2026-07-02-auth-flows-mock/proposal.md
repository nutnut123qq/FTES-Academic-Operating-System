## Why

`ftes.txt` §1 (Identity) lists a full set of identity surfaces, but only the OAuth
redirect landings (`/authentication/google|github`) and login/logout exist as routes.
The self-service identity forms — Register, Forgot password, Reset password, OTP
verify, Two-factor setup — are 404. This ships those surfaces as **FE-only visual
mocks** so the flows are reachable and reviewable ahead of the real Keycloak wiring.

These are **mock shells**: no real auth, no Keycloak, no fetch. Forms validate on the
client and submit as a no-op that flips to a local success state. The real identity
provider integration is out of scope and tracked by `phase0-auth-complete`.

## What Changes

- Add `features/authentication/{RegisterForm,ForgotPasswordForm,ResetPasswordForm,OtpVerifyForm,TwoFactorSetup}`
  — centered-card forms mirroring the house auth look, tokens only, dark-mode + a11y.
  Client-side validation (email format, password match) shown inline; submit is a mock
  that shows a local success/confirmation state.
- Add 5 thin route pages under `[locale]/authentication/`: `register`,
  `forgot-password`, `reset-password`, `verify-otp`, `two-factor`.
- Add `authFlows.*` i18n (vi/en), grouped per form.

## Capabilities

### New Capabilities
- `auth-flows-mock`: the FE mock identity forms (register / forgot / reset / OTP / 2FA).

### Modified Capabilities
- (none)

## Impact
- FE only: new `features/authentication/*` + 5 pages + `authFlows.*` i18n. No BE, no
  Keycloak, no fetch — submit handlers are mock. No shared-file edits beyond i18n.
