# course-leaderboard

## MODIFIED Requirements

### Requirement: Leaderboard rows show a real display name, never a migration placeholder
The course leaderboard SHALL request the backend `displayName` field and render each row's
name using the fallback order `displayName → username → "#<short id>"`. Because the backend
resolves `displayName` (fullName → real username → "Học viên <suffix>") and strips any
`legacy_<uuid>` placeholder out of both `displayName` and `username`, a migrated learner SHALL
appear with their real name and SHALL NOT appear as a raw `legacy_<uuid>` string.

#### Scenario: Migrated learner shows their real name
- **WHEN** the backend returns a row whose `displayName` is the learner's full name and whose `username` was a `legacy_<uuid>` placeholder (now sanitized to null)
- **THEN** the leaderboard row shows the full name
- **AND** it never shows the `legacy_<uuid>` string

#### Scenario: Learner without a resolvable name shows a stable handle
- **WHEN** the backend returns a row with a null `displayName` and null `username`
- **THEN** the row shows a short `#<id>` handle derived from the user id, not a blank or a fabricated name
