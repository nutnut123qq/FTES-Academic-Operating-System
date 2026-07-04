# course-enrollment-intent Specification

## Purpose
TBD - created by archiving change add-course-purchase-plans. Update Purpose after archive.
## Requirements
### Requirement: Shared enrollment intent hook
The system SHALL expose a feature hook that centralizes the three enrollment-related actions for a course detail page: enroll, continue learning, and try learning.

#### Scenario: Hook provides enroll intent
- **WHEN** a learner is viewing a course detail page
- **THEN** the hook returns an `onEnroll` callback that routes the learner to the course enrollment flow

#### Scenario: Hook provides continue-learning intent
- **WHEN** the learner is already enrolled in the course
- **THEN** the hook returns an `onContinueLearning` callback that routes the learner into the course content

#### Scenario: Hook provides try-learning intent
- **WHEN** the learner presses "Học thử miễn phí"
- **THEN** the hook best-effort calls the `startTrial` mutation for the current course
- **AND** the hook routes the learner into the course content regardless of mutation success or failure

#### Scenario: Hook derives enrolled state from the course detail contract
- **WHEN** the `CourseDetail` contract includes `enrollment.isEnrolled`
- **THEN** the hook reports `isEnrolled = true` when `enrollment.isEnrolled` is true
- **AND** the hook reports `isEnrolled = false` when the field is absent or false

