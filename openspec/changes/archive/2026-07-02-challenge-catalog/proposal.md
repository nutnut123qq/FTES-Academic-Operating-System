## Why

`/challenges` was 404 — §10 Challenge (a coding/challenge catalog) had no list to
browse. This ships the catalog shell (FE-only mock), turning `/challenges` into a
real 200 route so the app shell and landing can link to a challenge domain.

## What Changes

- Add `features/challenge/ChallengeCatalog` + `[locale]/challenges/page.tsx`: text
  search + type filter + grid of challenge cards linking to `/challenges/${id}`.
  Mirrors the house catalog archetype (`SubjectCatalog`).
- Add `useQueryChallengesSwr` (mock list of ~6 challenges, SWR-shaped).
- Add `challengeSystem.*` i18n (vi/en) — catalog copy, type + difficulty labels,
  points/participants meta counts.

## Capabilities

### New Capabilities
- `challenge-catalog`: the challenge catalog at `/challenges`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/challenge/ChallengeCatalog`, `challenges/page.tsx`,
  `useQueryChallengesSwr`; i18n `challengeSystem.*`. No BE (mock). No shared-file edits.
