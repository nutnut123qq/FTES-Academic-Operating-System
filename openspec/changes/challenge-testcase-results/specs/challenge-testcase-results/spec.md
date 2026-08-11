# challenge-testcase-results

## ADDED Requirements

### Requirement: Per-test-case results are shown to the learner
The submission result view SHALL render the per-test-case results returned by the backend, showing
each case's name, verdict, execution time, and awarded score, whenever the submission has such
results. A submission graded by test cases SHALL NOT be presented as having no result merely because
it carries no AI feedback.

#### Scenario: Test-case graded submission
- **WHEN** a learner opens the result of a submission that was graded by test cases
- **THEN** the per-case results SHALL be listed with a pass or fail state
- **AND** the view SHALL NOT show an empty state

#### Scenario: Both test cases and AI feedback present
- **WHEN** a submission has both per-case results and AI feedback
- **THEN** both the per-case results and the AI feedback SHALL be shown

### Requirement: Verdicts are distinguishable
Each result row SHALL show the backend verdict distinctly, so a wrong answer, a time-limit
exceedance, a memory-limit exceedance, a runtime error, a compile error, and a skipped case are
visually and textually different from one another.

#### Scenario: Code that never terminates
- **WHEN** a learner's code exceeds the time limit on a case
- **THEN** that case SHALL be labelled as exceeding the time limit rather than as a wrong answer

#### Scenario: Code that fails to compile
- **WHEN** the submission does not compile
- **THEN** the results SHALL indicate a compile error

### Requirement: Hidden test cases stay hidden
For a hidden test case the view SHALL show only its name, verdict, timing, and score. It SHALL NOT
render the case's input, expected output, or the program's captured output, even if such fields were
present in the response.

#### Scenario: Hidden case result
- **WHEN** a hidden case result is rendered
- **THEN** no input, expected output, or captured output SHALL appear for that case

### Requirement: Aborted grading is explained
When a grading run stopped early and left cases unexecuted, the view SHALL summarise how many cases
passed out of the total and SHALL tell the learner that the run stopped early, so an incomplete run
is not mistaken for failures.

#### Scenario: Run aborted after repeated timeouts
- **WHEN** results include skipped cases because the run was stopped early
- **THEN** the summary SHALL state that grading stopped early
- **AND** the skipped cases SHALL be shown as skipped rather than failed
