## Why
§4/§13 enroll page. Ship the enroll/checkout summary scaffold.

## What Changes
- Add route /courses/[courseId]/enroll: order summary + enroll CTA.
- Mock `useQueryEnrollSummarySwr`; i18n `courseSystem.enroll.*` (vi/en).

## Capabilities
### New Capabilities
- `course-enroll`: enroll/checkout summary.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
