# ai-planner-ui

## ADDED Requirements

### Requirement: Study plan creation form
The system SHALL provide `/ai/tools/planner` with a creation form (goal required, deadlineDays 7–180, hoursPerWeek, currentLevel, known/target topic chips, optional model picker) posting to `POST /ai/learning/study-plan` with a long request timeout, and SHALL land on the returned plan view.

#### Scenario: Create a plan
- **WHEN** a user submits a goal with defaults
- **THEN** a loading state shows during generation and the resulting weekly plan renders on success

### Requirement: Weekly timeline with progress check-off
The system SHALL render a plan as a vertical week timeline (focus + milestone + task checklist per week) where checking a task calls `PATCH /study-plans/{id}/progress` with `taskKey = "w{week}:{index}"` optimistically (rolled back on error) and an overall progress bar reflects the BE `percentDone`.

#### Scenario: Check off a task
- **WHEN** a user checks the first task of week 2
- **THEN** the checkbox updates immediately, the PATCH carries `{taskKey: "w2:0", done: true}` and the progress bar updates from the response

#### Scenario: PATCH failure rolls back
- **WHEN** the progress PATCH fails
- **THEN** the checkbox reverts and an error toast shows

### Requirement: Plan list and archive
The system SHALL list the caller's active plans (empty state goes straight to the form) and allow archiving a plan behind a confirm, removing it from the list.

#### Scenario: Seeded demo plan visible
- **WHEN** the seeded test user opens the planner
- **THEN** the demo plan from the BE seed migration appears with its checked task reflected
