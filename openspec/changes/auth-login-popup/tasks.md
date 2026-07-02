# Tasks: auth-login-popup

## 1. Guard hook + context message

- [ ] 1.1 Add auth context-message state (serializable string key) to the existing overlay/Redux auth state, cleared when the modal closes (alongside `resetSignInState`/`resetSignUpState`)
- [ ] 1.2 Create `useRequireAuth()` hook: signed-in → run action; guest → set context key, dispatch SignIn tab, open authentication overlay (follow `starci-fe-cannon-apply` patterns)
- [ ] 1.3 Render the context message line in `AuthenticationModal` above the active section when present
- [ ] 1.4 Wire the guard into guest-gated interactions (like, comment, save/bookmark, enroll CTAs) — enumerate call sites and replace ad-hoc guest handling

## 2. Deep link `?auth=`

- [ ] 2.1 Create `AuthQueryOpener` client component (null render): read `useSearchParams()` for `auth=signin|signup`, on match (guest only) dispatch tab + open overlay, then `router.replace` URL without the param; mount once in the `[locale]` layout inside a Suspense boundary
- [ ] 2.2 Ignore unknown `auth` values; strip the param silently for signed-in users

## 3. Register route consolidation

- [ ] 3.1 Replace `src/app/[locale]/authentication/register/page.tsx` body with a locale-preserving redirect to `/?auth=signup`
- [ ] 3.2 Remove the now-unreferenced `RegisterForm` feature component and its i18n-only strings if unused elsewhere

## 4. OAuth round-trip return

- [ ] 4.1 Before starting GitHub/Google OAuth from the modal, store the current route in `sessionStorage` (`auth:returnTo`)
- [ ] 4.2 In `OauthRedirect` login landings, after processing, `router.replace` to the stored route (fallback locale home) and clear the key
- [ ] 4.3 Give OAuth landing pages a branded transitional loading state consistent with app visuals

## 5. Modal polish

- [ ] 5.1 Verify/assert HeroUI Modal focus trap, ESC close, backdrop close, and focus restore to trigger
- [ ] 5.2 Submit buttons: `isLoading` + disabled while mock auth pending (SignIn and SignUp); inline error display stays in-modal
- [ ] 5.3 SignIn↔SignUp switch links inside the modal sections (no close/reopen)
- [ ] 5.4 Mobile (<`sm`): full-width sheet sizing with scrollable content via Modal classNames

## 6. i18n + a11y

- [ ] 6.1 Add vi/en strings: guard context messages (like/comment/save/enroll/generic), OAuth transitional copy
- [ ] 6.2 Dialog semantics: accessible name on the modal, `aria-label` on all icon-only controls inside it

## 7. Verify

- [ ] 7.1 Manual pass: account menu entries, guarded like/enroll as guest, `/vi?auth=signup` deep link, register redirect, OAuth landing fallback, ESC/mobile behavior, vi/en
- [ ] 7.2 `npm run build` (webpack) green
- [ ] 7.3 `tsc --noEmit` clean
