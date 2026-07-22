## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, and `resource`. The backend gamification domain in `vn.ftes.aos.gamification.web` exposes two REST controllers:

- `GamificationController` — `/api/v1/gamification/**` (user-scoped reads and writes).
- `GamificationAdminController` — `/api/v1/gamification/admin/**` (admin configuration).

The frontend already has GraphQL operations that overlap with several user gamification reads/writes: `userXp`, `userAchievements`, `globalLeaderboard`, `myLeague`, `rewards`, `myRewardWallet`, `myKpis`, `buyStreakFreeze`, `redeemReward`, and `setWeeklyGoal`. Those GraphQL operations are the preferred data layer for their use cases, so the corresponding REST reads/writes are skipped. The remaining user REST surface and the entire admin REST surface get typed REST clients.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/gamification/` for gamification endpoints not covered by GraphQL.
- Add SWR mutation wrappers for every writing REST endpoint we expose.
- Add SWR query wrappers for read endpoints we expose.
- Update `src/modules/api/rest/index.ts` to re-export `./gamification`.
- Document skipped endpoints and the GraphQL operations that cover them.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add REST clients for user gamification reads/writes already covered by GraphQL.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping. Gamification needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/gamification/`
**Rationale:** Mirrors the backend package `gamification.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Skip GraphQL-covered user endpoints
**Rationale:** Avoid duplicate data layers and conflicting cache semantics. Skipped:
- `GET /api/v1/gamification/me/progression` → `userXp` / `userAchievements` GraphQL covers the profile score/achievement surface.
- `GET /api/v1/gamification/me/xp-history` → kept; GraphQL has no equivalent ledger query.
- `GET /api/v1/gamification/me/streak` → kept; GraphQL `myWeeklyStats` exposes streak metadata but not the same freeze-aware streak view.
- `POST /api/v1/gamification/me/streak/freeze` → kept; this consumes an owned freeze, distinct from `buyStreakFreeze`.
- `GET /api/v1/gamification/me/goals` → kept; GraphQL `myKpis` is a different weekly-KPI shape.
- `PUT /api/v1/gamification/me/goals` → kept; generic goal upsert, distinct from `setWeeklyGoal`.
- `GET /api/v1/gamification/me/badges` → kept; GraphQL `userAchievements` returns achievement records, not user badge awards.
- `GET /api/v1/gamification/users/{userId}/summary` → kept; no GraphQL equivalent.
- `GET /api/v1/gamification/leaderboard` → kept; supports scope/season filters beyond `globalLeaderboard`/`myLeague`.
- `GET /api/v1/gamification/rewards/pools` → skipped; `rewards` / `myRewardWallet` GraphQL covers the reward catalog/wallet.
- `POST /api/v1/gamification/rewards/pools/{code}/claim` → kept; pool-code claim with idempotency, distinct from `redeemReward`.
- `GET /api/v1/gamification/me/mastery` → kept; no GraphQL equivalent.
- `GET /api/v1/gamification/me/mastery/{subjectId}` → kept; no GraphQL equivalent.

### 4. Expose all admin endpoints via REST
**Rationale:** No GraphQL operations exist for admin gamification configuration. All `GamificationAdminController` endpoints are implemented.

### 5. Read endpoints get SWR query hooks
**Rationale:** `getMyXpHistory`, `getMyStreak`, `getMyGoals`, `getMyBadges`, `getUserGamificationSummary`, `getGamificationLeaderboard`, `getMyMastery`, `getMyMasteryForSubject`, and all admin list/get endpoints are reads with no GraphQL equivalent. They get `useGet*Swr` query hooks.

### 6. Types inferred from `GamificationViews.java` and admin inline records
**Rationale:** These records are the backend source of truth. We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps, and `number` for `BigDecimal` probabilities. Colliding names (`PageView`, `LeaderboardEntry`, `LeaderboardView`) are prefixed with `Gamification` to avoid barrel collisions.

## Risks / Trade-offs

- **[Risk]** Skipping `GET /rewards/pools` assumes components that need pool codes for `claimRewardPool` will obtain them from backend-configured UI constants or from the existing GraphQL reward catalog. If the pool catalog is needed at runtime, the REST pool list may need to be added later.
- **[Risk]** `GamificationAdminController` endpoints require `gamification.admin.manage`; the REST module exposes them without permission checks. Callers must ensure admin UIs hold the appropriate permissions.
- **[Trade-off]** Several user reads are exposed via REST even though partial data exists in GraphQL (streak, goals, badges, leaderboard). This gives feature teams flexibility to choose the exact backend view without over-fetching, at the cost of a slightly larger API surface.

## Affected Files / Modules

- `src/modules/api/rest/gamification/types.ts`
- `src/modules/api/rest/gamification/gamification.ts`
- `src/modules/api/rest/gamification/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
