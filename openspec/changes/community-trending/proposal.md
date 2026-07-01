## Why
§6 trending. Fill the Trending scope with a ranked list.

## What Changes
- Replace /community/trending placeholder with a ranked post list (by likes) linking to detail.
- Mock `useQueryTrendingSwr`; reuses `communityHub.feed.likes`.

## Capabilities
### New Capabilities
- `community-trending`: ranked trending list.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
