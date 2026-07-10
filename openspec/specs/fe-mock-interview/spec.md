# fe-mock-interview Specification

## Purpose
TBD - created by archiving change fe-mock-interview. Update Purpose after archive.
## Requirements
### Requirement: Mock interview entry from the learn area
The FE SHALL expose a "Luyện phỏng vấn" entry in the course learn area that routes to
`/courses/{courseId}/learn/mock-interview`, since the learn area has no live sidebar nav.

#### Scenario: Learn landing shows the entry
- **WHEN** a learner views a course's learn landing page
- **THEN** a "Luyện phỏng vấn" card/link is shown that navigates to the mock-interview route

### Requirement: Green room draws a server-side session
The FE SHALL let the learner pick a tier (Sơ/Trung/Cao) and question count (3/5/10) and start a session,
calling `POST /ai/mock-interview/sessions`; the learner never picks the questions.

#### Scenario: Start a session
- **WHEN** an enrolled learner picks tier + count and presses start
- **THEN** the FE calls drawSession and shows the returned questions in the session view

#### Scenario: Not enrolled shows enroll CTA
- **WHEN** drawSession returns 403 `MOCK_INTERVIEW_FORBIDDEN`
- **THEN** the FE shows an "Đăng ký khóa học" call-to-action, not a raw error

### Requirement: Answer and one-shot grade
The FE SHALL show each drawn question with a text answer field, persist answers via
`POST /sessions/{id}/answers`, and on finish call `POST /sessions/{id}/grade`, then render the scorecard.

#### Scenario: Grade renders a scorecard
- **WHEN** the learner finishes answering and submits
- **THEN** the FE shows overallScore, verdict (PASS/BORDERLINE/FAIL), and per-question feedback

#### Scenario: Degraded scorecard fields hidden
- **WHEN** attributeScores/strengths/gaps/followUpQuestion are null (BE degraded)
- **THEN** the FE hides those sections instead of rendering empty blocks

### Requirement: Resume an in-progress session
The FE SHALL, on entry, look up an in-progress session via `GET /in-progress?courseRef=` and offer to
resume it when present (within 24h), syncing the transcript via `POST /sessions/{id}/turns`.

#### Scenario: Resume offered
- **WHEN** an in-progress session exists for the course within 24h
- **THEN** the FE offers to resume with the prior answers restored

### Requirement: History and stats
The FE SHALL show graded history via `GET /attempts?courseRef=` and progress stats via
`GET /stats?courseRef=`, each wrapped in AsyncContent with a mirrored skeleton and an empty state.

#### Scenario: History list newest-first
- **WHEN** the learner opens the history tab
- **THEN** graded attempts are listed newest-first with score + verdict

#### Scenario: Insufficient stats
- **WHEN** stats returns insufficientData=true
- **THEN** the FE shows an empty/insufficient-data state instead of zeroed bars

