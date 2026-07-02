# admin-content-moderation

## ADDED Requirements

### Requirement: Report queue for posts, comments, and resources
The system SHALL present a moderation report queue at `/admin/moderation`, accessible to
Moderator (and above), listing reported posts, comments, and resources with reason,
reporter, timestamp, and a content excerpt.

#### Scenario: Moderator views the report queue
- **WHEN** a Moderator opens `/admin/moderation`
- **THEN** the queue lists pending reports across posts, comments, and resources
- **AND** each report shows its target type, reason, reporter, timestamp, and an excerpt

#### Scenario: Empty and loading states
- **WHEN** the queue is loading
- **THEN** a skeleton mirroring the queue layout is shown
- **AND** when there are no pending reports an empty state is shown

### Requirement: Approve, reject, and remove reports (mock, confirmed on destructive)
The system SHALL let a Moderator approve, reject, or remove a reported item via mock
mutations, and SHALL require a confirmation dialog before removing content.

#### Scenario: Moderator approves or rejects a report
- **WHEN** a Moderator approves or rejects a report
- **THEN** the mock mutation runs, the report leaves the pending queue, and a success toast is shown
- **AND** on a mocked failure an error toast is shown and the report stays pending

#### Scenario: Removing content requires confirmation
- **WHEN** a Moderator chooses to remove a reported item
- **THEN** a confirmation dialog describing the consequence is shown before removal
- **AND** canceling leaves the item in the queue unremoved

### Requirement: Moderation log
The system SHALL record and display a moderation log of actions (who moderated what, which
action, and when) from mock data.

#### Scenario: Moderation actions appear in the log
- **WHEN** a Moderator resolves a report
- **THEN** an entry is added to the moderation log capturing the actor, the action, the target, and the timestamp
- **AND** the log is viewable within the moderation surface

### Requirement: Moderation gating, BE assumption, i18n, and a11y
The system SHALL gate the moderation surface to Moderator and above, run all actions against
a mock service with a documented BE assumption, localize text under `admin.moderation.*`
(vi/en), and expose actions accessibly.

#### Scenario: Non-moderator is blocked from moderation
- **WHEN** a member or guest attempts to open `/admin/moderation`
- **THEN** the moderation surface is not rendered and the operator is redirected or shown a forbidden surface

#### Scenario: Localized and accessible moderation actions
- **WHEN** the queue renders in `vi` or `en`
- **THEN** all text comes from `admin.moderation.*` keys and each action control has an accessible label
