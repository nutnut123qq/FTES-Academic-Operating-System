# Design — quest-board-streak-live

FE Next.js (App Router, `[locale]`), HeroUI + pattern SWR REST sẵn có
(`restRequest` → envelope `{code,message,data}`). Không GraphQL: gamification đọc REST như change
`rest-fetch-gamification` đã chốt.

## 1. REST layer (`src/modules/api/rest/gamification`)

`types.ts` thêm (mirror DTO `GamificationViews` BE):

```ts
export interface QuestItemView {
    code: string; title: string; description: string | null
    rewardCoin: number; targetCount: number; dailyLimit: number
    eventCount: number; completedCount: number; coinEarnedToday: number; sortOrder: number
}
export interface QuestBoardView { dateVn: string; totalCoinToday: number; quests: Array<QuestItemView> }
export interface ActivityDayView { date: string; xp: number }
export interface ActivityDaysView { weeks: number; days: Array<ActivityDayView> }
export interface ProgressionView {
    totalXp: number; level: number; levelTitle: string
    nextLevelXp: number | null; reputation: number
}
```

`gamification.ts` thêm 3 fn theo đúng pattern file:
- `getMyQuests(): Promise<QuestBoardView>` — `GET /gamification/me/quests`
- `getMyActivityDays(params?: { weeks?: number }): Promise<ActivityDaysView>` —
  `GET /gamification/me/activity-days` (default weeks 12)
- `getMyProgression(): Promise<ProgressionView>` — `GET /gamification/me/progression`

Hooks mới trong `src/hooks/swr/api/rest/queries/` (mirror `useGetMyStreakSwr`):
`useGetMyQuestsSwr` (key `["GET_MY_QUESTS_SWR"]`), `useGetMyActivityDaysSwr(weeks = 12)`
(key `["GET_MY_ACTIVITY_DAYS_SWR", weeks]`), `useGetMyProgressionSwr`
(key `["GET_MY_PROGRESSION_SWR"]`); export ở `queries/index.ts`. Mọi hook gate theo
`state.keycloak.authenticated` (guest → không fetch, `data === undefined`).

## 2. Trang /quests — QuestBoard

- Route: `src/app/[locale]/quests/page.tsx` → render
  `src/components/features/gamification/QuestBoard/index.tsx` (feature mới, dựng theo skill
  `starci-fe-cannon-apply`; layout qua `starci-fe-ux-brainstorm` trước khi code).
- Cấu trúc: header (tiêu đề + tổng xu hôm nay `totalCoinToday` + chip số dư ví từ
  `useGetMyWalletSwr` — 1000 xu = 1000đ, format `Intl.NumberFormat("vi-VN")`) → list card quest
  theo `sortOrder`: icon theo `code` (map cục bộ, fallback icon chung), title, description,
  progress bar `min(eventCount, targetCount*dailyLimit)/(targetCount*dailyLimit)`, nhãn
  `+{rewardCoin} xu/lượt`, trạng thái `Đã nhận {completedCount}/{dailyLimit} lượt hôm nay`,
  quest đủ limit → card chuyển trạng thái done (check icon, giảm opacity).
- CTA điều hướng theo `code` (map cục bộ trong QuestBoard):
  `LESSON_COMPLETE → /courses/me`, `COMMUNITY_POST → /community/new`,
  `COMMUNITY_COMMENT | LIKE_3_POSTS → /community`, `STREAK_7_BONUS → mở StreakPopover route
  /profile/progress`, `DAILY_LOGIN → không CTA (tự hoàn thành)`. Code lạ (admin thêm) → không CTA.
- Guest: gate như các trang me-khác — hiện empty-state kêu đăng nhập.
- SWR revalidate: `refreshInterval: 60_000` trên `useGetMyQuestsSwr` (xu auto-credit từ worker,
  không có socket) + revalidateOnFocus mặc định.

## 3. Swap mock engine → REST (per surface)

| Surface | Trước (mock) | Sau (REST) |
|---|---|---|
| `StreakChip` | `useGamificationEngine().state.streak` | `useGetMyStreakSwr().data?.currentStreak ?? 0`; skeleton khi loading |
| `StreakPopover` | engine heatmap + freeze/repair local | `useGetMyStreakSwr` (current/longest/freezeAvailable) + `useGetMyActivityDaysSwr(12)`; nút freeze → `usePostUseStreakFreezeSwr` rồi `mutate` streak; BỎ repair-coin (BE chưa có endpoint repair — ẩn UI, ghi chú spec-backlog) |
| `StreakHeatmap` | nhận `HeatmapDay[]` của engine | props mới `days: Array<{date: string; xp: number}>` + tự fill window `weeks*7` ô (ngày thiếu = empty); intensity theo bậc xp (0/1-19/20-49/50+) |
| `GoalsCard` | engine daily/weekly | `useGetMyGoalsSwr` + `usePostPutGoalSwr` (upsert target); progress hiển thị target đã đặt — BE chưa trả current progress của goal → chỉ hiện mục tiêu + form sửa, KHÔNG bịa % (ghi chú trong JSDoc) |
| `useQueryMyGamificationSwr` | engine + rules | compose `useGetMyProgressionSwr` (xp/level/levelProgress từ `totalXp`,`nextLevelXp`) + `useGetMyStreakSwr` + `useGetMyActivityDaysSwr` (streak.days) + `useGetMyBadgesSwr` (badges thật, `badgeKey = code`) + `useQueryLeaderboardSwr` (rank giữ nguyên); interface `MyGamification` GIỮ NGUYÊN → GamificationStatsRow/ProfileProgress không đổi call-site |
| `ProfileProgress` | qua hook trên | không đổi ngoài nhánh loading/error (đã SWR-shaped) |
| `LeaderboardShell` / `LeaderboardGuideShell` | import engine + rules (XP viewer, tier) | viewer stats từ `useQueryMyGamificationSwr`; `tierFromXp` chuyển sang `src/components/features/gamification/leaderboardTiers.ts` (pure, chỉ giữ phần hiển thị tier) |
| `GamificationEventHost` | `subscribeGamificationEvents` engine | diff-based: hook nội bộ `useQuestCompletionToasts` — giữ `useRef` snapshot `completedCount` theo `code` từ `useGetMyQuestsSwr`; khi tăng → `toast.success("+{rewardCoin} xu — {title}")`; level: ref `level` từ progression, tăng → moment modal giữ nguyên UI |
| Analytics `DailyQuest` | `useQueryDailyQuestSwr` mock | rewrite hook: map `useGetMyQuestsSwr` → rows (title/eventCount/targetCount·dailyLimit), reward = totalCoinToday, link "Xem tất cả" → `/quests`; xoá fetch mock |
| Analytics `WeeklyGoals` | `useQueryWeeklyGoalsSwr` mock | map `useGetMyGoalsSwr` (period WEEKLY) → rows target; metric không có → ẩn row |

Sau khi mọi consumer swap xong: **xoá `engine.ts`, `rules.ts`**, xoá type `HeatmapDay`/`DayStatus`
export từ engine (StreakHeatmap tự khai type mới). `grep -rn "gamification/engine\|gamification/rules"`
phải về 0 trước khi xoá file.

## 4. Toast/moment store

Không dựng event-bus mới: `GamificationEventHost` mount 1 lần trong layout các trang gamification
(giữ chỗ mount hiện tại) và tự diff bằng SWR data (§3). Không lưu localStorage; ref khởi tạo từ
lần fetch đầu (không toast cho dữ liệu lịch sử).

## 5. i18n (vi/en — `gamification.quests.*`)

`title`, `todayEarned`, `walletBalance`, `perClaim`, `claimedOfLimit`, `done`, `goDo`,
`signInPrompt`, `empty`, `toast.questDone`; analytics `analytics.overview.quest.viewAll`.
Title/description quest hiển thị THẲNG từ BE (đã tiếng Việt) — i18n chỉ cho khung.

## 6. Seed data

FE không có DB — dữ liệu chạy ngay đến từ seed BE V213 của change
`gamification-quest-coin-engine` (6 quest active + REWARDS_POOL 1.000.000 coin + xp_rules đúng
key). Dev test: đăng nhập tài khoản test (acc 4 role sẵn có, xem memory course-module-arch) trên
môi trường apitest → board hiện 6 quest, `DAILY_LOGIN` tự hoàn thành sau login, ví +50 xu.
Không seed/mock phía FE; thiếu BE → skeleton/empty-state.

## 7. Verify

`npm run build` (webpack) xanh + `tsc --noEmit` sạch; smoke flow: /quests (guest + login),
streak popover heatmap, analytics widgets, account dropdown, profile progress, leaderboard.
