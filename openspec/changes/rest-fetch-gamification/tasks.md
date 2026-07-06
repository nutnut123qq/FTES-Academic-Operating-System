## 1. Gamification REST types

- [ ] 1.1 Create `src/modules/api/rest/gamification/types.ts` with request/response interfaces inferred from backend `GamificationViews.java` and admin inline records. Rename colliding `PageView`, `LeaderboardEntry`, and `LeaderboardView` to `Gamification*`.

## 2. Gamification REST client

- [ ] 2.1 Create `src/modules/api/rest/gamification/gamification.ts` exporting REST functions for non-GraphQL endpoints in `GamificationController` and all endpoints in `GamificationAdminController`.
- [ ] 2.2 Create `src/modules/api/rest/gamification/index.ts` barrel re-exporting types and functions.
- [ ] 2.3 Update `src/modules/api/rest/index.ts` to add `export * from "./gamification"`.

### Endpoint mapping

**GraphQL-covered — BỎ QUA (ghi trong design.md):**
- `GET /api/v1/gamification/me/progression` → `userXp` / `userAchievements`
- `GET /api/v1/gamification/rewards/pools` → `rewards` / `myRewardWallet`

**REST-only — implement in `gamification.ts`: User**
- `getMyXpHistory`, `getMyStreak`, `useStreakFreeze`, `getMyGoals`, `putGoal`, `getMyBadges`, `getUserGamificationSummary`, `getGamificationLeaderboard`, `claimRewardPool`, `getMyMastery`, `getMyMasteryForSubject`

**REST-only — implement in `gamification.ts`: Admin**
- `listXpRules`, `upsertXpRule`, `listSeasons`, `createSeason`, `closeSeason`, `listRewardPools`, `upsertRewardPool`, `listRewardPoolItems`, `addRewardPoolItem`, `deleteRewardPoolItem`, `validateRewardPool`, `adjustXp`

## 3. SWR mutation wrappers

- [ ] 3.1 Create `usePostUseStreakFreezeSwr.ts`
- [ ] 3.2 Create `usePostPutGoalSwr.ts`
- [ ] 3.3 Create `usePostClaimRewardPoolSwr.ts`
- [ ] 3.4 Create `usePostUpsertXpRuleSwr.ts`
- [ ] 3.5 Create `usePostCreateSeasonSwr.ts`
- [ ] 3.6 Create `usePostCloseSeasonSwr.ts`
- [ ] 3.7 Create `usePostUpsertRewardPoolSwr.ts`
- [ ] 3.8 Create `usePostAddRewardPoolItemSwr.ts`
- [ ] 3.9 Create `usePostDeleteRewardPoolItemSwr.ts`
- [ ] 3.10 Create `usePostAdjustXpSwr.ts`
- [ ] 3.11 Update `src/hooks/swr/api/rest/mutations/index.ts` to re-export all new mutation hooks.

## 4. SWR query wrappers

- [ ] 4.1 Create `useGetMyXpHistorySwr.ts`
- [ ] 4.2 Create `useGetMyStreakSwr.ts`
- [ ] 4.3 Create `useGetMyGoalsSwr.ts`
- [ ] 4.4 Create `useGetMyBadgesSwr.ts`
- [ ] 4.5 Create `useGetUserGamificationSummarySwr.ts`
- [ ] 4.6 Create `useGetGamificationLeaderboardSwr.ts`
- [ ] 4.7 Create `useGetMyMasterySwr.ts`
- [ ] 4.8 Create `useGetMyMasteryForSubjectSwr.ts`
- [ ] 4.9 Create `useGetXpRulesSwr.ts`
- [ ] 4.10 Create `useGetSeasonsSwr.ts`
- [ ] 4.11 Create `useGetRewardPoolsSwr.ts`
- [ ] 4.12 Create `useGetRewardPoolItemsSwr.ts`
- [ ] 4.13 Create `useGetValidateRewardPoolSwr.ts`
- [ ] 4.14 Update `src/hooks/swr/api/rest/queries/index.ts` to re-export all new query hooks.

## 5. Verification

- [ ] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [ ] 5.2 Run `npm run build` (webpack) and ensure a green build.
