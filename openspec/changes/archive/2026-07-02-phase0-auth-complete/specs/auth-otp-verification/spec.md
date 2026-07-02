## ADDED Requirements

### Requirement: OTP verification
The system SHALL verify a user via a one-time code sent to email or phone, with resend cooldown and expiry.

#### Scenario: Correct code
- **WHEN** the user enters the current unexpired code
- **THEN** verification succeeds and the flow continues

#### Scenario: Resend cooldown
- **WHEN** the user requests a new code before the cooldown elapses
- **THEN** the resend control stays disabled with a countdown
