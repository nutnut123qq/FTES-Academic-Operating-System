## Why
§4/§10 quiz page. Ship an interactive quiz scaffold with local scoring.

## What Changes
- Add route /courses/[courseId]/quiz: question list + selectable options + submit that scores locally.
- Mock `useQueryQuizSwr`; i18n `courseSystem.quiz.*` (vi/en).

## Capabilities
### New Capabilities
- `course-quiz`: interactive quiz scaffold.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
