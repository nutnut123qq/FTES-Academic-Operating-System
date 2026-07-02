## ADDED Requirements

### Requirement: Self-service registration
A visitor SHALL create an account with email + password after passing captcha and agreeing to terms.

#### Scenario: Successful sign-up
- **WHEN** a visitor submits a valid email, matching passwords, a passed captcha, and terms agreed
- **THEN** the account request is accepted and the visitor is taken to OTP email verification

#### Scenario: Blocked without terms or captcha
- **WHEN** captcha is unsolved or terms are not agreed
- **THEN** the submit action is disabled and a validation hint is shown
