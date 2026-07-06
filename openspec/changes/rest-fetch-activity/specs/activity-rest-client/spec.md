## ADDED Requirements

### Requirement: Frontend can read the activity timeline
The frontend SHALL provide a typed REST call and SWR query hook that returns a cursor-paginated activity timeline.

#### Scenario: Fetch timeline
- **WHEN** a caller with `activity.read` authority requests the timeline with optional filters
- **THEN** the system calls `GET /api/v1/activities?userId={userId}&contextType={contextType}&contextId={contextId}&types={types}&cursor={cursor}&limit={limit}` and returns `ActivityCursorPage<ActivityView>`

### Requirement: Frontend can read a single activity
The frontend SHALL provide a typed REST call and SWR query hook that returns a single activity event.

#### Scenario: Fetch single activity
- **WHEN** a caller with `activity.read` authority requests an event id
- **THEN** the system calls `GET /api/v1/activities/{eventId}` and returns `ActivityView`

### Requirement: Frontend can list activity types
The frontend SHALL provide a typed REST call and SWR query hook that returns the active activity type catalog.

#### Scenario: Fetch activity types
- **WHEN** a caller with `activity.read` authority requests activity types
- **THEN** the system calls `GET /api/v1/activities/types` and returns `ActivityTypeView[]`

### Requirement: Frontend can read privacy overrides
The frontend SHALL provide a typed REST call and SWR query hook that returns the current user's privacy overrides.

#### Scenario: Fetch privacy settings
- **WHEN** a caller with `activity.privacy.manage` authority requests privacy settings
- **THEN** the system calls `GET /api/v1/activities/privacy-settings` and returns `ActivityPrivacyOverrideView[]`

### Requirement: Frontend can update privacy overrides
The frontend SHALL provide a typed REST call and SWR mutation hook that upserts the current user's privacy overrides.

#### Scenario: Update privacy settings
- **WHEN** a caller with `activity.privacy.manage` authority submits `ActivityPrivacyOverrideView[]`
- **THEN** the system calls `PUT /api/v1/activities/privacy-settings` and returns `ActivityPrivacyOverrideView[]`

### Requirement: Frontend can replay activities
The frontend SHALL provide a typed REST call and SWR mutation hook that replays activities into a consumer group's replay topic.

#### Scenario: Replay activities
- **WHEN** a caller with `activity.replay` authority submits an `ActivityReplayRequest`
- **THEN** the system calls `POST /api/v1/activities/replay` and returns `ActivityReplayResult`

### Requirement: Activity DTOs are typed
The frontend SHALL expose TypeScript types for all request and response shapes, prefixed with `Activity*`.

#### Scenario: Type definitions match backend contract
- **WHEN** a developer imports from the activity REST module
- **THEN** they receive types `ActivityView`, `ActivityActorView`, `ActivityRefView`, `ActivityCursorPage`, `ActivityTypeView`, `ActivityPrivacyOverrideView`, `ActivityReplayRequest`, and `ActivityReplayResult` matching the backend `ActivityController` and `ActivityViews` records
