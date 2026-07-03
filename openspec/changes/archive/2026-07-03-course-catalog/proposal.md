## Why
§4 Course System has no FE. Ship the catalog (list/discovery) first.

## What Changes
- Add route /courses with search + level filter + course card grid linking to /courses/[id].
- Mock `useQueryCoursesSwr`; i18n `courseSystem.*` (vi/en).

## Capabilities
### New Capabilities
- `course-catalog`: searchable/filterable course list.
### Modified Capabilities
- (none)

## Impact
FE only. New /courses route. No BE. Build stays green.
