# auth-viewer-hydration (delta)

## ADDED Requirements

### Requirement: Every sign-in path hydrates the viewer before it reports success

Storing an access token SHALL NOT be treated as the end of signing in. Every path that starts a
session — password login, Google login, MFA challenge verification, registration verification and
the OAuth `exchange-code` redirect — SHALL explicitly revalidate the app-shell viewer query
(`me` + self profile) and SHALL await it, so the mutation resolves only once the signed-in shell
has an identity to paint.

The revalidation SHALL target the SIGNED-IN SWR key through `mutate`, not rely on the key flipping
from the `authenticated` change: a tab that has already settled that key once serves it deduped and
never runs the fetcher, which is exactly the case (sign out → sign in again, or signing in after a
revoked session) where the header used to stay signed-out until a full reload.

The key factory SHALL be shared between the query and the revalidation helper, so the two cannot
drift.

#### Scenario: Signing in a second time in the same tab

- **GIVEN** the tab has been signed in before and the signed-in viewer key already holds data
- **WHEN** the user signs out and signs in again without reloading
- **THEN** the viewer query fetches again and the account menu, avatar and gated controls render the
  new session's identity without a page reload

#### Scenario: OAuth redirect back into the app

- **WHEN** the OAuth `code` is exchanged for a token on return to the app
- **THEN** the viewer is revalidated before the URL is cleaned up, so the shell never shows a
  signed-out header over a signed-in session

#### Scenario: Exactly one viewer request

- **WHEN** a sign-in path revalidates the viewer
- **THEN** the settled entry is dropped and the following mount fetches once — the sign-in does not
  issue two `me` requests

### Requirement: Signed-in data gates read a reactive session flag, never localStorage at render

A hook that must not fetch for anonymous viewers SHALL gate its SWR key on the redux session flag
`state.keycloak.authenticated`, the same source the app-shell viewer query uses. It SHALL NOT decide
by reading `window.localStorage` during render: local storage is not reactive, so a session that
starts without a page load leaves the key null forever and the surface empty until the user reloads.

`isLoading` SHALL be reported as false while signed out (null key never loads), so callers fall
through to their empty/hidden branch instead of showing a skeleton that will never resolve.

#### Scenario: Signing in on the home page

- **GIVEN** an anonymous viewer on the home page, where the "continue learning" band is hidden
- **WHEN** the viewer signs in through the modal, without a page reload
- **THEN** the enrollments query runs and the band appears with their courses

#### Scenario: Signing in on a course detail page

- **GIVEN** an anonymous viewer on a course detail page showing the purchase card
- **WHEN** the viewer signs in without leaving the page
- **THEN** the enrollment/access query for that course runs and the page reflects their entitlement

#### Scenario: Anonymous viewer

- **WHEN** no session is active
- **THEN** the SWR key is null, no request is issued, and `isLoading` is false
