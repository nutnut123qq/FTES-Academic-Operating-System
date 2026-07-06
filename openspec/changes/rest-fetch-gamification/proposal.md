## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, and `resource`. The gamification domain exposes two REST controllers in `vn.ftes.aos.gamification.web` — `GamificationController` for user-facing operations and `GamificationAdminController` for admin configuration — but the frontend currently has no typed REST layer for them. Several user reads and writes (XP breakdown, achievements, leaderboards, reward wallet, KPIs, streak-freeze purchase, reward redemption, weekly goal) are already covered by existing GraphQL operations; this change focuses on the gamification REST surface that GraphQL does not serve, plus the full admin configuration surface.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client under `src/modules/api/rest/gamification/` covering:
  - `GamificationController` — progression, XP history, streak, goals, badges, summary, leaderboard, mastery, reward-pool claim.
  - `GamificationAdminController` — XP rules, seasons, reward pools/items, audited XP adjustment.
- Add `usePost*Swr` mutation hooks for every writing REST endpoint we expose.
- Add `useGet*Swr` query hooks for read endpoints without GraphQL coverage.
- Update `src/modules/api/rest/index.ts` to re-export `./gamification`.
- Explicitly document user endpoints already covered by GraphQL and skip their REST clients.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-gamification`: REST client + SWR wrappers for the gamification controller cluster, deduplicated against existing GraphQL.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/gamification/` and `src/hooks/swr/api/rest/mutations/` (plus query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
