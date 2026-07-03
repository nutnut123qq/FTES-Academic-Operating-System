## Why
§5 resource detail. Ship the resource view (preview + meta + comments).

## What Changes
- Add route /resources/[resourceId]: preview placeholder + meta + rating + download + comments.
- Mock `useQueryResourceDetailSwr`; i18n `resourceHub.detail.*` (vi/en).

## Capabilities
### New Capabilities
- `resource-detail`: resource view with comments.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
