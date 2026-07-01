## Why
§6 moderation queue. Ship the report-review scaffold.

## What Changes
- Add route /community/moderation: reported items + keep/remove actions.
- Mock `useQueryReportsSwr`; i18n `communityHub.moderation.*` (vi/en).

## Capabilities
### New Capabilities
- `community-moderation`: moderation queue.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
