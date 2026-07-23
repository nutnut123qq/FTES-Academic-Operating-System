# Tasks — quest-board-streak-live

## 1. REST layer + hooks mới
- [x] 1.1 `src/modules/api/rest/gamification/types.ts`: `QuestItemView`, `QuestBoardView`, `ActivityDayView`, `ActivityDaysView`, `ProgressionView`
- [x] 1.2 `gamification.ts`: `getMyQuests`, `getMyActivityDays`, `getMyProgression` (đúng pattern restRequest hiện có)
- [x] 1.3 Hooks `useGetMyQuestsSwr` (refreshInterval 60s) / `useGetMyActivityDaysSwr(weeks)` / `useGetMyProgressionSwr` + export `queries/index.ts`; gate authenticated
- [x] 1.4 Quality loop tính năng REST hooks: unit test (`gamification.test.ts` 4 + `gamificationLiveHooks.test.tsx` 13 = 17 xanh: key ổn định, guest key=null không fetch, fetcher delegate, refreshInterval 60s, weeks-in-key); e2e smoke hoãn task 6.2 (auth+BE-gated, như 4.4/5.4)

## 2. Trang /quests (QuestBoard)
- [x] 2.1 UX layout board → dựng `QuestBoard/index.tsx` (+ `map.tsx` icon/CTA-icon, `model.ts` questProgress/questCtaHref thuần) + `src/app/[locale]/quests/page.tsx` (mx-auto max-w-3xl, header + AsyncContent list)
- [x] 2.2 Header tổng xu hôm nay (`GamificationChip` CoinsIcon, `totalCoinToday`) + chip ví (`useGetMyWalletSwr`, `balance`, `toLocaleString(locale)` vi-VN); list card quest sort theo `sortOrder` (ProgressMeter eventCount vs targetCount×dailyLimit, chip `+{coin} xu/lượt`, `đã nhận completedCount/dailyLimit`, done state dim+check khi completedCount≥dailyLimit)
- [x] 2.3 CTA map theo code (`questCtaHref`: LESSON_COMPLETE→/courses/me, COMMUNITY_POST→/community/new, COMMUNITY_COMMENT/LIKE_3_POSTS→/community, STREAK_7_BONUS→/profile/progress; DAILY_LOGIN + code lạ/admin → null → không CTA; done → không CTA); guest empty-state (`SignInIcon` + CTA authentication, cả 2 hook /me gate null → không fire request)
- [x] 2.4 i18n `gamification.quests.*` (vi/en đủ 18 key: title/subtitle/todayEarned/walletBalance/perClaim/progressLabel/claimedOfLimit/done/goDo/signIn*/empty/loadError/retry/toast.questDone)
- [x] 2.5 Quality loop tính năng quest board: unit test (`model.test.ts` 8: progress ceiling/clamp/divide-by-zero/done + CTA map known/locale/DAILY_LOGIN-null/unknown-null) + component test (`index.test.tsx` 6: render 6 quest seed sort theo sortOrder, done marker+no CTA, CTA route /vi/courses/me, unknown+DAILY_LOGIN no CTA, guest gate, header echo totalCoinToday+ví vi-VN) = 14 xanh; tsc sạch → đánh giá vòng 1 (ví/xu aria-label không group locale → backlog, không sửa) → vòng 2 (guest cả 2 hook gate null xác nhận, spec scenario khớp); e2e smoke hoãn task 6.2 (auth+BE-gated, như 4.4/5.4)

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
- [x] 6.1 `npm run build` (webpack) xanh + `tsc --noEmit` sạch (2026-07-23: cả hai exit 0.)
- [x] 6.2 Smoke trên apitest với acc test: login → /quests thấy DAILY_LOGIN done + ví +50; hoàn thành 1 lesson → streak/heatmap/xp/quest cập nhật
      (E2E Playwright 2026-07-23 `e2e/quest-board-streak-live.spec.ts` 2/2: DAILY_LOGIN done +50 xu khớp API live; complete lesson → LESSON_COMPLETE eventCount tăng, card 1/1, streak ≥1, activity-day hôm nay, xp, /profile/progress render đủ. Finding phụ ghi nhận: POST /complete khi lesson chưa có progress-row → 409; lesson có quiz không COMPLETED qua /complete; streak chỉ nhích theo lesson-completion.)
- [x] 6.3 `openspec validate quest-board-streak-live --strict` sạch ✅ (verify: "Change 'quest-board-streak-live' is valid")
