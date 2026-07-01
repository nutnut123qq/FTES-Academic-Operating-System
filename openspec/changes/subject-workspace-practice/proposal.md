## Why
The Practice tab (§10/§11 in the §3 workspace) was a placeholder. Ship real on-canon content (FE-only, mock).

## What Changes
- Replace practice placeholder with a 4-module card grid (quiz/flashcards/coding/leaderboard) + Open CTA.
- Mock `useQuerySubjectPracticeSwr`; i18n `subjects.practice.*` (vi/en).

## Capabilities
### New Capabilities
- `subject-practice-tab`: practice module hub for a subject.
### Modified Capabilities
- (none)

## Impact
FE only: `features/subject/SubjectPractice`, hook, practice page, i18n. No BE. Build stays green.
