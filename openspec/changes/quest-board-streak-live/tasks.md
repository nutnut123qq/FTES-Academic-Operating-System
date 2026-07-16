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
- [ ] 3.1 `StreakChip` → `useGetMyStreakSwr` (skeleton loading)
- [ ] 3.2 `StreakPopover` → streak + `useGetMyActivityDaysSwr(12)`; freeze → `usePostUseStreakFreezeSwr` + mutate; gỡ UI repair-coin (ghi spec-backlog)
- [ ] 3.3 `StreakHeatmap` đổi props sang `{date, xp}[]`, tự fill window + intensity theo bậc XP
- [ ] 3.4 Quality loop tính năng streak live: unit test + e2e test (heatmap fill đủ ô, freeze giảm freezeAvailable, timezone ngày VN) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 4. Snapshot chung + goals + analytics
- [ ] 4.1 `useQueryMyGamificationSwr` compose progression/streak/activity-days/badges/leaderboard — GIỮ interface `MyGamification`
- [ ] 4.2 `GoalsCard` → `useGetMyGoalsSwr` + `usePostPutGoalSwr`; không bịa % progress khi BE chưa trả
- [ ] 4.3 Analytics: rewrite `useQueryDailyQuestSwr` (map quest hook + link /quests) + `useQueryWeeklyGoalsSwr` (map goals WEEKLY, ẩn metric thiếu); cập nhật `DailyQuest`/`WeeklyGoals` + map.tsx
- [ ] 4.4 Quality loop tính năng snapshot/goals/analytics: unit test + e2e test (dropdown = profile cùng số, goal upsert revalidate, widget khớp board) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 5. Dọn mock engine
- [ ] 5.1 `LeaderboardShell`/`LeaderboardGuideShell` bỏ engine/rules; `tierFromXp` → `leaderboardTiers.ts` cục bộ
- [ ] 5.2 `GamificationEventHost` → diff-based toast (quest completed, level-up) từ SWR snapshots (ref, không toast dữ liệu lần fetch đầu)
- [ ] 5.3 `grep -rn "gamification/engine\|gamification/rules\|ftes.gamification.v1"` = 0 → XOÁ `engine.ts` + `rules.ts`
- [ ] 5.4 Quality loop tính năng dọn engine: unit test + e2e test (không còn import chết, toast bắn đúng 1 lần/completion, level-up moment) → đánh giá vòng 1 → fix → đánh giá vòng 2

## 6. Verify tổng
- [ ] 6.1 `npm run build` (webpack) xanh + `tsc --noEmit` sạch
- [ ] 6.2 Smoke trên apitest với acc test: login → /quests thấy DAILY_LOGIN done + ví +50; hoàn thành 1 lesson → streak/heatmap/xp/quest cập nhật
- [ ] 6.3 `openspec validate quest-board-streak-live --strict` sạch
