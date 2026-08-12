# challenge-samples-and-limits

## ADDED Requirements

### Requirement: Many test-case results are grouped rather than listed in full
The result view SHALL show sample cases individually and SHALL collapse hidden cases into a single
summary row stating how many passed, expandable to reveal each hidden case's verdict. Input,
expected output and captured output of hidden cases SHALL remain unavailable.

#### Scenario: Submission graded by a hundred cases
- **WHEN** a learner opens the result of a submission with many hidden cases
- **THEN** the hidden cases SHALL be summarised as one row rather than listed
- **AND** expanding it SHALL show each hidden case's verdict only

#### Scenario: Sample cases stay detailed
- **WHEN** the challenge has sample cases
- **THEN** those SHALL be shown individually

### Requirement: The challenge resource limits are visible
The problem view SHALL display the time and memory limits reported for the challenge, so a learner
knows the budget their solution must fit.

#### Scenario: Limits reported
- **WHEN** the backend reports a time and memory limit
- **THEN** both SHALL be shown with the problem statement

#### Scenario: No limits reported
- **WHEN** the backend reports no limits
- **THEN** no limit line SHALL be rendered

### Requirement: Remaining AI feedback attempts are shown
Where a learner can request AI feedback, the view SHALL show how many attempts remain and SHALL make
clear that the AI only comments while the score comes from the test cases. When none remain the
action SHALL be disabled with that reason.

#### Scenario: Attempts remaining
- **WHEN** a learner has attempts left
- **THEN** the remaining count SHALL be shown

#### Scenario: No attempts left
- **WHEN** the allowance is exhausted
- **THEN** the AI feedback action SHALL be disabled and explained
- **AND** submitting SHALL remain possible
