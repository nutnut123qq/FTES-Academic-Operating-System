## Why
§5 resource rating + reviews. Ship an interactive rating + review list.

## What Changes
- Add route /resources/[resourceId]/reviews: star rating composer + review list.
- Mock `useQueryReviewsSwr`; i18n `resourceHub.reviews.*` (vi/en).

## Capabilities
### New Capabilities
- `resource-rating`: rating + reviews.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
