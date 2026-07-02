# activity-timeline Specification

## Purpose
TBD - created by archiving change activity-timeline. Update Purpose after archive.
## Requirements
### Requirement: Activity timeline surface
The system SHALL provide a read-only user activity timeline at `/activity` that
renders the output of the Activity Engine (§18). The engine backbone is BE and out of
scope; this requirement covers only the FE surface, mocked until the BE contract lands.

#### Scenario: Feed renders recent activity
- **WHEN** a user opens `/activity`
- **THEN** the page shows a vertical feed of recent activity items
- **AND** each row shows an accent-tinted icon for its kind, the event text, and a relative timestamp

#### Scenario: Every activity kind has an icon and label
- **WHEN** an item's kind is one of courseEnrolled, lessonCompleted, resourceUploaded, questionPosted, badgeEarned, coinEarned, eventJoined, or groupJoined
- **THEN** the row renders the kind's phosphor icon and its localized `activity.kinds.*` label

#### Scenario: Empty feed
- **WHEN** the activity feed has no items
- **THEN** the page shows the `activity.empty` message instead of the list

