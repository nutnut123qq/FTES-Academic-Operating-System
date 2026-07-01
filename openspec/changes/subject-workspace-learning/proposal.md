## Why
The Learning tab (§4 in the §3 workspace) was a placeholder. Ship real on-canon content (FE-only, mock).

## What Changes
- Replace learning placeholder with an overall progress bar + Section->Lesson list with done state.
- Mock `useQuerySubjectLearningSwr`; i18n `subjects.learning.*` (vi/en).

## Capabilities
### New Capabilities
- `subject-learning-tab`: sectioned lesson list + progress for a subject.
### Modified Capabilities
- (none)

## Impact
FE only: `features/subject/SubjectLearning`, hook, learning page, i18n. No BE. Build stays green.
