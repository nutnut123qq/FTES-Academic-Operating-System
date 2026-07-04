# profile-identity-hero Specification

## Purpose
TBD - created by archiving change profile-feature-complete. Update Purpose after archive.
## Requirements
### Requirement: Profile identity sidebar renders a cover image
The profile identity sidebar SHALL display a cover banner image when a `coverUrl` is available.

#### Scenario: Cover loads
- **WHEN** the profile hook returns a `coverUrl`
- **THEN** the sidebar renders the image with rounded corners and fixed height
- **AND** the avatar overlaps the bottom edge of the cover

#### Scenario: Cover is missing
- **WHEN** the profile hook returns no `coverUrl`
- **THEN** the sidebar renders a muted placeholder gradient and the avatar still renders

### Requirement: Profile identity sidebar renders an avatar image
The profile identity sidebar SHALL render the uploaded avatar image inside the gradient ring; initials SHALL be used only as a fallback.

#### Scenario: Avatar image exists
- **WHEN** the profile hook returns an `avatarUrl`
- **THEN** the avatar displays the image

#### Scenario: Avatar image missing
- **WHEN** the profile hook returns no `avatarUrl`
- **THEN** the avatar displays the first initial of the user's name

### Requirement: Rank and badge framing for the avatar
The avatar frame SHALL support a rank-colored ring and an overlapping badge medal strip below the avatar.

#### Scenario: User has rank
- **WHEN** gamification data includes a rank
- **THEN** the avatar ring uses the rank accent color

#### Scenario: User has earned badges
- **WHEN** the user has earned badges
- **THEN** a row of overlapping circular badge medals renders below the avatar

