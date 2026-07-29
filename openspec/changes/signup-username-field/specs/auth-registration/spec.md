# auth-registration

## ADDED Requirements

### Requirement: Optional user-chosen username at sign-up
The registration form SHALL let the visitor type an OPTIONAL `username`. When the visitor leaves it
blank, the request SHALL omit `username` so the backend derives one from the email local-part
(`abc@gmail.com → abc`). When the visitor types a value, the client SHALL validate it as 3–64
characters matching `^[a-zA-Z0-9._-]+$` (aligned with the backend charset `[a-z0-9._-]`) and SHALL
send it lower-cased and trimmed. A blank username SHALL never block submit.

#### Scenario: Blank username is derived by the backend
- **WHEN** the visitor submits a valid email and matching passwords but leaves the username field blank
- **THEN** the register request omits `username`
- **AND** the backend derives the username from the email local-part

#### Scenario: Valid typed username is sent
- **WHEN** the visitor types `John_Doe.01` in the username field and submits an otherwise valid form
- **THEN** the field passes validation
- **AND** the register request includes `username` as `john_doe.01` (trimmed + lower-cased)

#### Scenario: Invalid username blocks submit with an inline error
- **WHEN** the visitor types a username shorter than 3 characters, longer than 64 characters, or containing a character outside `[a-zA-Z0-9._-]`
- **THEN** an inline validation error is shown on the username field
- **AND** the submit action is disabled until the username is corrected or cleared
