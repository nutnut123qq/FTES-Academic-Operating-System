# Design: auth-login-popup

## Context

Login is already modal-first: `AuthenticationModal` (HeroUI `Modal size="xs"`) hosts SignIn/SignUp sections, tab selected via Redux `tabs.authenticationModalTab`, open/close via zustand overlay handle `useAuthenticationOverlayState()` ("authentication" key), reset of form state on close. It is opened today from exactly two places: `AccountMenuGuest` (features navbar) and `AuthActions` (legacy shell navbar), both doing `dispatch(setAuthenticationModalTab(tab)); openAuthentication()`.

Standalone routes under `src/app/[locale]/authentication/`:

| Route | Nature | Fate |
|---|---|---|
| `register` | Full-page sign-up card (`RegisterForm`) — duplicates modal SignUp | Redirect to `/?auth=signup` |
| `forgot-password`, `reset-password`, `verify-otp`, `two-factor` | Mock flow pages (email/redirect targets) | Keep, visually aligned, return-to-origin |
| `github/{login,logout}`, `google/{login,logout}`, `google` | OAuth redirect landings (`OauthRedirect`) | Keep, must return user to origin page |

There is no `/authentication/login` page (confirmed by route enumeration) — nothing else to delete. Admin has its own `AdminLogin` (out of scope). Constraint: FE-only, mock BE; `npm run build` uses webpack; verify with `tsc --noEmit`.

## Goals / Non-Goals

**Goals**
- One auth surface: every sign-in/sign-up intent opens the modal.
- Deep-linkable modal (`?auth=signin|signup`), continuation after login (stay on page).
- Reusable guest-gate guard for interaction CTAs with contextual message.
- OAuth/OTP/reset flows keep working and round-trip back to origin.

**Non-Goals**
- No real backend auth changes (Keycloak contract untouched; mock stays mock).
- No redesign of SignIn/SignUp form internals beyond polish items listed.
- No admin auth changes.

## Decisions

1. **Deep link = query param `?auth=signin|signup`, handled by a client "opener" mounted once in the locale layout.**
   - A small `AuthQueryOpener` client component reads `useSearchParams()`; on match it dispatches the tab, opens the overlay, then `router.replace` the URL without the param (keeps history clean, prevents re-open on back).
   - Alternative considered: dedicated `/login` route rendering the modal over an interceptor route (`@modal` parallel route). Rejected: heavier App Router machinery for zero extra value in an SPA-ish shell; query param works from any page, preserving "user stays where they are".

2. **Guest gate = shared hook `useRequireAuth()` returning a `guard(fn, context?)` wrapper.**
   - Signed-in → runs `fn`; guest → stores optional context message key in the overlay/Redux state, opens modal on SignIn tab. Modal shows the context line (e.g. "Đăng nhập để thích bài viết") above the form when present; cleared on close.
   - Alternative: per-feature ad-hoc checks. Rejected: this change exists precisely to consolidate entry points.

3. **Continuation = "do nothing" by design.** Because the modal never navigates, successful login just closes the modal and revalidates session-dependent SWR state; the page underneath is untouched. No `returnUrl` needed for the in-modal path.

4. **OAuth round-trip = sessionStorage `auth:returnTo` set before leaving to the provider; `OauthRedirect` landing reads it and `router.replace` there (fallback `/`).**
   - Alternative: encode return URL in OAuth `state` param. Rejected: FE-only mock, no server to echo state; sessionStorage is same-tab-safe and simplest.

5. **`/authentication/register` becomes a redirect page** (`redirect()` to locale home with `?auth=signup`) rather than deleted, so external/bookmarked links keep working. `RegisterForm` component is removed as dead code.

6. **Modal polish rides on HeroUI primitives**: focus trap/ESC/backdrop are HeroUI `Modal` behavior — spec asserts them rather than reimplementing. Mobile: modal container gets full-width bottom-sheet-like sizing under `sm` via classNames only (no new component). Submit buttons get `isLoading` + disabled during pending mock auth; errors render inline under fields (existing Redux sign-in/up state).

## Risks / Trade-offs

- [Query param opener runs in a Suspense boundary (`useSearchParams`) and could flash] → mount it `null`-rendering, open in `useEffect`, strip param via `router.replace` once.
- [Guard context message adds cross-component state] → keep it a serializable string key in the existing overlay/Redux slice (house rule: intent via store, no callbacks); clear on modal close alongside existing `resetSignInState`.
- [Removing `RegisterForm` breaks the archived `auth-flows-mock` spec expectations] → handled as a MODIFIED/REMOVED delta in this change's specs; redirect preserves the URL contract.
- [sessionStorage returnTo lost in new tab] → fallback to home; acceptable for mock OAuth.

## Migration Plan

1. Land guard hook + query opener + register redirect + OAuth returnTo in one change (FE atomic, 1 commit per house rule).
2. No data migration. Rollback = revert commit.

## Open Questions

- None blocking. If a future BE requires OAuth `state`-based return, replace decision 4 without spec change (spec only requires "returns to origin").
