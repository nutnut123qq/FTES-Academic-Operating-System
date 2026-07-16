# quest-board

## ADDED Requirements

### Requirement: Quest board page at /quests
The app SHALL provide a `/quests` page rendering today's quest board from `GET /api/v1/gamification/me/quests`: every quest ordered by `sortOrder` with title, description, a progress indicator over `eventCount` versus `targetCount × dailyLimit`, the coin reward per completion (`+{rewardCoin} xu/lượt`), the claimed state `completedCount/dailyLimit`, plus a header showing `totalCoinToday` and the viewer's wallet balance from `GET /api/v1/wallet/me` (1000 xu = 1000đ, vi-VN number formatting).

#### Scenario: Signed-in learner sees live progress
- **WHEN** a signed-in user who commented once today (quest `COMMUNITY_COMMENT`, limit 2) opens `/quests`
- **THEN** the comment quest shows progress 1/2 claims, `coinEarnedToday = 50` and the header total includes those 50 xu

#### Scenario: Completed quest is visually done
- **WHEN** a quest has `completedCount == dailyLimit`
- **THEN** its card renders in a done state (check indicator, no further CTA)

#### Scenario: Guest is gated
- **WHEN** an unauthenticated visitor opens `/quests`
- **THEN** no gamification request is fired and a sign-in empty-state is shown

### Requirement: Quest CTAs route to the earning surface
The quest board SHALL map known quest codes to in-app CTAs (`LESSON_COMPLETE → /courses/me`, `COMMUNITY_POST → /community/new`, `COMMUNITY_COMMENT`/`LIKE_3_POSTS → /community`, `STREAK_7_BONUS → /profile/progress`) and SHALL render unknown codes (admin-created quests) without a CTA rather than failing.

#### Scenario: Unknown quest code degrades gracefully
- **WHEN** the API returns a quest code the client has no mapping for
- **THEN** the card renders title/progress/reward normally with no CTA button

### Requirement: Quest board data stays fresh without sockets
The quest hook SHALL revalidate on window focus and on a 60s interval so coins credited asynchronously by the backend worker appear without a manual reload, and a completion detected between two snapshots SHALL surface a toast (`+{rewardCoin} xu — {title}`) exactly once per completion.

#### Scenario: Background completion surfaces
- **WHEN** the user finishes a lesson in another tab and the board revalidates
- **THEN** the lesson quest flips to completed and one toast announces the earned coins

### Requirement: Analytics daily-quest widget rides the same data
The analytics DailyQuest widget SHALL replace its mock with rows mapped from the same quest hook (title + progress per quest, reward header = `totalCoinToday`) and SHALL link to `/quests`; the mock fetcher SHALL be deleted.

#### Scenario: Widget matches the board
- **WHEN** the analytics overview and `/quests` are both open
- **THEN** both surfaces show the same per-quest progress numbers from the shared SWR key

### Requirement: Seed data
The feature SHALL rely on the backend seed of change `gamification-quest-coin-engine` (6 active quests, REWARDS_POOL balance) for deploy-and-test data; the client SHALL ship no mock fallback — when the API is unavailable the board renders skeletons then an error empty-state.

#### Scenario: Fresh environment demo
- **WHEN** a tester logs in on an environment migrated with the BE seed
- **THEN** the board lists the 6 seeded quests and `DAILY_LOGIN` completes from the login event alone
