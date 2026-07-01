## Why
§7 group management. Ship join requests + rules + pinned sections.

## What Changes
- Add route /groups/[groupId]/manage: join requests (accept/reject) + rules + pinned.
- Mock `useQueryGroupManageSwr`; i18n `groupsHub.manage.*` (vi/en).

## Capabilities
### New Capabilities
- `group-management`: management panel.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
