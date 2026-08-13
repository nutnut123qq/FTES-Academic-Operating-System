# settings-security

## ADDED Requirements

### Requirement: Settings has a navigable shell
The settings area SHALL present a persistent navigation between its sections — appearance,
notifications and security — with the active section reflected in the URL so a section can be linked
to and reloaded directly.

#### Scenario: Moving between sections
- **WHEN** a learner selects a settings section
- **THEN** the URL SHALL change to that section and the navigation SHALL mark it active

#### Scenario: Opening a section directly
- **WHEN** a learner loads a settings section URL directly
- **THEN** that section SHALL render with its navigation entry active

### Requirement: Notification preferences are a settings section
Notification preferences SHALL be reachable as a settings section, reusing the existing preferences
surface rather than a second implementation, so both entry points always show the same state.

#### Scenario: Changing a preference from settings
- **WHEN** a learner toggles a notification type in settings
- **THEN** the change SHALL persist and SHALL be reflected wherever preferences are shown

### Requirement: Changing the password from settings
A learner SHALL be able to change their password in settings by supplying the current and the new
password, and the form SHALL state beforehand that other devices will be signed out.

#### Scenario: Successful change
- **WHEN** a learner submits a correct current password and a valid new one
- **THEN** the password SHALL change and the learner SHALL stay signed in on this device

#### Scenario: Wrong current password
- **WHEN** the current password is wrong
- **THEN** the failure SHALL be shown on the form and nothing SHALL change

### Requirement: Two-factor authentication is managed in settings
Settings SHALL show whether each two-factor method — authenticator app and email code — is enabled,
and SHALL let the learner turn each on or off. Both operations SHALL require the current password.

#### Scenario: Enabling email two-factor
- **WHEN** a learner enables email two-factor and confirms with the current password
- **THEN** the setting SHALL be enabled and reflected in the displayed status

#### Scenario: Backend does not support a method
- **WHEN** the backend does not report a method's state
- **THEN** that method SHALL NOT be offered, rather than shown in an unknown state

### Requirement: Logged-in devices can be listed and signed out
Settings SHALL list the learner's active sessions with what identifies each one — device, address and
last use — clearly marking the current session, and SHALL offer signing out a single session and
signing out everywhere except the current one. Both actions SHALL confirm before running and SHALL
refresh the list afterwards.

#### Scenario: Signing out one device
- **WHEN** a learner signs out one listed session and confirms
- **THEN** that session SHALL disappear from the list
- **AND** the learner SHALL remain signed in on the current device

#### Scenario: Signing out everywhere else
- **WHEN** a learner signs out all other sessions and confirms
- **THEN** only the current session SHALL remain listed

#### Scenario: The current session is not offered for sign-out
- **WHEN** the list renders
- **THEN** the current session SHALL be identifiable and SHALL NOT offer a per-row sign-out that would end the learner's own session unexpectedly

### Requirement: Recent sign-in activity is visible
Settings SHALL show recent sign-in attempts with their outcome and origin, so a learner can spot
access they do not recognise.

#### Scenario: Reviewing activity
- **WHEN** a learner opens the security section
- **THEN** recent sign-in attempts SHALL be listed with whether each succeeded

### Requirement: A revoked session ends the client session immediately
The client SHALL clear its stored credentials and return the learner to sign-in whenever the backend
reports that the session behind those credentials has been revoked, rather than retrying the request
or leaving a stale authenticated state.

#### Scenario: Session revoked elsewhere
- **WHEN** a request fails because the session was revoked
- **THEN** stored credentials SHALL be cleared and the learner SHALL be returned to sign-in

#### Scenario: Sign-out that fails server-side
- **WHEN** signing out cannot reach the backend
- **THEN** the client SHALL still clear every stored credential and its in-memory authentication state
