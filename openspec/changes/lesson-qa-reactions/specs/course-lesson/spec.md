## ADDED Requirements

### Requirement: Lesson reaction footer
The learn player SHALL show a one-tap reaction bar and a view count in the reading card foot,
so a finished reader has a lowest-friction way to react to the lesson itself.

#### Scenario: React to the lesson
- **WHEN** the reader finishes a readable lesson
- **THEN** a reaction bar with a view count is shown in the reading card foot
- **WHEN** the learner picks a reaction
- **THEN** the reaction reflects immediately and persists on the next visit

#### Scenario: Toggle the reaction off
- **WHEN** the learner picks the reaction they already selected
- **THEN** the reaction is removed
