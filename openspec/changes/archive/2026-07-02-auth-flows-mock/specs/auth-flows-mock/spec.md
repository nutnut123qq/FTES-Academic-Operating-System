## ADDED Requirements

### Requirement: Mock identity form shells
The system SHALL present FE-only visual mock forms for the self-service identity
surfaces (register, forgot password, reset password, OTP verify, two-factor setup) as
centered auth cards. These forms SHALL NOT perform real authentication, contact
Keycloak, or make network calls; submit is a client-side no-op that flips to a local
success state.

#### Scenario: Register form validation
- **WHEN** a visitor submits the register form with a malformed email or mismatched passwords
- **THEN** an inline validation message is shown and no success state is entered

#### Scenario: Register mock success
- **WHEN** a visitor submits a valid name, email, and matching passwords
- **THEN** a mock "account created" success state is shown (no account is created)

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
The system SHALL expose the mock identity forms at
`/[locale]/authentication/{register,forgot-password,reset-password,verify-otp,two-factor}`
as thin route pages that render the corresponding feature component.

#### Scenario: Route renders form
- **WHEN** a visitor navigates to one of the five authentication routes
- **THEN** the page returns 200 and renders the matching centered-card form
