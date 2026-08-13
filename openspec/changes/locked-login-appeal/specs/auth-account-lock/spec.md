# auth-account-lock

## ADDED Requirements

### Requirement: A locked sign-in explains itself
The sign-in flow SHALL present a dedicated screen when the backend rejects a sign-in because the
account is locked, and that screen SHALL show the lock reason reported by the backend, when the lock
was placed, how many times the account has been locked before, and — for a temporary lock — when it
clears by itself. Details the backend does not report SHALL be omitted rather than rendered as empty
or placeholder values.

#### Scenario: Locked account signs in
- **WHEN** sign-in is rejected because the account is locked
- **THEN** the flow SHALL move to the locked screen instead of only showing a transient message
- **AND** the reason reported by the backend SHALL be displayed

#### Scenario: Backend reports only an unlock time
- **WHEN** the rejection carries only the unlock time
- **THEN** that time SHALL be shown
- **AND** no appeal SHALL be offered

### Requirement: A locked user can appeal from the sign-in screen
The locked screen SHALL offer an appeal form when the backend states an appeal is possible, SHALL
submit it with the identifier and password the user just entered, and SHALL confirm submission in
place. When an appeal is already awaiting review, the screen SHALL say so and SHALL NOT offer to
submit another. A rejected submission SHALL show its reason next to the form rather than as a
transient message.

#### Scenario: Appeal submitted
- **WHEN** the user writes an explanation and submits it
- **THEN** the appeal SHALL be sent with their identifier and password
- **AND** the screen SHALL confirm that it is awaiting review

#### Scenario: Appeal already pending
- **WHEN** the backend reports an appeal is already pending
- **THEN** the screen SHALL say so
- **AND** no submit control SHALL be offered

#### Scenario: Submission rejected
- **WHEN** the backend rejects the submission
- **THEN** the reason SHALL be shown beside the form
