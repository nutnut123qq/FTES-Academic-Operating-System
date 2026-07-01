## Why
The Resources tab (§5 inside the §3 workspace) was a placeholder. Ship real on-canon content (FE-only, mock).

## What Changes
- Replace resources placeholder with a type filter + dense resource list + Collections section.
- Mock `useQuerySubjectResourcesSwr`; i18n `subjects.resources.*` (vi/en).

## Capabilities
### New Capabilities
- `subject-resources-tab`: filterable resource list + collections for a subject.
### Modified Capabilities
- (none)

## Impact
FE only: `features/subject/SubjectResources`, hook, resources page, i18n. No BE. Build stays green.
