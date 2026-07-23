## ADDED Requirements

### Requirement: Subject overview shows real recent discussions

The subject-workspace Overview SHALL populate its "Recent discussions" section from the real subject
community feed (the same source as the Discussion tab), showing the newest posts, instead of an always-empty
placeholder. When the subject genuinely has no discussions, an empty hint SHALL be shown.

#### Scenario: Subject has discussions

- **WHEN** the subject has community posts and the user opens the Overview
- **THEN** the newest discussions are listed under "Recent discussions"

#### Scenario: Subject has no discussions

- **WHEN** the subject has no posts
- **THEN** an empty hint is shown (not a blank section)
