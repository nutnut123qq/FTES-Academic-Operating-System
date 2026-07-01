## 1. Registration
- [ ] 1.1 Add register form (email, password, confirm, agree-to-terms) in AuthenticationModal sign-up section
- [ ] 1.2 Captcha gate (Turnstile) wired via publicEnv().captcha; disabled state until passed
- [ ] 1.3 On submit -> transition to OTP email verification step

## 2. OTP verification
- [ ] 2.1 OTP input component (6 cells, paste support) in design system
- [ ] 2.2 useOtpVerify + useResendCooldown hooks (mock BE)
- [ ] 2.3 Email + phone OTP screens with resend cooldown + expiry messaging

## 3. Two-factor (TOTP)
- [ ] 3.1 2FA enrolment UI (QR + secret + verify) — mock secret
- [ ] 3.2 Login 2FA challenge step when enabled
- [ ] 3.3 use2fa hook (enrol/verify, mock BE)

## 4. Password recovery
- [ ] 4.1 Forgot-password request screen (email + captcha, neutral confirmation)
- [ ] 4.2 Reset-password screen (token + new/confirm password)
- [ ] 4.3 usePasswordRecovery hook (request/reset, mock BE)

## 5. Session preference
- [ ] 5.1 Remember-me checkbox on sign-in, persisted to local storage
- [ ] 5.2 Pre-check from stored preference on mount

## 6. Wiring & i18n
- [ ] 6.1 i18n keys (vi/en) for all new copy
- [ ] 6.2 Verify: npm run build (webpack) green + tsc clean
