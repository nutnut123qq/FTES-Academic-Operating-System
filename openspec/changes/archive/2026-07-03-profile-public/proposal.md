## Why
A public read-only profile view (§2) so logged-out visitors / recruiters can view a user.

## What Changes
- Add route /u/[username] (standalone, NOT under owner profile shell) rendering a read-only profile.
- Mock `useQueryPublicProfileSwr`; i18n `profile.public.*` (vi/en).

## Capabilities
### New Capabilities
- `profile-public-view`: read-only public profile.
### Modified Capabilities
- (none)

## Impact
FE only. New /u/[username] route. No BE. Build stays green.
