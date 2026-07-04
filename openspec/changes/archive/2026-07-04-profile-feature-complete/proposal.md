## Why

The profile page was redesigned in change `profile-redesign` but still lacks several §2 Academic Profile requirements: cover image, avatar image, structured contact info, resume/CV, certificates, achievements, followers/following, activity timeline, FTES Coin display, and proper placement of reputation in Progress. This change completes the profile feature surface against the FTES spec while remaining FE-only (mocked data).

## What Changes

- **Personal / identity sidebar**: add cover banner, render uploaded avatar image with initials fallback, and add a dedicated Contact card in the Personal tab.
- **Portfolio tab**: add Resume/CV view+download, Certificates list, Achievements wall, and a pinned-project style grid for projects.
- **Community tab**: add Followers/Following counts+list and an Activity Timeline section, while moving the reputation metric display to the Progress tab per spec.
- **Progress tab**: add FTES Coin and Reputation metric cards at the top; keep the existing XP/level, rank/league, streak heatmap, badges, and skill graph.
- **Shared infrastructure**: extend existing SWR hooks with typed mock shapes, add new profile-specific block components where needed, and localize all new strings in `vi.json`/`en.json`.

## Capabilities

### New Capabilities
- `profile-identity-hero`: Cover image + avatar image + rank/badge framing for the profile identity sidebar.
- `profile-contact-card`: Structured contact display (email/phone/address) inside the Personal tab.
- `profile-portfolio-resume`: Resume/CV document card with view/download actions in Portfolio.
- `profile-portfolio-certificates`: Certificate list card in Portfolio.
- `profile-portfolio-achievements`: Achievement badge wall in Portfolio.
- `profile-community-followers`: Followers/Following counts and list in Community.
- `profile-community-activity`: Activity Timeline section in Community.
- `profile-progress-wallet`: FTES Coin + Reputation metric display in Progress.

### Modified Capabilities
- `profile-visual-identity`: Extend the visual shell to include cover and avatar images; keep existing layout decisions.
- `profile-gamification-dashboard`: Move/add reputation display; add wallet snapshot row.

## Impact

- Affects all components under `src/components/features/profile/*` and their SWR hooks.
- Adds/updates i18n keys in `src/messages/vi.json` and `src/messages/en.json`.
- Reuses existing blocks (`AsyncContent`, `EmptyContent`, `LabeledCard`, `MetricCard`, `Skeleton`) and existing features (`ActivityTimeline`, `useQueryWalletSwr`).
- No new dependencies; no backend API changes.
