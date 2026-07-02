# auth-password-recovery Specification

## Purpose
TBD - created by archiving change phase0-auth-complete. Update Purpose after archive.
## Requirements
### Requirement: Password recovery
A user SHALL request a password reset and set a new password via a verified channel.

#### Scenario: Request reset
- **WHEN** a user submits a known email with captcha passed
- **THEN** a reset instruction is dispatched and a neutral confirmation is shown (no account enumeration)

#### Scenario: Set new password
- **WHEN** a user with a valid reset token submits matching new passwords
- **THEN** the password is updated and they can sign in
