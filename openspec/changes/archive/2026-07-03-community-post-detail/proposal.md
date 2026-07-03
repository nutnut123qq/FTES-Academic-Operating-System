## Why
§6 post detail. Ship the post view with a comments thread.

## What Changes
- Add route /community/[postId]: post (author/title/body/likes) + comments thread.
- Mock `useQueryPostDetailSwr`; i18n `communityHub.detail.*` (vi/en).

## Capabilities
### New Capabilities
- `community-post-detail`: post view + comments.
### Modified Capabilities
- (none)

## Impact
FE only. No BE. Build stays green. Note: renders under the /community shell (scope tabs above).
