# Tasks — quest-board-streak-live

## 1. REST layer + hooks mới
- [ ] 1.1 `src/modules/api/rest/gamification/types.ts`: `QuestItemView`, `QuestBoardView`, `ActivityDayView`, `ActivityDaysView`, `ProgressionView`
- [ ] 1.2 `gamification.ts`: `getMyQuests`, `getMyActivityDays`, `getMyProgression` (đúng pattern restRequest hiện có)
- [ ] 1.3 Hooks `useGetMyQuestsSwr` (refreshInterval 60s) / `useGetMyActivityDaysSwr(weeks)` / `useGetMyProgressionSwr` + export `queries/index.ts`; gate authenticated
- [ ] 1.4 Quality loop tính năng REST hooks: unit test + e2e test (key ổn định, guest không fetch, parse envelope) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 2. Trang /quests (QuestBoard)
- [ ] 2.1 UX: `starci-fe-ux-brainstorm` chốt layout board → `starci-fe-ux-apply`/`starci-fe-cannon-apply` dựng `QuestBoard` + `src/app/[locale]/quests/page.tsx`
- [ ] 2.2 Header tổng xu hôm nay + chip ví (`useGetMyWalletSwr`, format vi-VN); list card quest theo sortOrder (progress, +xu/lượt, đã nhận x/limit, done state)
- [ ] 2.3 CTA map theo code (LESSON_COMPLETE/COMMUNITY_POST/COMMUNITY_COMMENT/LIKE_3_POSTS/STREAK_7_BONUS; code lạ → không CTA); guest empty-state đăng nhập
- [ ] 2.4 i18n `gamification.quests.*` (vi/en)
- [ ] 2.5 Quality loop tính năng quest board: unit test + e2e test (render 6 quest seed, done state, guest gate, CTA route) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 3. Streak live (chip/popover/heatmap/freeze)
- [x] 3.1 `StreakChip` → `useGetMyStreakSwr` (skeleton loading)
- [x] 3.2 `StreakPopover` → streak + `useGetMyActivityDaysSwr(12)`; freeze → `usePostUseStreakFreezeSwr` + mutate; gỡ UI repair-coin (ghi spec-backlog)
- [x] 3.3 `StreakHeatmap` đổi props sang `{date, xp}[]`, tự fill window + intensity theo bậc XP
- [x] 3.4 Quality loop tính năng streak live: unit test + e2e test (heatmap fill đủ ô, freeze giảm freezeAvailable, timezone ngày VN) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 4. Snapshot chung + goals + analytics
- [x] 4.1 `useQueryMyGamificationSwr` compose progression/streak/activity-days/badges/leaderboard — GIỮ interface `MyGamification`
- [x] 4.2 `GoalsCard` → `useGetMyGoalsSwr` + `usePostPutGoalSwr`; không bịa % progress khi BE chưa trả
- [x] 4.3 Analytics: rewrite `useQueryDailyQuestSwr` (map quest hook + link /quests) + `useQueryWeeklyGoalsSwr` (map goals WEEKLY, ẩn metric thiếu); cập nhật `DailyQuest`/`WeeklyGoals` + map.tsx
- [x] 4.4 Quality loop tính năng snapshot/goals/analytics: unit test (compose snapshot, goal model, analytics map — 16 test) → đánh giá vòng 1+2 (badge i18n + level-floor findings → backlog); e2e smoke hoãn task 6.2 (auth+BE-gated)

## 5. Dọn mock engine
- [x] 5.1 `LeaderboardShell`/`LeaderboardGuideShell` bỏ engine/rules; `tierFromXp` → `leaderboardTiers.ts` cục bộ (LeaderboardShell: viewer stats từ `useQueryMyGamificationSwr`, badges thật, bỏ demo-row + reminder; Guide: economics constants inline cục bộ + `RANK_TIERS` từ `leaderboardTiers`)
- [x] 5.2 `GamificationEventHost` → diff-based toast (quest completed từ `useGetMyQuestsSwr`, level-up từ `useGetMyProgressionSwr`) — ref seed lần fetch đầu, không toast dữ liệu lịch sử; +i18n `gamification.quests.toast.questDone`
- [x] 5.3 `grep -rn "gamification/engine\|gamification/rules\|ftes.gamification.v1"` = 0 → XOÁ `engine.ts` + `rules.ts`
- [x] 5.4 Quality loop tính năng dọn engine: unit test `GamificationEventHost/index.test.tsx` (4 test: seed không toast, tăng completedCount → 1 toast coin+title, level tăng → moment) + full suite 71 xanh + `tsc` sạch + `npm run build` webpack xanh → đánh giá vòng 1 (badgesEmpty i18n + dashed guest stats) → fix → vòng 2 (không leftover engine symbol); e2e smoke hoãn task 6.2 (auth+BE-gated, như 4.4)

## 6. Verify tổng
- [ ] 6.1 `npm run build` (webpack) xanh + `tsc --noEmit` sạch
- [ ] 6.2 Smoke trên apitest với acc test: login → /quests thấy DAILY_LOGIN done + ví +50; hoàn thành 1 lesson → streak/heatmap/xp/quest cập nhật
- [ ] 6.3 `openspec validate quest-board-streak-live --strict` sạch
