# Proposal: auth-login-popup

## Why

User intent: "Trang đăng nhập thì dùng popup thôi không cần tách trang" — sign-in/sign-up must be popup-only. The app already has a modal-based `AuthenticationModal` (SignIn/SignUp tabs, OAuth, OTP), but the experience is not consolidated: a standalone full-page `/authentication/register` route duplicates sign-up outside the modal, there is no deep-link way to open the modal from a shared URL, and guest-gated actions (like/comment/save/enroll) have no unified "open auth modal" guard. This change makes the modal the single auth entry surface.

## What Changes

- Every login/sign-up entry point opens `AuthenticationModal` (never navigates to a full auth page):
  - Account menu guest items (`AccountMenuGuest`, legacy shell `AuthActions`) — already modal-based, kept as-is and covered by spec.
  - Guest-gated actions (like, comment, save, enroll, any auth-required CTA) get a shared `useRequireAuth`-style guard that opens the modal with a contextual message instead of failing silently or navigating.
- Deep-link support: `?auth=signin|signup` query param opens the modal on page load (tab pre-selected), so shared links work; param is stripped from the URL after opening.
- Post-login continuation: after successful sign-in/sign-up the user stays on the current page — no redirect to a landing page, no loss of scroll/route.
- **BREAKING (route UX)**: `/[locale]/authentication/register` full-page sign-up is removed as a rendered page; it redirects to `/?auth=signup` (locale-preserved) so old links open the modal. Sign-up lives only in the modal's SignUp tab.
- Kept as functional flow pages (redirect targets, not primary UX): `/authentication/{forgot-password,reset-password,verify-otp,two-factor}` mock forms and `/authentication/{github,google}/{login,logout}` OAuth landings. OAuth landings must return the user to the page they started from.
- Modal UX polish: focus trap + ESC close (HeroUI Modal baseline, asserted in spec), loading state on submit, inline error display, signin↔signup tab switch links, near-full-screen sheet behavior on mobile.
- i18n vi/en for all new strings (context messages, deep-link titles); a11y (dialog semantics, labelled controls).
- Admin login (`AdminLogin`) is out of scope — kept unchanged.

## Capabilities

### New Capabilities
- `auth-popup-entry`: the authentication modal as the single sign-in/sign-up surface — entry points, guest-gated action guard, `?auth=` deep link, post-login continuation, OAuth round-trip return, modal UX/a11y/i18n requirements.

### Modified Capabilities
- `auth-flows-mock`: the "Reachable auth routes" requirement changes — `register` leaves the set of full-page mock forms (route now redirects to the modal deep link); the remaining flow routes (forgot-password, reset-password, verify-otp, two-factor) stay. The "Mock identity form shells" requirement drops the register form shell.

## Impact

- FE-only (mock BE). No API contract changes.
- Affected code (implementation phase): `src/components/modals/AuthenticationModal/*`, `src/components/features/navbar/Navbar/AccountMenuDropdown/AccountMenuGuest`, `src/components/layouts/shell/Navbar/AccountMenuDropdown/AuthActions`, new guard hook under `src/hooks`, new deep-link opener component mounted in the locale layout, `src/app/[locale]/authentication/register/page.tsx` (becomes redirect), `src/components/layouts/auth/OauthRedirect` (return-to-origin), i18n message files (vi/en).
- `RegisterForm` feature component becomes unreferenced by any route — removed with the page.
- Existing specs: delta on `openspec/specs/auth-flows-mock/spec.md`.
