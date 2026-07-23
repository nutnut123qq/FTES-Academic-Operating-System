# quest-board-streak-live — Quest board nhận XU + gamification sống bằng BE thật (bỏ mock engine)

## Why

BE change `gamification-quest-coin-engine` (FTES-AOS-Backend) mở quest engine: nhiệm vụ hằng ngày
tự động cấp FTES Coin (50–100 xu, có daily limit), API `GET /gamification/me/quests` +
`GET /gamification/me/activity-days`. Trong khi đó FE gamification vẫn chạy **mock localStorage**
(`components/features/gamification/engine.ts` + `rules.ts`): StreakChip, StreakPopover, GoalsCard,
ProfileProgress, AccountMenuDropdown (GamificationStatsRow), LeaderboardShell,
useQueryMyGamificationSwr đều đọc engine giả — trong khi bộ REST hooks thật đã viết sẵn từ change
`rest-fetch-gamification` (`useGetMyStreakSwr`, `useGetMyGoalsSwr`, `useGetMyBadgesSwr`,
`usePostUseStreakFreezeSwr`… hiện **0 usage**). `useQueryDailyQuestSwr` / `useQueryWeeklyGoalsSwr`
trong analytics cũng là mock cứng. User cần thấy nhiệm vụ thật, xu thật vào ví, streak/heatmap thật.

## What Changes

- **REST layer mới** trong `src/modules/api/rest/gamification`: `getMyQuests` (`/gamification/me/quests`),
  `getMyActivityDays` (`/gamification/me/activity-days?weeks=`), `getMyProgression`
  (`/gamification/me/progression` — BE có sẵn, FE chưa map) + types; SWR hooks
  `useGetMyQuestsSwr`, `useGetMyActivityDaysSwr`, `useGetMyProgressionSwr`.
- **Trang `/quests` (quest board)**: list nhiệm vụ hôm nay (title, mô tả, tiến độ
  eventCount/targetCount, xu/lượt, đã nhận `completedCount`/`dailyLimit`), tổng xu nhận hôm nay
  (`totalCoinToday`) + số dư ví (`useGetMyWalletSwr`), CTA điều hướng theo quest
  (đăng bài → `/community/new`, học bài → `/courses/me`...). Chọn TRANG RIÊNG thay vì chỉ section
  trong `/analytics` vì board có ví + CTA điều hướng là 1 đích đến; widget DailyQuest trong
  `/analytics` wire về CÙNG hook và trỏ sang `/quests`.
- **Swap toàn bộ mock engine → REST hooks**:
  - `StreakChip`/`StreakPopover`: `useGetMyStreakSwr` + `useGetMyActivityDaysSwr` (heatmap thật)
    + freeze qua `usePostUseStreakFreezeSwr`.
  - `useQueryMyGamificationSwr`: dựng lại trên progression + streak + badges + leaderboard REST
    (giữ nguyên interface `MyGamification` cho GamificationStatsRow/ProfileProgress).
  - `GoalsCard`: `useGetMyGoalsSwr` + `usePostPutGoalSwr`.
  - `LeaderboardShell`/`LeaderboardGuideShell`: bỏ import engine/rules, số liệu viewer lấy từ
    progression/streak hooks.
  - Analytics: `useQueryDailyQuestSwr` → map từ `useGetMyQuestsSwr`; `useQueryWeeklyGoalsSwr` →
    map từ `useGetMyGoalsSwr` (metric thiếu → ẩn row, không bịa số).
  - `GamificationEventHost`: bỏ subscribe engine; bắn toast khi diff SWR phát hiện quest mới
    hoàn thành / level tăng (store overlay nhỏ, design §4).
- **Xoá `engine.ts` + `rules.ts`** sau khi mọi consumer đã swap (helper hiển thị thuần còn dùng —
  `tierFromXp` — chuyển vào file util cục bộ của leaderboard).
- i18n `gamification.quests.*` (vi/en); đăng ký nav tới `/quests` từ StreakPopover + account menu.

## Capabilities

### New Capabilities
- `quest-board`: trang /quests + widget analytics hiển thị nhiệm vụ, tiến độ, xu.

### Modified Capabilities
- `gamification-live-data`: mọi surface gamification (chip, popover, goals, profile, account
  menu, leaderboard, analytics) đọc REST BE thật; mock engine bị xoá.

## Impact

- FE only; tiêu thụ API BE change `gamification-quest-coin-engine` (khi BE chưa deploy →
  envelope lỗi → surface render skeleton/empty, KHÔNG fallback mock).
- Files: `src/modules/api/rest/gamification/*`, `src/hooks/swr/api/rest/queries/*` (3 hook mới),
  `src/app/[locale]/quests/page.tsx` (mới), `src/components/features/gamification/**` (QuestBoard
  mới; StreakChip/StreakPopover/StreakHeatmap/GoalsCard/GamificationEventHost/LeaderboardShell/
  useQueryMyGamificationSwr sửa; engine.ts + rules.ts XOÁ),
  `src/components/features/analytics/**` (DailyQuest/WeeklyGoals wire thật),
  `src/components/features/profile/ProfileProgress`, navbar GamificationStatsRow, i18n vi/en.
- `npm run build` (webpack) + `tsc --noEmit` phải xanh.
