## 1. Feature components (FE mock)
- [x] 1.1 `features/authentication/RegisterForm` — name/email/password/confirm, inline validation, mock success
- [x] 1.2 `features/authentication/ForgotPasswordForm` — email, "check your email" success state
- [x] 1.3 `features/authentication/ResetPasswordForm` — new password/confirm, mock success
- [x] 1.4 `features/authentication/OtpVerifyForm` — 6-box OTP, verify + mock resend
- [x] 1.5 `features/authentication/TwoFactorSetup` — placeholder QR + 6-digit confirm + enable

## 2. Route pages (thin)
- [x] 2.1 `[locale]/authentication/register/page.tsx`
- [x] 2.2 `[locale]/authentication/forgot-password/page.tsx`
- [x] 2.3 `[locale]/authentication/reset-password/page.tsx`
- [x] 2.4 `[locale]/authentication/verify-otp/page.tsx`
- [x] 2.5 `[locale]/authentication/two-factor/page.tsx`

## 3. Wiring
- [x] 3.1 i18n `authFlows.*` (vi/en) grouped per form, full key parity
- [x] 3.2 eslint clean on new files

## 4. Notes
- [ ] 4.1 FE mock only — no Keycloak, no fetch; real IdP tracked by `phase0-auth-complete`. DO NOT archive.
