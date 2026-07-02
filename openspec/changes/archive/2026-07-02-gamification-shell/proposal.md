## Why

§11 Gamification had no surface — there was no way to see XP/level/streak
progression or how you rank against peers. This ships the leaderboard +
progression dashboard as a real 200 route at `/leaderboard`, FE-only (mock data)
until the gamification BE contract lands.

## What Changes

- Add `features/gamification/LeaderboardShell` + `[locale]/leaderboard/page.tsx`:
  a dashboard with top stat cards (XP · Level · Streak · Rank), a ranked
  leaderboard list (current user highlighted), and a badges row (earned vs locked).
- Add `useQueryLeaderboardSwr` (mock `me` snapshot + `board` list + `badges` list),
  SWR-shaped for a drop-in BE swap.
- Add `gamification.*` i18n (vi/en).

## Capabilities

### New Capabilities
- `gamification-shell`: the leaderboard + progression dashboard at `/leaderboard`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/gamification/LeaderboardShell`, `leaderboard/page.tsx`,
  `useQueryLeaderboardSwr`; new `gamification.*` i18n. No BE (mock). No shared-file
  edits (nav/path builder wiring deferred).
