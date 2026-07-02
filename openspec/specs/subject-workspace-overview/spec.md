# subject-workspace-overview Specification

## Purpose
TBD - created by archiving change subject-overview-community-hub. Update Purpose after archive.
## Requirements
### Requirement: Subject workspace overview community hub
The subject-workspace overview at `/subjects/[subjectId]` SHALL render a community hub
inside the workspace shell: a join banner, a discussion feed, and shortcut rails. Data
is FE-mocked until the BE contract lands.

#### Scenario: Join banner
- **WHEN** the overview renders
- **THEN** a banner states the user has joined the space with member/moderator/resource counts and a compose action

#### Scenario: Two-column hub — feed + shortcut rails
- **WHEN** the overview renders on a `md`+ viewport
- **THEN** the left column shows a pinned moderator post (when present) and recent discussion posts
- **AND** the right column shows shortcut cards for new resources, featured challenges, and active members, each linking to its full tab

#### Scenario: Post rows and challenge difficulty
- **WHEN** a discussion post renders
- **THEN** it shows an initials avatar, author, relative time, title, snippet, and reaction/comment counts
- **WHEN** a featured challenge renders
- **THEN** its difficulty is shown as a color-coded chip (easy/medium/hard)

#### Scenario: Loading and error states
- **WHEN** the overview is loading
- **THEN** a skeleton mirroring the banner + two-column hub is shown
- **WHEN** loading fails with no cached data
- **THEN** an error state with a retry action is shown

