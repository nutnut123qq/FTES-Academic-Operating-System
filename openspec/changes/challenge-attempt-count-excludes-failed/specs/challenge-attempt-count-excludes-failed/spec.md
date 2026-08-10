# challenge-attempt-count-excludes-failed

## ADDED Requirements

### Requirement: Attempt counters MUST exclude FAILED submissions
The challenge submit surface SHALL count only submissions whose status is not `FAILED` when it
computes attempts used, both for the `used/max` chip driving `reachedMax` and for the heavy
project-grade counter. A `FAILED` attempt is a SYSTEM failure (grading exhausted its retries and went
to the DLQ, leaving no score and no feedback) and the backend already excludes it with
`status <> 'FAILED'` in both of its counting queries, so counting it in the UI locks a learner out of
attempts the backend would still accept.

#### Scenario: A failed attempt does not consume an attempt
- **WHEN** a learner has one SCORED and one FAILED submission on a challenge with `maxSubmissions` 10
- **THEN** the surface shows 1 attempt used, not 2
- **AND** the submit controls stay enabled
