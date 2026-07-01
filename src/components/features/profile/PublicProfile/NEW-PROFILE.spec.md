# New Public Profile — Design System & Spec (SSOT)

> Bản dựng MỚI từ đầu (bản cũ park ở `PublicProfileLegacy`, KỆ nó). Áp skill
> **ui-ux-pro-max** (priority 1→10). Mọi component profile mới CHIẾU vào file này.
> POV: **editorial dark · recruiter-first · content > vanity**.

## 0. Mục tiêu (không đổi so với legacy)
Hồ sơ công khai = trang **credibility + portfolio**, bắc cầu *học → tuyển dụng*.
Recruiter liếc ≤30s: *"tuyển được không + có bằng chứng verify không + liên hệ ở đâu?"*.
Lợi thế riêng: **✓ Verified by StarCi** (capstone/challenge đã chấm) → nhấn mạnh.

## 1. Thay đổi LỚN so với legacy (để "khác thật")
- **BỎ sidebar identity chật** → **HERO HEADER full-width** ở đầu trang: avatar lớn +
  tên (lớn) + @handle + open-to-work + **đúng 1 primary CTA** + meta inline. Đây là
  điểm khác biệt thị giác chính.
- Tab strip **dính (sticky)** ngay dưới hero.
- Nội dung: **1 cột tập trung, căn giữa** (`max-w-4xl`) — đọc dễ, không loãng 2 cột.
- Mỗi card có **header rõ** (đã có divider trong SectionCard), nhịp dọc `gap-6`.

## 2. Design tokens (áp ui-ux-pro-max §6)
- **Type scale**: tên hero `Typography.Heading level={1}` (~28-30px, bold) · section
  title `Heading level={2}` (~18-20px, semibold) · body 16 · sub 14 · micro 12.
- **Weight hierarchy**: heading 700 · section 600 · label 500 · body 400.
- **Số liệu = tabular** (`tabular-nums`) cho follower/count/streak → không nhảy layout.
- **Màu (semantic token, KHÔNG hex)**: nền dark; **accent (pink)** chỉ cho **1 primary
  CTA + tab active + tín hiệu verify phụ**; **success (green)** cho `✓ Verified`;
  `muted` cho phụ. **Không dùng màu làm nghĩa duy nhất** (verify = icon + chữ).
- **Spacing 4/8**: scale `0/2/3/4/6`; section `gap-6`; hero nội bộ `gap-4`; gutter trang
  `gap-8` (ngoại lệ page-level). Card padding = globals `.card` (px-4 py-3).
- **Radius concentric**: card `rounded-2xl` → ô trong `rounded-xl` → pill/avatar `rounded-full`.
- **Elevation**: phẳng, KHÔNG shadow; phân tách bằng `border-separator` + surface.
- **Whitespace**: gom nhóm liên quan, tách section; KHÔNG hộp rỗng to cho khách.

## 3. A11y (PRIORITY #1 — ui-ux-pro-max §1/§2, bắt buộc)
- Contrast text ≥ 4.5:1 (phụ ≥3:1) trên dark; verify cả light/dark.
- **Focus ring** thấy được trên mọi control (`focus-visible:ring-2 ring-accent`).
- **Touch ≥ 44px**; icon trang trí `aria-hidden` + `focusable="false"`.
- **Heading hierarchy**: hero name = `h1`; section title = `h2`; trong section = `h3`.
- aria-label cho control icon-only; tab có `aria-controls` → panel `role="tabpanel"`.
- `prefers-reduced-motion`: tắt/giảm animation.

## 4. Luật code (giữ house rules — bắt buộc)
- **Text = HeroUI `Typography`** (size/weight/color/truncate qua PROP; color chỉ
  `default|muted`; accent/success/danger qua `text-{token}` className — ngoại lệ duy nhất).
- **`className` = chỉ PLACEMENT** (w/h/grid/flex/gap/margin/order/responsive). CẤM
  bg/border/shadow/rounded/text-size/font/truncate/padding qua className.
- **Dùng blocks** `@/components/blocks` (SectionCard từ reuseable; EmptyState/ErrorState/
  ListRow/StatusChip/ProgressMeter/StatPair/MetricCard/FeedItem/MediaCard).
- **1 component = 1 folder `index.tsx`**; hook feature-local → `hooks/`; `*Props extends WithClassNames`;
  container tự đọc SWR/store, KHÔNG nhận data/callback props.
- **i18n**: mọi chữ qua `t("...")`. KHÔNG sửa `messages/*.json` trong workflow song song —
  **trả về key cần thêm**, orchestrator thêm tay (chống race vỡ JSON). Tái dùng key
  `publicProfile.*` đã có khi được.
- Comment code = English.

## 5. Tầng data (TÁI DÙNG NGUYÊN — không đổi query)
Hook ở `@/hooks` (SWR, dedup theo username/userId; key `null` khi thiếu id):
`useQueryUserProfileSwr(username)` → user (id, username, displayName, bio, avatar,
openToWork, githubUsername, followerCount, followingCount, isFollowedByMe, createdAt,
profileLocked) · `useQueryUserCapstoneProgressSwr(userId)` · `useQueryUserPinnedProjectsSwr(userId)`
· `useQueryUserSolvedChallengesSwr(userId)` · `useQueryUserCodingProgressSwr` ·
`useQueryUserCodingSkillsSwr` · `useQueryUserCodingHistorySwr` · `useQueryUserContributionCalendarSwr`
· `useQueryUserWeeklyStatsSwr(userId)` (streak/longestStreak) · `useQueryUserAchievementsSwr`
· `useQueryUserCoursesSwr` · `useQueryUserFeedSwr`. Helper: `useProfileUsername()`,
`useProfileFollow()`, `useProfileTabStore()` (tab state + `ProfileTab` từ store).
Mutations: `useMutateSetFollowSwr` (qua useProfileFollow).

## 6. SHELL (orchestrator dựng tay — KHOÁ visual language; agent KHÔNG sửa)
`index.tsx`: loading/notfound/locked branch → `ProfileHero` (full-width) → sticky tab
strip → 1 cột nội dung căn giữa, mount lazy theo tab. `ProfileHero` = identity center
piece (avatar rank-framed lớn + name h1 + @handle + open-to-work chip + meta inline
tabular + **1 primary CTA**: khách+openToWork+github → "Liên hệ tuyển dụng"; khác →
Follow; self → "Chỉnh sửa hồ sơ" + gear; Share luôn có). States: Loading skeleton khớp
shell · NotFound 404 · Locked (hero + "riêng tư", giấu tab).

## 7. TABS (workflow dựng — chiếu spec, slot vào shell)
Thứ tự: Overview · Projects · Skills · Activity. Mỗi tab tự fetch, section tự ẩn khi rỗng.

### 7.1 Overview — `ProfileOverviewTab` (curated, "Ai → Tiếng nói → Việc → Kiên trì")
1. **Bio** (markdown). Chủ+rỗng → CTA "viết bio"; khách+rỗng → ẩn.
2. **Dự án** (`ProfileFeaturedProjects`) — MỘT khối state-aware, ưu tiên *pinned* →
   *capstone verified* (`✓ Verified by StarCi`, neo thị giác) → *capstone đang làm*
   (progress). Cap 3. "Xem tất cả →" sang tab Projects.
3. **Đóng góp** (`ProfileContributions`) — heatmap + streak hiện tại/dài nhất.
4. **Kỹ năng (snapshot)** (`ProfileSkillsSnapshot`) — top theo độ khó + chips ngôn ngữ
   (số THẬT, KHÔNG bar relative-to-max). "Xem tất cả →" sang tab Skills.

### 7.2 Projects — `ProfileProjectsTab`
Pinned đầy đủ (chủ: manage/add) → Capstone theo khóa (roadmap milestone/task + repo +
verified) → Challenge có repo (artifact verify). Rỗng → "tham gia khóa để bắt đầu".

### 7.3 Skills — `ProfileSkillsTab`
Depth theo độ khó (bars = tỉ lệ THẬT/tổng) · ngôn ngữ (depth, không flex số lượng) ·
lịch sử giải gần đây. Rỗng → "vào Luyện tập".

### 7.4 Activity — `ProfileActivityTab`
Thành tích (badge theo tier/rank) · khóa đã tham gia + progress · feed timeline. Rỗng → ẩn từng phần.

## 8. States & kỹ thuật
Loading=skeleton khớp layout · Error=`ErrorState`+retry · Empty=§1/§7 (tự ẩn khách,
action cho chủ) · Locked=hero+"riêng tư" · NotFound=404. Verified=`StatusChip` success
+ icon. Sticky tab: `md:sticky md:top-0 z-10` + nền để không lộ nội dung trôi dưới.
