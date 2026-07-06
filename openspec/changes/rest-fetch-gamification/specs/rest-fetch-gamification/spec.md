## ADDED Requirements

### Requirement: Gamification REST client reuses the shared REST wrapper
The gamification REST client SHALL import `restRequest` from `src/modules/api/rest/client/` and SHALL NOT create its own axios instance or envelope handling.

#### Scenario: Get my progression
- **WHEN** `getMyProgression()` is called
- **THEN** it performs `GET /api/v1/gamification/me/progression` through `restRequest` and returns `ProgressionView`

#### Scenario: Get my XP history
- **WHEN** `getMyXpHistory(params)` is called
- **THEN** it performs `GET /api/v1/gamification/me/xp-history?page=&size=` and returns `GamificationPageView<XpEntryView>`

#### Scenario: Get my streak
- **WHEN** `getMyStreak()` is called
- **THEN** it performs `GET /api/v1/gamification/me/streak` and returns `StreakView`

#### Scenario: Use streak freeze
- **WHEN** `useStreakFreeze()` is called
- **THEN** it performs `POST /api/v1/gamification/me/streak/freeze` and resolves with `void`

#### Scenario: Get my goals
- **WHEN** `getMyGoals()` is called
- **THEN** it performs `GET /api/v1/gamification/me/goals` and returns `Array<GoalView>`

#### Scenario: Put my goal
- **WHEN** `putGoal(request)` is called
- **THEN** it performs `PUT /api/v1/gamification/me/goals` with `GoalUpdate` and returns `GoalView`

#### Scenario: Get my badges
- **WHEN** `getMyBadges()` is called
- **THEN** it performs `GET /api/v1/gamification/me/badges` and returns `Array<BadgeView>`

#### Scenario: Get user gamification summary
- **WHEN** `getUserGamificationSummary(userId)` is called
- **THEN** it performs `GET /api/v1/gamification/users/{userId}/summary` and returns `SummaryView`

#### Scenario: Get leaderboard
- **WHEN** `getGamificationLeaderboard(params)` is called
- **THEN** it performs `GET /api/v1/gamification/leaderboard?scope=&season=&limit=` and returns `GamificationLeaderboardView`

#### Scenario: Claim reward pool
- **WHEN** `claimRewardPool(code, request)` is called
- **THEN** it performs `POST /api/v1/gamification/rewards/pools/{code}/claim` with `ClaimRequest` and returns `ClaimResultView`

#### Scenario: Get my mastery
- **WHEN** `getMyMastery()` is called
- **THEN** it performs `GET /api/v1/gamification/me/mastery` and returns `Array<MasteryView>`

#### Scenario: Get my mastery for a subject
- **WHEN** `getMyMasteryForSubject(subjectId)` is called
- **THEN** it performs `GET /api/v1/gamification/me/mastery/{subjectId}` and returns `MasteryView`

### Requirement: Gamification admin endpoints are exposed via REST
The gamification REST client SHALL expose typed functions for all `GamificationAdminController` endpoints.

#### Scenario: List XP rules
- **WHEN** `listXpRules()` is called
- **THEN** it performs `GET /api/v1/gamification/admin/xp-rules` and returns `Array<XpRuleResponse>`

#### Scenario: Upsert XP rule
- **WHEN** `upsertXpRule(request)` is called
- **THEN** it performs `POST /api/v1/gamification/admin/xp-rules` with `XpRuleRequest` and returns `XpRuleResponse`

#### Scenario: List seasons
- **WHEN** `listSeasons()` is called
- **THEN** it performs `GET /api/v1/gamification/admin/seasons` and returns `Array<SeasonResponse>`

#### Scenario: Create season
- **WHEN** `createSeason(request)` is called
- **THEN** it performs `POST /api/v1/gamification/admin/seasons` with `SeasonRequest` and returns `SeasonResponse`

#### Scenario: Close season
- **WHEN** `closeSeason(id)` is called
- **THEN** it performs `POST /api/v1/gamification/admin/seasons/{id}/close` and returns `SeasonResponse`

#### Scenario: List reward pools
- **WHEN** `listRewardPools()` is called
- **THEN** it performs `GET /api/v1/gamification/admin/reward-pools` and returns `Array<RewardPoolResponse>`

#### Scenario: Upsert reward pool
- **WHEN** `upsertRewardPool(request)` is called
- **THEN** it performs `POST /api/v1/gamification/admin/reward-pools` with `RewardPoolRequest` and returns `RewardPoolResponse`

#### Scenario: List reward pool items
- **WHEN** `listRewardPoolItems(poolId)` is called
- **THEN** it performs `GET /api/v1/gamification/admin/reward-pools/{poolId}/items` and returns `Array<RewardItemResponse>`

#### Scenario: Add reward pool item
- **WHEN** `addRewardPoolItem(poolId, request)` is called
- **THEN** it performs `POST /api/v1/gamification/admin/reward-pools/{poolId}/items` with `RewardItemRequest` and returns `RewardItemResponse`

#### Scenario: Delete reward pool item
- **WHEN** `deleteRewardPoolItem(itemId)` is called
- **THEN** it performs `DELETE /api/v1/gamification/admin/reward-pools/items/{itemId}` and resolves with `void`

#### Scenario: Validate reward pool
- **WHEN** `validateRewardPool(poolId)` is called
- **THEN** it performs `GET /api/v1/gamification/admin/reward-pools/{poolId}/validate` and returns `boolean`

#### Scenario: Adjust XP
- **WHEN** `adjustXp(request)` is called
- **THEN** it performs `POST /api/v1/gamification/admin/xp-adjust` with `XpAdjustRequest` and returns `number`

### Requirement: SWR mutation wrappers exist for every writing endpoint
For every POST/PUT/DELETE gamification REST function, a corresponding `usePost*Swr` hook SHALL exist in `src/hooks/swr/api/rest/mutations/` following the existing naming and generic pattern.

#### Scenario: Use use streak freeze hook
- **WHEN** a component calls `usePostUseStreakFreezeSwr().trigger()`
- **THEN** the hook invokes `useStreakFreeze()` through `useSWRMutation`

#### Scenario: Use put goal hook
- **WHEN** a component calls `usePostPutGoalSwr().trigger(request)`
- **THEN** the hook invokes `putGoal(request)` through `useSWRMutation`

#### Scenario: Use claim reward pool hook
- **WHEN** a component calls `usePostClaimRewardPoolSwr().trigger({ code, request })`
- **THEN** the hook invokes `claimRewardPool(code, request)` through `useSWRMutation`

#### Scenario: Use admin upsert XP rule hook
- **WHEN** a component calls `usePostUpsertXpRuleSwr().trigger(request)`
- **THEN** the hook invokes `upsertXpRule(request)` through `useSWRMutation`

#### Scenario: Use admin create season hook
- **WHEN** a component calls `usePostCreateSeasonSwr().trigger(request)`
- **THEN** the hook invokes `createSeason(request)` through `useSWRMutation`

#### Scenario: Use admin close season hook
- **WHEN** a component calls `usePostCloseSeasonSwr().trigger(id)`
- **THEN** the hook invokes `closeSeason(id)` through `useSWRMutation`

#### Scenario: Use admin upsert reward pool hook
- **WHEN** a component calls `usePostUpsertRewardPoolSwr().trigger(request)`
- **THEN** the hook invokes `upsertRewardPool(request)` through `useSWRMutation`

#### Scenario: Use admin add reward pool item hook
- **WHEN** a component calls `usePostAddRewardPoolItemSwr().trigger({ poolId, request })`
- **THEN** the hook invokes `addRewardPoolItem(poolId, request)` through `useSWRMutation`

#### Scenario: Use admin delete reward pool item hook
- **WHEN** a component calls `usePostDeleteRewardPoolItemSwr().trigger(itemId)`
- **THEN** the hook invokes `deleteRewardPoolItem(itemId)` through `useSWRMutation`

#### Scenario: Use admin adjust XP hook
- **WHEN** a component calls `usePostAdjustXpSwr().trigger(request)`
- **THEN** the hook invokes `adjustXp(request)` through `useSWRMutation`

### Requirement: SWR query wrappers exist for read endpoints
For every GET gamification REST function we expose, a corresponding `useGet*Swr` hook SHALL exist in `src/hooks/swr/api/rest/queries/`.

#### Scenario: Use get my XP history hook
- **WHEN** a component calls `useGetMyXpHistorySwr(params)`
- **THEN** the hook invokes `getMyXpHistory(params)` through `useSWR`

#### Scenario: Use get my streak hook
- **WHEN** a component calls `useGetMyStreakSwr()`
- **THEN** the hook invokes `getMyStreak()` through `useSWR`

#### Scenario: Use get my goals hook
- **WHEN** a component calls `useGetMyGoalsSwr()`
- **THEN** the hook invokes `getMyGoals()` through `useSWR`

#### Scenario: Use get my badges hook
- **WHEN** a component calls `useGetMyBadgesSwr()`
- **THEN** the hook invokes `getMyBadges()` through `useSWR`

#### Scenario: Use get user gamification summary hook
- **WHEN** a component calls `useGetUserGamificationSummarySwr(userId)`
- **THEN** the hook invokes `getUserGamificationSummary(userId)` through `useSWR`

#### Scenario: Use get gamification leaderboard hook
- **WHEN** a component calls `useGetGamificationLeaderboardSwr(params)`
- **THEN** the hook invokes `getGamificationLeaderboard(params)` through `useSWR`

#### Scenario: Use get my mastery hook
- **WHEN** a component calls `useGetMyMasterySwr()`
- **THEN** the hook invokes `getMyMastery()` through `useSWR`

#### Scenario: Use get my mastery for subject hook
- **WHEN** a component calls `useGetMyMasteryForSubjectSwr(subjectId)`
- **THEN** the hook invokes `getMyMasteryForSubject(subjectId)` through `useSWR`

#### Scenario: Use admin list XP rules hook
- **WHEN** a component calls `useGetXpRulesSwr()`
- **THEN** the hook invokes `listXpRules()` through `useSWR`

#### Scenario: Use admin list seasons hook
- **WHEN** a component calls `useGetSeasonsSwr()`
- **THEN** the hook invokes `listSeasons()` through `useSWR`

#### Scenario: Use admin list reward pools hook
- **WHEN** a component calls `useGetRewardPoolsSwr()`
- **THEN** the hook invokes `listRewardPools()` through `useSWR`

#### Scenario: Use admin list reward pool items hook
- **WHEN** a component calls `useGetRewardPoolItemsSwr(poolId)`
- **THEN** the hook invokes `listRewardPoolItems(poolId)` through `useSWR`

#### Scenario: Use admin validate reward pool hook
- **WHEN** a component calls `useGetValidateRewardPoolSwr(poolId)`
- **THEN** the hook invokes `validateRewardPool(poolId)` through `useSWR`

### Requirement: Gamification module is re-exported from the REST barrel
- **WHEN** `src/modules/api/rest/index.ts` is updated
- **THEN** it adds `export * from "./gamification"` alongside existing module exports

### Requirement: GraphQL-covered endpoints are documented and skipped
Endpoints already served by GraphQL operations SHALL NOT receive duplicate REST clients in this change.

#### Scenario: Skip GraphQL-covered user progression
- **WHEN** reviewing the user gamification surface
- **THEN** `GET /api/v1/gamification/me/progression` is listed as covered by `userXp`/`userAchievements` and omitted

#### Scenario: Skip GraphQL-covered reward pools list
- **WHEN** reviewing the user gamification surface
- **THEN** `GET /api/v1/gamification/rewards/pools` is listed as covered by `rewards`/`myRewardWallet` and omitted
