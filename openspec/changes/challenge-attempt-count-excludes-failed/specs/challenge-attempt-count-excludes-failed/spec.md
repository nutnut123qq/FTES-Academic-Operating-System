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

### Requirement: The project-grade cap warns but MUST NOT disable the submit controls
The solver SHALL surface the project-grade cap as a hint or warning only, and SHALL NOT use it to
disable the github, file, or project submit controls, nor to return early from their handlers. The
backend applies this cap only to learners without a paid entitlement — a purchaser or an active
LEGACY enrollment is bounded by `maxSubmissions` alone — and the frontend cannot see entitlement
state, so a client-side lock would block learners the backend still accepts. The backend remains
authoritative and its `PROJECT_GRADE_LIMIT_REACHED` rejection SHALL be translated into a clear message.

#### Scenario: Entitled learner at the cap can still submit
- **WHEN** a learner with a paid entitlement has 2 non-FAILED project grades on the challenge
- **THEN** the submit controls remain enabled and the request reaches the backend, which accepts it

#### Scenario: Non-entitled learner at the cap sees the backend's rejection
- **WHEN** a learner without a paid entitlement submits past the cap
- **THEN** the backend rejects with `PROJECT_GRADE_LIMIT_REACHED`
- **AND** the surface shows the translated cap message instead of a generic error
