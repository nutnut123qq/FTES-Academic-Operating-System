# learn-content-overview

## ADDED Requirements

### Requirement: About section sits directly below the unlock card, above Continue learning
The /learn/content overview main column SHALL order its sibling blocks as: course header (title + meta chips), then the trial/unlock lock card, then the "About this course" section, then the "Continue learning" block (with overall progress), then the leaderboard nudges, then the mobile tools rail. The "About this course" section SHALL be rendered immediately after the trial/unlock lock card and before the "Continue learning" block.

#### Scenario: Non-purchaser sees About right under the unlock card
- **WHEN** a signed-in learner who does not yet have full access opens the /learn/content overview of a course that has a description
- **THEN** the trial/unlock lock card renders directly below the course header
- **AND** the "About this course" section renders directly below the trial/unlock lock card
- **AND** the "Continue learning" block renders after the "About this course" section

#### Scenario: Ordering conditions are preserved, not changed
- **WHEN** a learner who already has full access opens the overview
- **THEN** the trial/unlock lock card is not shown (its `access !== undefined && !hasFullAccess` condition is unchanged)
- **AND** the "About this course" section still renders only when the course has a description, now appearing above the "Continue learning" block
- **AND** the "Continue learning" block and its overall-progress meter render after the "About this course" section
