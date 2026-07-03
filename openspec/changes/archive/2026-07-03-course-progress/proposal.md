## Why
§4 course progress + certificate. Ship the completion view.

## What Changes
- Add route /courses/[courseId]/progress: progress bar + completion summary + certificate stub.
- Mock `useQueryCourseProgressSwr`; i18n `courseSystem.progress.*` (vi/en).

## Capabilities
### New Capabilities
- `course-progress`: progress + certificate stub.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
