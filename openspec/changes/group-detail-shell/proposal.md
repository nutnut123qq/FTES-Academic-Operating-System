## Why
§7 group workspace shell. Ship the group detail shell (header + tabs).

## What Changes
- Add route /groups/[groupId] + layout (group header + feed/discussion/members/resources/events tabs) + tab placeholders.
- Mock `useQueryGroupSwr`; i18n `groupsHub.tabs.*` (vi/en).

## Capabilities
### New Capabilities
- `group-detail-shell`: group workspace shell.
### Modified Capabilities
- (none)

## Impact
FE only. New /groups/[groupId] tree. No BE. Build stays green.
