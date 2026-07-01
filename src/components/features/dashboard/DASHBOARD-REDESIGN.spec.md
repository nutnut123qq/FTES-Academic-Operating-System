# Dashboard Redesign Spec — áp CHUẨN layout Profile  (2026-06-18)

> `/ux-brainstorm` (deep). **Bản dashboard hiện tại = HÀNG THAM KHẢO/legacy** (3-rail wall, `@gravity-ui`,
> `<span>`+text-class, no AsyncContent, nhồi 1 màn). Redesign LẠI từ đầu theo **đúng pattern trang Profile**
> (`features/profile/PublicProfile`). KHÔNG code — chốt hướng → `/ux-apply`.

## 0. Pattern Profile = khuôn (recipe phải copy)

Từ `PublicProfile`:
- **Shell:** `flex w-full flex-col` → **`ProfileTabsBar` sticky** (`sticky top-16 z-40 w-full border-b border-separator bg-background`) → body `mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-6 md:flex-row md:items-start`.
- **2 cột:** TRÁI = identity **BARE** (`aside flex w-full flex-col gap-4 md:w-72 md:shrink-0`, KHÔNG card); PHẢI = nội dung tab `main flex min-w-0 flex-1 flex-col gap-6`.
- **Tabs = `ExtendedTabs`** (secondary underline) + **URL-sync** (`useProfileTabUrlSync` ↔ `?tab=`, zustand store, `fromUrlRef` chống echo); panel render điều kiện theo tab active (lazy mount → lazy fetch). Tab mobile = icon-only (`label hidden md:inline`).
- **Section = `LabeledCard`** (label NGOÀI + icon size-5, content TRONG) bọc **`AsyncContent`** (skeleton mirror · empty tự ẩn · error retry). KPI = hàng **`MetricCard`** `grid grid-cols-2 gap-3 sm:grid-cols-4`. Breakdown = `SegmentBar`. 
- **Kỷ luật:** features/ compose blocks+HeroUI (KHÔNG style); container tự đọc SWR (no prop-drill, SWR dedupe theo key); 1 component = 1 folder; spacing 0/2/3/4/6.

## 1. Vì sao redesign (pain legacy)

3-rail wall hiện tại: không 1-primary rõ; 15+ khối ngang cấp; tầng `layouts/shell` legacy; `@gravity-ui` + `<span>`+text-class + `gap-1.5` + KHÔNG AsyncContent khắp nơi; ambient rail nhồi; data quý bỏ phí (`myContributionCalendar`, achievements, globalLeaderboard). → Không scale, không khớp design-system. Profile pattern đã chứng minh: sạch, scale, glanceable.

## 2. Mục tiêu (≤30s)

Logged-in home = **cockpit học**: (a) **làm gì bây giờ** (resume) · (b) **đà/standing của tôi** (streak·rank·credit) · (c) khám phá/social · (d) khóa học. Profile pattern cho: **identity/standing TRÁI (bare, ổn định mọi tab) + nội dung TABS phải**.

## 3. Các hướng

- **A — CHỐT: Profile-mirror tabbed cockpit.** Sticky tabs + cột TRÁI = "viewer standing" bare + cột PHẢI = tab content (LabeledCard sections). Default tab = Tổng quan (next-action + momentum + weekly challenge). *Lý do:* đúng yêu cầu "chuẩn layout như profile"; tách màn-nhồi thành tab; glanceable cái chính ở default, sâu hơn ở tab; tái dùng nguyên blocks profile.
- **B — Single-scroll cockpit, card discipline, KHÔNG tab.** 2-cột (standing trái / content phải) nhưng 1 scroll dài. *Trade-off:* glance tốt nhưng dài + KHÔNG khớp "layout profile" (profile có tab). Loại.
- **C — Tabs nhưng trái chỉ avatar+quick-actions** (standing dồn vào Overview). *Trade-off:* trái nhẹ nhưng mất glance standing xuyên-tab. Loại (standing nên luôn thấy như identity profile).

→ **Chốt A.**

## 4. IA mới (Hướng A)

### Tab strip (sticky, URL-sync) — `DashboardTabsBar`
`Tổng quan · Khám phá · Khóa học · Cộng đồng` (icon: `HouseIcon · CompassIcon · GraduationCapIcon · TrophyIcon`). Default `overview`.

### Cột TRÁI — "Viewer standing" (BARE, ổn định mọi tab) — `DashboardIdentity`
Mirror ProfileHero nhưng cho CHÍNH mình + standing:
1. Avatar (rank-framed, reuse `ProfileRankAvatar`-style) + tên + `@handle` (Redux user).
2. **Status chips/rows bare** (glance): chuỗi 🔥 N (streak) · Hạng #N league · Credit AI còn {week}/{limit} · Điểm quà {balance}. (compact, KHÔNG card to.)
3. **`QuickActions`** (Xem khóa học · Luyện code · Đã lưu · Rewards · Blog · Talents) — giữ, sửa sạch (Link/ListBox đúng rule, fix i18n keys `actions.{rewards,blog,talents}` thiếu).

### Cột PHẢI — tab content (LabeledCard sections)
- **Tổng quan (default):**
  1. **Next-action hero** (`ContinueLearning`) — PRIMARY: resume lớn nhất + onboarding khi chưa enroll.
  2. **`MomentumBand`** (đã dựng) — streak strip + daily-goal + KPI (gộp).
  3. **Weekly challenge** (`WeeklyChallengeCard`) — "Tuần này".
  4. **Heatmap đóng góp** (`myContributionCalendar` — đang bỏ phí ở dashboard) trong LabeledCard.
- **Khám phá:** Feed (`FeedTabs` for-you/following) + Trending + Who-to-follow (LabeledCard).
- **Khóa học:** My courses progress (LabeledCard, SegmentBar per course) + Near-completion + Recommended courses + Upcoming livestreams.
- **Cộng đồng:** League full table (LabeledCard) + Global leaderboard + Changelog "Có gì mới".

### Mobile
Profile pattern: 2-cột STACK (standing trái lên đầu, rồi tab strip icon-only, rồi content). **→ Bỏ `DashboardRailDrawer`** vừa dựng (drawer chỉ là vá cho 3-rail legacy; pattern profile stack tự nhiên, không cần drawer).

## 5. Section → data (BE/DB)

| Vùng | Hook/field |
|---|---|
| Identity trái | Redux user + `myWeeklyStats.streak` + `myLeague.{rank,tier}` + `myAiQuota.credit` + `myRewardWallet.balance` |
| QuickActions | static + `username` |
| Next-action hero | `myInProgressChallenges` + `myLearnedLessons` + `myCourses` |
| MomentumBand | `myWeeklyStats` + `myKpis` + `myCourses` |
| Weekly challenge | `weeklyChallenge` |
| Heatmap | `myContributionCalendar` (chưa dùng ở dashboard) |
| Khám phá | `myFeed` + `trendingContents` + `suggestedUsers`/`setFollow` |
| Khóa học | `myCourses` + Recommended (`RecommendedCourses`) + `myUpcomingLivestreams` |
| Cộng đồng | `myLeague` + `globalLeaderboard` (chưa dùng) + `changelogEntries` |

## 6. Cắt / Gộp / Thêm

- **Cắt (legacy):** 3-rail grid `[300_1fr_320]`; `DashboardSidebar` band; **`DashboardRailDrawer`** (không cần với pattern profile); mọi `@gravity-ui`/`<span>`+text-class/`gap-1.5` → phosphor/Typography/gap-2.
- **Gộp:** ambient rail (league/credit/livestream/changelog) phân bổ lại → standing trái (compact) + tab Cộng đồng/Khóa học (full).
- **Thêm (data bỏ phí):** **heatmap đóng góp** (Overview), **global leaderboard** (Cộng đồng), reward/streak/rank vào standing trái.
- **Tái dùng nguyên:** `LabeledCard·MetricCard·SegmentBar·AsyncContent·Skeleton·IconTile·ExtendedTabs·PressableCard` + `ContinueLearning·MomentumBand·WeeklyChallengeCard·FeedTabs·RecommendedCourses` (đã có, refactor sạch khi ghép).
- **Sửa lệch:** i18n `dashboard.actions.{rewards,blog,talents}` THIẾU → render raw (thấy ảnh) — thêm key.

## 7. States / a11y
- **Mỗi section = AsyncContent** (skeleton mirror layout; empty tự ẩn/CTA; error retry). Tab panel lazy-mount → lazy fetch (như profile).
- **Empty toàn-trang** (user mới chưa enroll): Overview hero = onboarding invite (không để trắng).
- Tab = URL `?tab=` (share được). `prefers-reduced-motion`. Tab mobile icon-only + `aria-controls`/`role=tabpanel` (mirror profile).

## 8. Folder (mirror PublicProfile) — khi /ux-apply
```
features/dashboard/
  index.tsx                 (shell: DashboardTabsBar + 2-col)
  types.ts                  (DashboardTab union + DASHBOARD_TABS)
  hooks/useDashboardTabUrlSync.ts
  DashboardTabsBar/
  DashboardIdentity/        (avatar + standing chips + QuickActions)
  OverviewTab/              (ContinueLearning, MomentumBand, WeeklyChallenge, Contributions)
  ExploreTab/               (Feed, Trending, WhoToFollow)
  CoursesTab/               (MyCourses, Recommended, Livestreams)
  CommunityTab/             (League, GlobalLeaderboard, Changelog)
```
(các component cockpit đã có — di vào đúng tab + bọc LabeledCard + dọn rule.)

## 9. Migration / debt
- Bản hiện tại (3-rail + drawer + DashboardSidebar) = **thay thế hoàn toàn**, KHÔNG giữ song song.
- Việc đã làm trước (MomentumBand gộp, WeeklyChallenge wire, 3 small items, drawer) = **một phần dùng lại** (MomentumBand/WeeklyChallenge), một phần **bỏ** (drawer, rail band).
- /ux-apply nên làm THEO TAB (Overview trước = giá trị cao nhất), mỗi tab 1 lượt, gate tsc/eslint.
