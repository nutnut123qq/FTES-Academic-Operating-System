# ai-job-tools-ui

## ADDED Requirements

### Requirement: Job Accepted envelope treated as success
The system SHALL treat backend envelope code 1002 ("Accepted", data = JobRef) as success in `restRequest`, alongside 200, so async job submissions no longer throw on a successful accept.

#### Scenario: Submitting a summary job succeeds
- **WHEN** `POST /ai/learning/summary` answers `{code: 1002, message: "Accepted", data: {jobId, status}}`
- **THEN** the caller receives the JobRef instead of a thrown RestError

#### Scenario: Real errors still throw
- **WHEN** an envelope carries any code other than 200 or 1002
- **THEN** `restRequest` throws a RestError exactly as before

### Requirement: Shared job polling
The system SHALL poll `GET /ai/jobs/{id}` via a shared hook every ~2.5s while the job is PENDING/RUNNING, stop on COMPLETED/FAILED, and expose a stale flag after 90s for a retry affordance.

#### Scenario: Polling stops at completion
- **WHEN** a polled job reaches COMPLETED
- **THEN** polling stops and the parsed result is exposed to the page

### Requirement: Four standalone job tool pages
The system SHALL provide `/ai/tools/summary`, `/ai/tools/flashcards`, `/ai/tools/quiz`, `/ai/tools/debug` pages that accept text (or a picked enrolled lesson for the learning tools; code + language for debug), submit the matching job endpoint, poll, and render results per type: summary (tldr + key points + glossary), flashcards (flippable cards), quiz (answerable locally with explanations after choosing), debug (markdown review output); FAILED jobs and quota rejections render distinct error states with retry.

#### Scenario: Flashcards end-to-end
- **WHEN** a user pastes study text, requests 10 cards and the job completes
- **THEN** 10 flippable cards render front/back from the job result

#### Scenario: Quiz answers grade locally
- **WHEN** a user picks an option on a generated question
- **THEN** correctness against `correct` and the `explanation` display without any further BE call

#### Scenario: Quota exhausted
- **WHEN** a submit returns the quota-exceeded error
- **THEN** the page shows a quota-specific message (not a generic failure) and no polling starts
