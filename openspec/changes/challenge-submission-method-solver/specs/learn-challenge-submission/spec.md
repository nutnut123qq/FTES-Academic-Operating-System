# learn-challenge-submission

## ADDED Requirements

### Requirement: CODE challenge with a submissionMethod is solved via a github/file solver
The challenge type FE model (`ChallengeView`) SHALL carry an optional
`submissionMethod` (`"GITHUB" | "FILE" | "BOTH" | null`), additive so older backends
that omit it do not break. On the dedicated challenge solve page (`ChallengeSubmission`),
for the `code` solver kind, when the loaded challenge carries a real `submissionMethod`
(one of `GITHUB` / `FILE` / `BOTH`), the page SHALL render a github-URL + file-upload
solver (ported from the lesson assignment card) instead of the inline `GradeCodePanel`
editor. When `submissionMethod` is null/absent/unrecognized, the page SHALL keep the
existing `GradeCodePanel` inline editor exactly as today. The solver SHALL honor the
method: `GITHUB` shows only the repo-URL form, `FILE` shows only the file-upload form,
`BOTH` shows both behind a method tab. The learner's submission history and attempt
count SHALL stay owned by `ChallengeSubmission` (loaded via `getMyChallengeSubmissions`),
which the solver revalidates after a successful submit.

#### Scenario: A CODE challenge with a submissionMethod renders the github/file solver
- **WHEN** the solve page loads a `CODE` challenge whose `submissionMethod` is `GITHUB`, `FILE`, or `BOTH`
- **THEN** it renders the github-URL + file-upload solver
- **AND** it does NOT render the inline `GradeCodePanel` code editor

#### Scenario: A CODE challenge without a submissionMethod keeps the inline editor
- **WHEN** the solve page loads a `CODE` challenge whose `submissionMethod` is null / absent / unrecognized
- **THEN** it renders the inline `GradeCodePanel` editor exactly as before

#### Scenario: The method decides which forms show
- **WHEN** `submissionMethod` is `GITHUB` → only the repo-URL form renders
- **WHEN** `submissionMethod` is `FILE` → only the file-upload form renders
- **WHEN** `submissionMethod` is `BOTH` → both forms render behind a method tab

### Requirement: Challenge URL and FILE submissions post to the challenge submit endpoints
A github-URL submission on the challenge solver SHALL post through the existing
`usePostSubmitChallengeSwr` with `{ payloadType: "URL", url }` (URL client-gated by the
BE `^https://.+` pattern — a non-https URL SHALL NOT fire the request). A file
submission SHALL post through a new `usePostSubmitChallengeFileSwr` calling
`submitChallengeFile(id, file)` — a multipart `POST /api/v1/challenges/{id}/submissions/file`
(part named `file`, browser-set multipart boundary), mirroring the assignment
`submitAssignmentFile` request shape. When the challenge's `gradingConfig` carries a
`fileExtension` whitelist, the file form SHALL apply the same client-side extension
validation the assignment card uses (accept attribute + wrong-type guard); an
absent/unparseable config SHALL mean no restriction, never an error. Both submits SHALL
be blocked once the attempt cap (`maxSubmissions`) is reached.

#### Scenario: URL submit posts payloadType URL
- **WHEN** the learner submits a valid `https://` repo URL on the challenge solver
- **THEN** the request posts `{ payloadType: "URL", url }` via the challenge submit hook

#### Scenario: A non-https URL never fires
- **WHEN** the learner submits a URL that does not start with `https://`
- **THEN** no submit request is fired and an inline validation message shows

#### Scenario: File submit posts multipart to the challenge file endpoint
- **WHEN** the learner uploads an accepted file and submits
- **THEN** the request is a multipart `POST /api/v1/challenges/{id}/submissions/file` with the file part named `file`

#### Scenario: A wrong-type file is rejected client-side
- **WHEN** the challenge's `gradingConfig.fileExtension` whitelists specific extensions and the picked file is outside it
- **THEN** the file is rejected client-side with a wrong-type message and no request fires

### Requirement: The inline assignment surface is preserved in this phase
This change SHALL be additive only: it SHALL NOT remove the inline
`LessonAssignmentBlock` nor its `useGetLessonAssignmentsSwr` gate, so lessons whose
assignments have not yet been migrated to CODE challenges keep working. The shared
submission-method helpers MAY be extracted to a common module consumed by both the
assignment block and the challenge solver, provided the assignment block's behavior,
forms, and gate are unchanged.

#### Scenario: The lesson assignment block still renders its own submission surface
- **WHEN** a lesson still carries un-migrated assignments
- **THEN** `LessonAssignmentBlock` still loads them via `useGetLessonAssignmentsSwr` and renders its github/file forms unchanged
