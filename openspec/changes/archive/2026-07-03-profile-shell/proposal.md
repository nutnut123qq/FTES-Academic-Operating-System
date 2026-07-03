## Why
§2 Academic Profile was deleted in the strip -> greenfield. Ship the profile shell (2-column) so sections can hang off it.

## What Changes
- Add route /[locale]/profile + layout (2-column identity + section tabs) + section placeholder pages.
- Sections: personal (root) / academic / portfolio / community / progress (placeholders; filled by later changes).
- Mock `useQueryProfileSwr`; i18n `profile.*` (vi/en).

## Capabilities
### New Capabilities
- `profile-shell`: 2-column profile shell + section navigation.
### Modified Capabilities
- (none)

## Impact
FE only. New /profile route tree. No BE. Build stays green.
