# auth-popup-entry — Delta Specification

## ADDED Requirements

### Requirement: Modal is the only sign-in/sign-up surface

The system SHALL present sign-in and sign-up exclusively through the `AuthenticationModal` popup. No user-facing control SHALL navigate to a full-page login or sign-up route. All auth entry points — the guest account menu (sign in / sign up items), any marketing or enrollment CTA that requires an account, and guest-gated interactions — SHALL open the modal on the appropriate tab (SignIn or SignUp) while keeping the user on the current route.

#### Scenario: Account menu opens modal

- **GIVEN** a signed-out visitor on any page
- **WHEN** they choose "Đăng nhập" or "Đăng ký" from the account menu
- **THEN** the `AuthenticationModal` opens on the corresponding tab
- **AND** the browser URL path does not change

#### Scenario: No full login page exists

- **WHEN** the app's routes and navigations are enumerated
- **THEN** no `Link`/`router.push` targets a full-page sign-in or sign-up UI; the only full-page surfaces under `/authentication/*` are OAuth landings and the flow pages (forgot-password, reset-password, verify-otp, two-factor)

### Requirement: Guest-gated actions open the modal with context

The system SHALL provide a shared auth guard (hook) used by auth-required interactions (like, comment, save/bookmark, enroll, and equivalent CTAs). When a signed-out visitor triggers a guarded action, the guard SHALL open the `AuthenticationModal` on the SignIn tab with a contextual message describing why sign-in is needed, and SHALL NOT perform the action or navigate. The context message SHALL be cleared when the modal closes.

#### Scenario: Guest likes a post

- **GIVEN** a signed-out visitor viewing a post
- **WHEN** they press the like button
- **THEN** the modal opens on SignIn with a context message (e.g. "Đăng nhập để thích bài viết")
- **AND** no like is recorded and the route is unchanged

#### Scenario: Guest enrolls in a course

- **GIVEN** a signed-out visitor on a course detail page
- **WHEN** they press the enroll CTA
- **THEN** the modal opens on SignIn with an enroll context message and the visitor remains on the course page

#### Scenario: Context cleared on close

- **GIVEN** the modal was opened by a guarded action with a context message
- **WHEN** the visitor dismisses the modal and reopens it from the account menu
- **THEN** no stale context message is shown

### Requirement: Auth deep link via query param

The system SHALL open the `AuthenticationModal` on page load when the URL contains `?auth=signin` or `?auth=signup`, pre-selecting the matching tab, on any locale route. After opening, the system SHALL remove the `auth` param from the URL without adding a history entry. Unknown `auth` values SHALL be ignored. Signed-in users SHALL NOT see the modal from a deep link; the param is stripped silently.

#### Scenario: Shared sign-up link

- **WHEN** a signed-out visitor opens `/vi?auth=signup`
- **THEN** the page renders with the modal open on the SignUp tab
- **AND** the URL becomes `/vi` (no `auth` param) without a new history entry

#### Scenario: Deep link while signed in

- **WHEN** a signed-in user opens a URL containing `?auth=signin`
- **THEN** no modal opens and the param is removed from the URL

### Requirement: Post-login continuation

After a successful sign-in or sign-up completed inside the modal, the system SHALL close the modal and keep the user on the same route with page state intact (no redirect to a landing page). Session-dependent UI (account menu, gated controls) SHALL reflect the signed-in state without a full page reload.

#### Scenario: Login from a lesson page

- **GIVEN** a signed-out visitor reading `/vi/courses/x/lessons/y` who opened the modal
- **WHEN** they sign in successfully
- **THEN** the modal closes and they remain on the same lesson URL
- **AND** the navbar shows the signed-in account menu

### Requirement: OAuth round-trip returns to origin

When a visitor starts an OAuth sign-in (GitHub or Google) from the modal, the system SHALL remember the current route before leaving to the provider. The OAuth landing pages (`/authentication/{github,google}/login`) SHALL, after processing, return the user to that remembered route (fallback: locale home). Landing pages SHALL render a visually consistent transitional state (branded loading, not a bare page) and SHALL NOT be linked as navigation destinations.

#### Scenario: GitHub round trip

- **GIVEN** a signed-out visitor on `/vi/community` who opened the modal and pressed "GitHub"
- **WHEN** the provider redirects back to `/vi/authentication/github/login`
- **THEN** after processing they land on `/vi/community` signed in

#### Scenario: Landing with no remembered origin

- **WHEN** an OAuth landing page is opened directly with no remembered route
- **THEN** the user is sent to the locale home page after processing

### Requirement: Modal interaction quality

The `AuthenticationModal` SHALL: trap focus while open and restore focus to the trigger on close; close on ESC and backdrop press; show a loading state on the submit button while authentication is pending (submit disabled, no double submit); display authentication errors inline within the modal (never navigate away on error); provide in-modal links to switch between SignIn and SignUp tabs; and on viewports below the `sm` breakpoint render as a full-width sheet using the full viewport width with scrollable content.

#### Scenario: Keyboard dismiss and focus

- **GIVEN** the modal is open from the account menu
- **WHEN** the user presses ESC
- **THEN** the modal closes and focus returns to the account menu trigger

#### Scenario: Pending submit

- **WHEN** the user submits credentials and the (mock) auth request is in flight
- **THEN** the submit button shows a loading indicator and repeated presses do not resubmit

#### Scenario: Error stays in modal

- **WHEN** sign-in fails (mock invalid credentials)
- **THEN** an inline error message appears inside the modal and the modal stays open

#### Scenario: Tab switch

- **GIVEN** the modal is open on SignIn
- **WHEN** the user presses the "Đăng ký" switch link
- **THEN** the SignUp tab renders without closing or reopening the modal

#### Scenario: Mobile sheet

- **WHEN** the modal opens on a viewport narrower than the `sm` breakpoint
- **THEN** it renders full-width with internally scrollable content and remains dismissible

### Requirement: Localization and accessibility of the auth surface

All strings introduced by this capability (context messages, deep-link behavior, landing transitional copy) SHALL be localized in Vietnamese and English via the i18n message catalogs. The modal SHALL expose dialog semantics (`role="dialog"`, `aria-modal`, an accessible name), and every icon-only control inside it SHALL have an accessible label.

#### Scenario: Locale switch

- **WHEN** the modal is opened on the `en` locale after a guarded like action
- **THEN** the context message and all form labels render in English; on `vi` they render in Vietnamese

#### Scenario: Screen reader announcement

- **WHEN** the modal opens
- **THEN** assistive technology receives a dialog with an accessible name identifying it as sign in / sign up
