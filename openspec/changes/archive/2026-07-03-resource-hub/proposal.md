## Why
§5 Resource Hub has no FE. Ship the global resource list/discovery.

## What Changes
- Add route /resources: text search + type filter + resource list rows.
- Mock `useQueryResourceHubSwr`; i18n `resourceHub.*` (vi/en).

## Capabilities
### New Capabilities
- `resource-hub`: searchable/filterable global resource list.
### Modified Capabilities
- (none)

## Impact
FE only. New /resources route. No BE. Build stays green.
