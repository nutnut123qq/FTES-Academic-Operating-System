# UX Brainstorm — Dashboard (`/[locale]/dashboard`) — 2026-06-18

> `/ux-brainstorm` · KHÔNG code, chốt hướng → `/ux-apply`. Audit features + BE/DB đã xong (dưới).

## 0. Bối cảnh (audit)

**Cấu trúc hiện tại:** `components/layouts/shell/Dashboard/**` = **tầng LEGACY** (main.md §2 cấm code mới ở
`layouts/**`). 15+ section, 3 cột (`xl:grid-cols-[300px_1fr_320px]`), mỗi section 1 SWR độc lập (~13 query).

**BE có sẵn (13+ query, đa số đã dùng):** `myCourses` · `myLearnedLessons` · `myInProgressChallenges` ·
`myWeeklyStats {streak,longestStreak,xp,lessons,days,weeklyGoalLessons,streakFreezes,weeklyCoding,weeklyFlashcards}` ·
`myKpis {composite,items}` · `myContributionCalendar` · `trendingContents` · `myFeed (cursor)` ·
`activeAdvertisement` · `changelogEntries` · `myUpcomingLivestreams` · `weeklyChallenge {title,week,viewerPassed}` ·
`myRewardWallet {balance,spent,redemptions}` · `myLeague` · `useQuerySuggestedUsersSwr`/`setFollow`.

**Data CÓ nhưng CHƯA surface trên dashboard (cơ hội):** `weeklyChallenge` (hook engagement tuần mạnh!) ·
`myContributionCalendar` (heatmap, hiện chỉ ở profile) · `myRewardWallet` (balance/gamification) ·
`weeklyStats.weeklyCoding/weeklyFlashcards` (track rồi, UI chỉ show lessons) · achievements/`taskPlanStatus`.

## 1. Pain (vì sao redesign)

1. **Không có 1 hành động chính rõ.** 15 khối ngang cấp = wall; mắt không biết "làm gì bây giờ".
2. **Redundancy momentum:** `StreakStrip` + `DailyGoal` + `KpiCard` (3 khối liền) cùng đọc `myWeeklyStats`/`myKpis` →
   lặp streak, tách rời, chiếm 3 slot dọc. `NearCompletion` lại chồng `ContinueLearning` (đều "học tiếp").
3. **Empty cho user mới = 60% trắng** (chưa enroll → hero rỗng + list rỗng + feed rỗng), KHÔNG onboarding.
4. **Loading lệch nhịp** — 13 query nở skeleton/data so le, trang "nhảy".
5. **Legacy layer** — khó áp rule mới (block/feature), `layouts/shell` cấm code mới.
6. **Data giá trị cao bị bỏ:** `weeklyChallenge` (CTA tuần) không hiện; heatmap/reward không tận dụng.
7. AI quota 2 window dễ đọc nhầm thành 2 pool (đã chuẩn-hoá ở trang ai-usage; dashboard card nên bám unified-pool).

## 2. Mục tiêu trang (≤30s)

Dashboard = **HOME BASE của learner**. Trong 30s phải trả lời: **(a) Làm gì bây giờ?** (resume) · **(b) Đà của tôi
ra sao?** (streak/goal/KPI) · **(c) Tuần này có gì?** (weekly challenge/livestream/league) — rồi mới tới khám
phá/feed/ambient. Cắt vanity, dựng PHÂN CẤP rõ: 1 primary → momentum → tuần này → còn lại tiered.

## 3. Các hướng

- **Hướng A — Action-first tối giản (Duolingo home):** 1 hero next-action khổng lồ + 1 momentum strip; feed/social/
  league đẩy hẳn xuống/ẩn. *Trade-off:* gọn, ép hành động — nhưng phí mất chất social/discovery đã xây (feed, follow,
  league) → giảm retention vòng dài.
- **Hướng B — Social/feed-first (GitHub home, quỹ đạo hiện tại):** trung tâm = feed hoạt động; identity trái, ambient
  phải. *Trade-off:* hợp cộng đồng — nhưng feed phụ thuộc user PHẢI follow người khác; learner mới feed trống → sai
  trọng tâm cho sản phẩm "học".
- **Hướng C — CHỐT: "Cockpit" learner (action-first + momentum hợp nhất + tiered, onboarding-aware).** Giữ social/
  discovery nhưng XẾP TẦNG dưới hành động học. *Lý do chốt:* sản phẩm là HỌC → ưu tiên resume + đà + việc-tuần; vẫn
  giữ giá trị social/league/feed đã build nhưng đúng thứ bậc; xử được empty + redundancy. Cân bằng A↔B.

## 4. IA mới (Hướng C)

Layout: **main 2 cột** (trái identity slim · giữa nội dung) + **rail phải ambient sticky** (1-scroll, sidebar sticky —
main.md §10 / starci-navigation). Mobile stack: giữa → momentum → tuần này → trái → phải.

**CỘT GIỮA (ưu tiên dọc):**
1. **Greeting + Next-action HERO (PRIMARY, 1 hành động):** "Chào {displayName}" + **1 resume item LỚN** (ưu tiên
   in-progress challenge → lesson gần nhất → course near-completion), + tối đa 2 resume phụ (chip/card nhỏ).
   **Gộp `NearCompletion`** thành badge "còn N bài" trên card course tương ứng (bỏ khối riêng).
   *Empty/new (chưa enroll):* thay hero = **onboarding invite** full-width (CTA "Khám phá khoá học" + 2-3 gợi ý).
2. **Momentum band (HỢP NHẤT `StreakStrip`+`DailyGoal`+`KpiCard` → 1 card):** strip 7 ngày + chuỗi hiện tại/dài nhất +
   **daily-goal nudge inline** ("học 1 bài giữ chuỗi" / "chuỗi an toàn") + **KPI tuần compact** (composite ring +
   items: lessons/challenges/coding/flashcards) + (tuỳ) weekly XP. 1 nguồn `myWeeklyStats`+`myKpis`. Link "Sửa KPI".
3. **"Tuần này" CTA (MỚI — surface `weeklyChallenge`):** card thử-thách-tuần (title + tuần + `viewerPassed` →
   "Làm ngay"/"✓ Đã pass"). Hook engagement tuần mạnh, đang bỏ phí. (Có thể gộp 1 dải "Tuần này" với livestream sắp tới.)
4. **Tiến độ khoá (compact):** per-course completion (giữ, nhưng gọn — row + bar tổng), từ `myCourses`.
5. **Feed khám phá/hoạt động (SECONDARY, dưới fold):** `FeedTabs` (Cho bạn/Đang theo dõi) + `TrendingContents`. Giữ;
   thêm error state cho pagination (audit thiếu).

**CỘT TRÁI (identity slim):** `ProfileMenuCard` + `QuickActions` (+ chip **reward balance** từ `myRewardWallet` — surface
nhẹ) + `WhoToFollow`. (Course-progress list dời sang giữa #4 để trái gọn.)

**RAIL PHẢI (ambient, sticky):** `LeagueCard` · `AiQuotaCard` (1 pool 2 window, bám unified — xem rule
`credit-unified-pool-ui`) · `UpcomingLivestreamCard` · `ChangelogList` · `activeAdvertisement`.

## 5. Section → data (BE/DB)

| Section | Query/field |
|---|---|
| Next-action hero | `myInProgressChallenges` + `myLearnedLessons` + `myCourses` (near-completion badge) |
| Momentum band | `myWeeklyStats {days,streak,longestStreak,weeklyCoding,weeklyFlashcards}` + `myKpis {composite,items}` |
| Tuần này | `weeklyChallenge {title,week,viewerPassed}` (+ `myUpcomingLivestreams`) |
| Tiến độ khoá | `myCourses {completionPercent,contentCompleted,challengeCompleted,...}` |
| Feed + Trending | `myFeed(tab,category,cursor)` + `trendingContents` |
| Identity trái | Redux user + `useQueryUserAchievementsSwr` + `myRewardWallet.balance` + `suggestedUsers`/`setFollow` |
| Rail phải | `myLeague` · `myAiQuota.credit` · `myUpcomingLivestreams` · `changelogEntries` · `activeAdvertisement` |

## 6. Cắt / Gộp / Thêm

- **Gộp:** `StreakStrip`+`DailyGoal`+`KpiCard` → 1 **Momentum band**; `NearCompletion` → badge trong hero.
- **Thêm:** **Weekly-challenge CTA** (data sẵn, chưa dùng); reward-balance chip; onboarding-empty hero; error state cho Feed pagination.
- **Tiered xuống:** Feed/Trending (secondary); social (trái).
- **Đồng bộ:** AiQuotaCard bám unified-pool (1 pool 2 window), bỏ mơ hồ "2 quota".
- **Nợ cấu trúc (nêu rõ, KHÔNG làm trong brainstorm):** migrate `layouts/shell/Dashboard/**` → `features/dashboard/**`
  + tách block tái dùng (MomentumBand, NextActionHero, WeeklyChallengeCard) khi /ux-apply.

## 7. States / a11y
- **Page-level coherence:** mỗi section vẫn `AsyncContent` riêng (skeleton mirror), NHƯNG hero + momentum nên có
  skeleton ổn định (không nhảy). Empty toàn-trang (user mới) = onboarding invite, KHÔNG để trắng.
- Mọi card ambient `null` khi rỗng (giữ) NHƯNG bổ sung **error state** (audit: chỉ HistoryRail có; Feed/League thiếu).
- Streak strip: nhãn thứ trong tuần locale-aware; meta gọn (gap-2). Reduced-motion cho mọi animate.

---

## Phụ lục — Audit cây hiện tại (inventory, KHÔNG phải design để bê)
- **Trái `HistoryRail`:** ProfileMenuCard · QuickActions (6 nút) · course-progress list (`myCourses`) · WhoToFollow.
- **Giữa:** ContinueLearning(hero, 3 resume) · NearCompletion · StreakStrip · DailyGoal · KpiCard · FeedTabs(Trending+Feed).
- **Phải `DashboardSidebar`:** LeagueCard · AiQuotaCard · UpcomingLivestreamCard · ChangelogList.
- Pain chi tiết: redundant streak ×3, empty 60% trắng, loading so le, legacy layer, weeklyChallenge/heatmap/reward bỏ phí,
  Feed pagination không error, League match theo `username` (nên `userGlobalId`).
