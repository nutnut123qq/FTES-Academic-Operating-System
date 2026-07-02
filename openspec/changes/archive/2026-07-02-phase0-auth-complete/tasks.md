## 1. Registration
- [x] 1.1 Add register form (email, password, confirm, agree-to-terms) in AuthenticationModal sign-up section
      (already covered by `auth-login-popup` + sign-up work: `SignUpSection/RegistrationState` has all four fields on the Zustand form `useSignUpForm`)
- [x] 1.2 Captcha gate (Turnstile) wired via publicEnv().captcha; disabled state until passed
      (already covered: `reuseable/Turnstile` rendered in RegistrationState + CredentialsState, submit disabled without token when `captcha.enabled`)
- [x] 1.3 On submit -> transition to OTP email verification step
      (already covered: `signUpInit` → `setSignUpState(SignUpState.Otp)` → `SignUpSection/OtpState`)

## 2. OTP verification
- [x] 2.1 OTP input component (6 cells, paste support) in design system
      (already covered: HeroUI `InputOTP` with 6 slots + native paste, used in both modal OTP steps — no bespoke component needed)
- [x] 2.2 useOtpVerify + useResendCooldown hooks (mock BE)
      (new: `hooks/auth/useOtpVerify.ts` mock service for the standalone form — modal flows keep their real signIn/signUpVerifyOtp GraphQL; new `hooks/reuseables/useResendCooldown.ts` countdown)
- [x] 2.3 Email + phone OTP screens with resend cooldown + expiry messaging
      (new: cooldown + expiry hint added to SignIn/SignUp modal OtpStates; standalone `OtpVerifyForm` gains `?channel=phone` variant, cooldown, expiry hint and mock verify/resend)

## 3. Two-factor (TOTP)
- [x] 3.1 2FA enrolment UI (QR + secret + verify) — mock secret
      (upgraded `TwoFactorSetup`: client-generated mock secret + copy button + verify via use2fa; QR stays a placeholder frame — no QR lib in deps, manual-entry secret is the enrolment path)
- [x] 3.2 Login 2FA challenge step when enabled
      (new: `SignInState.TwoFactor` + `SignInSection/TwoFactorState`, gated on the persisted enabled flag after OTP verify)
- [x] 3.3 use2fa hook (enrol/verify, mock BE)
      (new: `hooks/auth/use2fa.ts` — enrol/verifyEnrolment/verifyChallenge/isEnabled, flag persisted in localStorage; existing setup/confirm/disable GraphQL mutations left untouched for the real wiring later)

## 4. Password recovery
- [x] 4.1 Forgot-password request screen (email + captcha, neutral confirmation)
      (upgraded `ForgotPasswordForm`: Turnstile gate + mock request with pending state; neutral confirmation kept; sign-in "Forgot password?" link now navigates here via new `pathConfig().authentication().forgotPassword()`)
- [x] 4.2 Reset-password screen (token + new/confirm password)
      (upgraded `ResetPasswordForm`: reads `?token=`, invalid-link notice without token, min-length 8 + match validation, mock reset; page wrapped in Suspense for useSearchParams)
- [x] 4.3 usePasswordRecovery hook (request/reset, mock BE)
      (new: `hooks/auth/usePasswordRecovery.ts`)

## 5. Session preference
- [x] 5.1 Remember-me checkbox on sign-in, persisted to local storage
      (checkbox existed; persistence added: `LocalStorageId.AuthRememberMe` written on successful sign-in in `useSignInForm`)
- [x] 5.2 Pre-check from stored preference on mount
      (new mount effect in `CredentialsState` hydrates the store from the stored preference)

## 6. Wiring & i18n
- [x] 6.1 i18n keys (vi/en) for all new copy
      (`auth.otp.*` shared cooldown/expiry, `auth.signIn.twoFactor.*`, `authFlows.otp.{titlePhone,subtitlePhone,expiryHint,resendCooldown}`, `authFlows.reset.{passwordMinLength,missingToken,requestNewLink}`, `authFlows.twoFactor.{secretLabel,copySecret,copied}`)
- [x] 6.2 Verify: npm run build (webpack) green + tsc clean
      (tsc + eslint clean on all touched files; the only remaining repo-wide tsc error comes from another change's in-flight `admin/config` work, outside this change)
