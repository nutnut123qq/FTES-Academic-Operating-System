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

### Requirement: The project-grade cap MUST key off full course access, not the purchase flag
The submit surface SHALL decide whether the tight project-grade cap applies by reading `fullAccess`
from the caller's course access state, NOT `purchased`. The backend gates this cap with
`hasEntitledLessonAccess`, which grants full access for a paid entitlement OR an active LEGACY
enrollment, whereas `purchased` is true only when an ACTIVE `package_purchases` row exists. A learner
on a LEGACY course therefore reports `purchased: false` while the backend still accepts their
submissions, and keying the cap on `purchased` locks them out of attempts they are entitled to.

#### Scenario: LEGACY-course learner is not capped at 2
- **WHEN** a learner whose access comes from an active LEGACY enrollment (no `package_purchases` row)
  opens a project challenge on that course
- **THEN** the cap shown and enforced client-side is the mentor's `maxSubmissions`, not 2
- **AND** the submit controls stay enabled while attempts remain
