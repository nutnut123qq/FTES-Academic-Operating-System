## ADDED Requirements

### Requirement: TOTP two-factor
A user SHALL enrol a TOTP authenticator (QR + secret) and be challenged for a code at login when enabled.

#### Scenario: Enrolment
- **WHEN** the user scans the QR and enters a valid 6-digit code
- **THEN** 2FA is marked enabled for the account

#### Scenario: Login challenge
- **WHEN** a 2FA-enabled user signs in with correct credentials
- **THEN** they must enter a valid TOTP code before the session is granted
