# gamification-live-data Specification

## Purpose
TBD - created by archiving change quest-board-streak-live. Update Purpose after archive.
## Requirements
### Requirement: Streak surfaces read the real backend
`StreakChip` and `StreakPopover` SHALL read `GET /api/v1/gamification/me/streak` via `useGetMyStreakSwr` (currentStreak, longestStreak, freezeAvailable) and the popover heatmap SHALL render `GET /api/v1/gamification/me/activity-days?weeks=12` via `useGetMyActivityDaysSwr`, filling absent days as empty cells and shading intensity by daily XP. The freeze action SHALL call `POST /api/v1/gamification/me/streak/freeze` (`usePostUseStreakFreezeSwr`) and revalidate the streak; the mock-only coin repair flow SHALL be removed from the UI (no backend endpoint).

#### Scenario: Heatmap shows real active days
- **WHEN** the viewer earned XP on 3 distinct days this month
- **THEN** exactly those 3 cells render active in the 12-week heatmap, bucketed by the backend's Vietnam-day dates

#### Scenario: Freeze consumes on the server
- **WHEN** the viewer uses a freeze from the popover
- **THEN** the freeze endpoint is called, the streak query revalidates and `freezeAvailable` decreases without a reload

### Requirement: Shared viewer snapshot composes REST sources
`useQueryMyGamificationSwr` SHALL keep its `MyGamification` interface but compose it from real endpoints: XP/level/level-progress from `GET /me/progression` (new client fn `getMyProgression`), streak + heatmap days from the streak/activity-days hooks, badges from `GET /me/badges`, rank from the existing leaderboard hook — so `GamificationStatsRow` (account dropdown) and `ProfileProgress` change no call-sites yet display live numbers.

#### Scenario: Dropdown and profile agree
- **WHEN** the account dropdown and the profile Progress tab render for the same user
- **THEN** streak, XP and level come from the same SWR keys and can never disagree

#### Scenario: Guest gets no snapshot
- **WHEN** no user is authenticated
- **THEN** the hook returns `data === undefined` and fires no gamification requests

### Requirement: Goals and analytics widgets use real goals
`GoalsCard` SHALL list and upsert goals through `GET/PUT /api/v1/gamification/me/goals` (`useGetMyGoalsSwr`, `usePostPutGoalSwr`), and the analytics WeeklyGoals widget SHALL map the WEEKLY goals from the same hook, hiding metrics the backend does not return instead of fabricating progress.

#### Scenario: Goal upsert persists
- **WHEN** the viewer sets a WEEKLY XP target in GoalsCard
- **THEN** the PUT succeeds, the goals query revalidates and the analytics widget reflects the new target

### Requirement: Mock engine is deleted
After all consumers are swapped, `src/components/features/gamification/engine.ts` and `rules.ts` SHALL be deleted; the only surviving logic SHALL be pure display helpers (leaderboard tier mapping) relocated to a local module, and no file SHALL import the engine, its localStorage key or its event bus. `GamificationEventHost` SHALL derive its XP/level-up/quest toasts from SWR data diffs instead of engine events.

#### Scenario: No engine references remain
- **WHEN** searching the codebase for `gamification/engine` or `gamification/rules` imports and the `ftes.gamification.v1` storage key
- **THEN** there are zero matches and `tsc --noEmit` passes

#### Scenario: Level-up still celebrates
- **WHEN** a progression revalidation returns a higher level than the previous snapshot
- **THEN** the level-up moment overlay renders once for that transition

### Requirement: Seed data
Live surfaces SHALL be verifiable against the BE seed of `gamification-quest-coin-engine` (quests, corrected community xp_rules) plus organic activity: logging in and completing one lesson on a seeded environment SHALL produce a non-zero streak, heatmap cell, XP history entry and quest completion without any FE-side seeding.

#### Scenario: One learning session lights every surface
- **WHEN** a test user logs in and completes a lesson
- **THEN** StreakChip shows ≥ 1, the heatmap marks today, progression XP increases and the lesson quest shows completed

