## Why

Two gaps surfaced when reviewing `profile-feature-complete`:

1. The "Edit profile" button in the identity sidebar navigated to `/profile/edit`, which did not exist → 404. An edit-profile form hook (`useEditProfileForm`) and its full `profileEdit.*` i18n already existed (a stripped page), but no route rendered them.
2. On the Progress tab, the FTES Coin and Reputation metric cards were nested inside the gamification `AsyncContent` gate, so they were hidden whenever the gamification fetch was loading, empty, or failed — even though their data comes from independent hooks (wallet, community summary).

## What Changes

- Add the `/profile/edit` page, rendering the existing `useEditProfileForm` (real `updateProfile` GraphQL + avatar presigned-upload flow) with avatar, display name, bio, role/title, location, work mode, LinkedIn, website, and the open-to-work / lock-profile toggles. Reuses existing i18n; no new keys.
- Move the FTES Coin + Reputation metric row out of the gamification `AsyncContent` in the Progress tab so it renders from its own hooks regardless of gamification state; the XP/rank/heatmap/badges/skill-graph dashboard stays gated as before.

## Capabilities

### New Capabilities
- `profile-edit`: Edit-profile form surface at `/profile/edit`.

### Modified Capabilities
- `profile-progress-wallet`: FTES Coin + Reputation render independent of the gamification load state.

## Impact

- Adds `src/app/[locale]/profile/edit/page.tsx`.
- Edits `src/components/features/profile/ProfileProgress/index.tsx` (structural move only).
- Reuses `useEditProfileForm`; no new i18n keys, no new dependencies, no backend changes.
- FE-only: without a signed-in user + backend the edit fields seed empty and Save cannot persist.
