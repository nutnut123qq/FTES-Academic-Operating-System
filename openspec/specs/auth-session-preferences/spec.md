# auth-session-preferences Specification

## Purpose
TBD - created by archiving change phase0-auth-complete. Update Purpose after archive.
## Requirements
### Requirement: Remember me
The sign-in form SHALL let a user opt into a longer-lived session, persisting the preference locally.

#### Scenario: Opt in
- **WHEN** the user checks remember-me and signs in
- **THEN** the preference is stored and reused to pre-check the box next time
