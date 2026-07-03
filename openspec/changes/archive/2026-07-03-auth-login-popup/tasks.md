# Tasks: auth-login-popup

## 1. Guard hook + context message

- [x] 1.1 Add auth context-message state (serializable string key) to the existing overlay/Redux auth state, cleared when the modal closes (alongside `resetSignInState`/`resetSignUpState`)
- [x] 1.2 Create `useRequireAuth()` hook: signed-in → run action; guest → set context key, dispatch SignIn tab, open authentication overlay (follow `starci-fe-cannon-apply` patterns)
- [x] 1.3 Render the context message line in `AuthenticationModal` above the active section when present
- [x] 1.4 Wire the guard into guest-gated interactions (like, comment, save/bookmark, enroll CTAs) — enumerate call sites and replace ad-hoc guest handling
      (call sites: `ResourceComments` comment/reply → `auth.context.comment`, comment like → `auth.context.like`; `CourseDetail` enroll CTA → `auth.context.enroll`.
      Community feed/post likes are static mock counts (no buttons) — nothing to gate; save/bookmark surfaces belong to `save-for-later`, which consumes this hook.)

## 2. Deep link `?auth=`

- [x] 2.1 Create `AuthQueryOpener` client component (null render): read `useSearchParams()` for `auth=signin|signup`, on match (guest only) dispatch tab + open overlay, then `router.replace` URL without the param; mount once in the `[locale]` layout inside a Suspense boundary (mounted in `InnerLayout`, the locale layout's client shell)
- [x] 2.2 Ignore unknown `auth` values; strip the param silently for signed-in users (signed-in = redux flag OR stored access token, covering the pre-hydration race)

## 3. Register route consolidation

- [x] 3.1 Replace `src/app/[locale]/authentication/register/page.tsx` body with a locale-preserving redirect to `/?auth=signup`
- [x] 3.2 Remove the now-unreferenced `RegisterForm` feature component and its i18n-only strings if unused elsewhere (`authFlows.register.*` removed from vi/en)

## 4. OAuth round-trip return

- [x] 4.1 Before starting GitHub/Google OAuth from the modal, store the current route in `sessionStorage` (`auth:returnTo` → `SessionStorageId.AuthReturnTo`)
- [x] 4.2 In `OauthRedirect` login landings, after processing, `router.replace` to the stored route (fallback locale home) and clear the key
- [x] 4.3 Give OAuth landing pages a branded transitional loading state consistent with app visuals (LogoMark + spinner + status message)

## 5. Modal polish

- [x] 5.1 Verify/assert HeroUI Modal focus trap, ESC close, backdrop close, and focus restore to trigger (react-aria baseline — no `isDismissable`/`isKeyboardDismissDisabled` override anywhere in the modal; asserted in the component JSDoc)
- [x] 5.2 Submit buttons: `isLoading` + disabled while mock auth pending (SignIn and SignUp); inline error display stays in-modal (`isPending` + `isDisabled={… || isSubmitting}`; errors render via `FieldError`/toast, never navigate)
- [x] 5.3 SignIn↔SignUp switch links inside the modal sections (no close/reopen) (`SignUpPrompt`/`SignInPrompt` switch the Redux tab in place)
- [x] 5.4 Mobile (<`sm`): full-width sheet sizing with scrollable content via Modal classNames (`Modal.Container max-sm:p-0!`, dialog `max-sm:max-w-none! max-sm:rounded-b-none! max-sm:max-h-[92dvh] max-sm:overflow-y-auto`)

## 6. i18n + a11y

- [x] 6.1 Add vi/en strings: guard context messages (like/comment/save/enroll/generic) under `auth.context.*`; OAuth transitional copy reuses `auth.oauth.*`
- [x] 6.2 Dialog semantics: accessible name on the modal (`aria-label` = active tab title), `aria-label` on all icon-only controls inside it (password show/hide toggles, both sections)

## 7. Verify

- [x] 7.1 Manual pass: account menu entries, guarded like/enroll as guest, `/vi?auth=signup` deep link, register redirect, OAuth landing fallback, ESC/mobile behavior, vi/en
- [x] 7.2 `npm run build` (webpack) green — build: batch-verified by orchestrator
- [x] 7.3 `tsc --noEmit` clean
