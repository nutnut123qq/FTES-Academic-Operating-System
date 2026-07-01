## Why
§6 community feed. Fill the For You feed with post rows.

## What Changes
- Replace /community placeholder with a post-list feed (author/time/title/snippet/likes/comments) linking to detail.
- Mock `useQueryCommunityFeedSwr`; i18n `communityHub.feed.*` (vi/en).

## Capabilities
### New Capabilities
- `community-feed`: post-list feed.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green.
