## Why
§4 assignments list. Ship the assignment tracker scaffold.

## What Changes
- Add route /courses/[courseId]/assignments: assignment rows + due + status chip.
- Mock `useQueryAssignmentsSwr`; i18n `courseSystem.assignments.*` (vi/en).

## Capabilities
### New Capabilities
- `course-assignments`: assignment list with status.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
