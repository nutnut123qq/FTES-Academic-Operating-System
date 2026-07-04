# profile-community-social Specification

## Purpose
TBD - created by archiving change profile-feature-complete. Update Purpose after archive.
## Requirements
### Requirement: Community tab shows Followers and Following counts
The Community tab SHALL display Followers and Following counts as metric cards.

#### Scenario: Counts load
- **WHEN** the community summary hook returns follower/following counts
- **THEN** both counts render as metric cards

#### Scenario: Counts are zero
- **WHEN** follower or following count is zero
- **THEN** the metric card renders `0` with the appropriate label

### Requirement: Community tab shows Followers/Following list
The Community tab SHALL provide a compact list of follower/following users.

#### Scenario: User opens the list
- **WHEN** the user interacts with the followers/following section
- **THEN** a list of user names/avatars renders

### Requirement: Community tab shows Activity Timeline
The Community tab SHALL embed an activity timeline of recent user actions.

#### Scenario: Timeline has items
- **WHEN** the activity hook returns items
- **THEN** they render in a vertical feed with icon, description, and relative time

#### Scenario: Timeline is empty
- **WHEN** the activity list is empty
- **THEN** the section shows an empty state

