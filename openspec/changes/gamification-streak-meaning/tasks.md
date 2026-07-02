## 1. Rules engine (single source)

- [x] 1.1 Tạo `src/components/features/gamification/rules.ts`: XP_TABLE, QUIZ_XP_TIERS, LEVEL_CURVE (35×(L−1)²), RANK_TIERS, STREAK_* (step 5%, cap 50%, milestones 7/30/100, freeze max 2 · 50 coin, repair 10×days cap 200 · 48h), GOALS (daily 2 · +10, weekly 5 ngày · +50)
- [x] 1.2 Pure functions + unit-style guards: `levelFromXp`, `xpToNextLevel`, `tierFromXp`, `streakMultiplier`, `isQualifyingAction`, `applyMultiplier`
- [x] 1.3 Mock engine state (localStorage `ftes.gamification.v1`): xp, streak, activeDays (12 tuần), frozenDays, freezes, claimedMilestones, goals, lastResetInfo; seed từ mock hiện có (4820 XP / streak 7)
- [x] 1.4 Engine actions: `recordAction(type, meta)` (award XP + nhân multiplier + tăng streak 1 lần/ngày + goals), `checkDayRollover` (reset/freeze-consume), `repairStreak`, `buyFreeze`; store client (đồng bộ mọi surface)
- [x] 1.5 Verify `npm run build` + `tsc --noEmit`

## 2. Streak surfaces

- [x] 2.1 StreakPopover: số ngày + multiplier, heatmap 12 tuần (ô hoạt động/đóng băng/trống, aria-label per-cell), kho freeze, mốc kế tiếp, nút repair (khi trong hạn 48h)
- [x] 2.2 Gắn popover vào stat card Streak ở LeaderboardShell + chip lửa (StreakChip tái dùng cho avatar menu/profile/workspace, cùng store)
- [x] 2.3 Milestone moment (badge + coin khi chạm 7/30/100, chỉ 1 lần) + đồng bộ trạng thái badge trên `/leaderboard`
- [x] 2.4 Nhắc streak-at-risk 20:00 (streak ≥ 3, 1 lần/ngày, app đang mở) — best-effort qua toast status (notification bell là file dùng chung)
- [x] 2.5 Verify `npm run build` + `tsc --noEmit`

## 3. XP feedback + goals

- [x] 3.1 Toast +XP (aria-live status, queue không chồng đè) + moment level-up (đóng được bằng bàn phím); bắn từ engine actions
- [x] 3.2 Wire `recordAction` (demo affordance trên leaderboard exercise flow lesson/quiz/challenge; flow học thật là file dùng chung)
- [x] 3.3 Khối "Mục tiêu" (Daily/Weekly card: tiến độ, thưởng, trạng thái) trên `/leaderboard`
- [x] 3.4 Hiện tier (Đồng→Kim Cương) cạnh stat Rank từ `tierFromXp`
- [x] 3.5 Verify `npm run build` + `tsc --noEmit`

## 4. Guide page + i18n

- [x] 4.1 Route `/leaderboard/guide` "Cách tính điểm": bảng XP, công thức level + ví dụ, bảng tier, luật streak (ngày hợp lệ/multiplier/mốc/freeze/repair), goals, mục "Sắp ra mắt" (League/Season, Monthly, Mystery Box) — mọi số render từ `rules.ts`
- [x] 4.2 Link "Cách tính điểm" từ header LeaderboardShell; heading phân cấp + bảng có header cell
- [x] 4.3 i18n `gamification.*` đầy đủ vi/en cho toàn bộ surface mới (guide, popover, toast, goals, milestones, reminder)
- [x] 4.4 A11y pass: keyboard cho popover/moment, aria heatmap, tiến độ goal dạng text
- [x] 4.5 Verify cuối: `tsc --noEmit` sạch (không chạy `npm run build` theo yêu cầu task)
