## Scope — FE mock, no real auth

These are **visual shells only**. There is no Keycloak, no session, no network call.
Every submit handler is a no-op that flips a local `useState` flag to a success /
confirmation view. Validation is client-side only (email regex, password match, all
fields present, 6-digit OTP). When the real IdP lands (`phase0-auth-complete`) these
forms become the presentational layer over the real actions — the shape is chosen so
that swap is additive.

## Layout — centered auth card (mirrors the auth landings)

The existing auth surfaces (`OauthRedirect`) center a small column in the viewport.
Reuse that framing for every form:
- Each form is a centered card: `mx-auto max-w-md` column inside a
  `rounded-large border border-separator p-6` card (house card class), with title
  (`Typography type="h4" weight="bold"`) + subtitle (`type="body-sm" color="muted"`).
- Fields = plain `<input>` with the house input class
  (`w-full rounded-large border border-separator bg-transparent px-4 py-2 text-sm
  text-foreground outline-none placeholder:text-muted focus:border-accent`), controlled
  via `useState`, each with a `<label htmlFor>` for a11y.
- Buttons = HeroUI `Button` with `variant` only (no `color`/`startContent`); icons as
  children. Links use `Link` from `@/i18n/navigation`.
- Inline validation errors render under the field as `Typography type="body-xs"` in
  `text-danger` with `role="alert"`.

## Per-form behaviour

- **RegisterForm** — name / email / password / confirm. Validates email format +
  password match; on valid submit shows a mock "account created" success state. Footer
  link to sign-in.
- **ForgotPasswordForm** — email. On valid submit swaps to a "check your email"
  success state. Back-to-login link.
- **ResetPasswordForm** — new password / confirm. Validates match; success state.
- **OtpVerifyForm** — 6 single-char boxes (auto-advance + backspace), Verify enabled
  only when all 6 filled; "Resend code" is a mock no-op. Success state on verify.
- **TwoFactorSetup** — a placeholder QR box (bordered square + icon + scan hint), a
  6-digit confirm input, "Enable 2FA" → success state.

## Icons
Phosphor `*Icon` imports only (e.g. `EnvelopeSimpleIcon`, `QrCodeIcon`,
`CheckCircleIcon`), rendered as `Button`/inline children.

## Not doing
- No captcha, no terms checkbox, no remember-me (those belong to the real
  `phase0-auth-complete` flow), no real code delivery, no BE, no route guards.
- No cross-form navigation wiring beyond the footer links each form owns.
