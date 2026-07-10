## ADDED Requirements

### Requirement: Reader lock reflects real entitlement
The lesson reader SHALL determine whether a lesson is locked from the reliable per-viewer
entitlement carried on the course curriculum, not from a lesson-content request that may fail
with an unauthorized error. An unentitled viewer SHALL see the paywall, never a blank "empty"
reading area.

#### Scenario: Unentitled viewer sees the paywall, not emptiness
- **WHEN** a viewer without entitlement opens a premium lesson and the lesson-content request is unauthorized
- **THEN** the reader shows the locked paywall (enroll CTA), not an empty-content invitation

#### Scenario: Entitled viewer reads normally
- **WHEN** an entitled viewer opens the same lesson
- **THEN** the lesson is not locked and its content (and video, when present) renders
