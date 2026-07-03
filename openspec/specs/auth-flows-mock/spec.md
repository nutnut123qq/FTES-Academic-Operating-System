# auth-flows-mock Specification

## Purpose
TBD - created by archiving change auth-flows-mock. Update Purpose after archive.
## Requirements
### Requirement: Mock identity form shells
The system SHALL present FE-only visual mock forms for the self-service identity
flow surfaces (forgot password, reset password, OTP verify, two-factor setup) as
centered auth cards. These forms SHALL NOT perform real authentication, contact
Keycloak, or make network calls; submit is a client-side no-op that flips to a local
success state. Registration SHALL NOT have a standalone full-page form: sign-up is
provided exclusively by the `AuthenticationModal` SignUp tab (see `auth-popup-entry`),
and the standalone `RegisterForm` shell is removed.

#### Scenario: Forgot password confirmation
- **WHEN** a visitor submits a valid email on the forgot-password form
- **THEN** a neutral "check your email" confirmation state is shown

#### Scenario: Reset password match
- **WHEN** a visitor submits a new password and a matching confirmation
- **THEN** a mock success state is shown; mismatched passwords show an inline error

#### Scenario: OTP verify gating
- **WHEN** fewer than 6 digits are entered in the OTP boxes
- **THEN** the Verify action is disabled; entering all 6 enables it and Verify shows a mock success

#### Scenario: Two-factor enable
- **WHEN** a visitor enters a 6-digit code under the placeholder QR and enables 2FA
- **THEN** a mock "2FA enabled" success state is shown

### Requirement: Reachable auth routes
The system SHALL expose the mock identity flow forms at
`/[locale]/authentication/{forgot-password,reset-password,verify-otp,two-factor}`
as thin route pages that render the corresponding feature component. The route
`/[locale]/authentication/register` SHALL NOT render a page; it SHALL redirect to
the locale home with the `?auth=signup` deep link so the `AuthenticationModal`
opens on the SignUp tab (legacy links keep working).

#### Scenario: Flow route renders form
- **WHEN** a visitor navigates to one of the four flow routes (forgot-password, reset-password, verify-otp, two-factor)
- **THEN** the page returns 200 and renders the matching centered-card form

#### Scenario: Register route redirects to modal
- **WHEN** a visitor navigates to `/vi/authentication/register`
- **THEN** they are redirected to `/vi?auth=signup` and the authentication modal opens on the SignUp tab
