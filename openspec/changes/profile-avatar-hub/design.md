## Context

- **Avatar dropdown**: `src/components/features/navbar/Navbar/AccountMenuDropdown/` renders `UserSummary` (avatar/name/email) + menu links + theme switch + logout. No gamification.
- **Gamification numbers** exist only in `LeaderboardShell` on `/leaderboard` (mock: XP 4820, Level 12, Streak 7, Rank 3, badges) — hard-coded there, not shared.
- **Profile**: `ProfileShell` is a 2-column layout (identity card left; tabs Personal / Academic / Portfolio / Community / Progress right). Personal + Academic are filled (mock); Portfolio / Community / Progress are placeholders. No skill graph, streak, or rank anywhere on profile.
- **Constraint**: FE-only repo with mock BE — all data via mock SWR hooks, deterministic, drop-in swappable later.
- **Dependency**: change `skill-graph-spider` specs the `SkillGraph` component (`useQuerySkillGraphSwr`, spider-web canvas, mobile list fallback). This change only embeds it.

## Goals / Non-Goals

**Goals:**
- Logged-in avatar dropdown surfaces streak / rank / XP at a glance with links deeper.
- Profile becomes complete: Progress = gamification dashboard + skill graph; Portfolio and Community filled (mock); identity card shows streak + rank.
- One shared mock hook so dropdown and profile never disagree on numbers.

**Non-Goals:**
- No real BE, persistence, or auth changes; guest dropdown untouched.
- No skill-graph internals (layout, interactions) — owned by `skill-graph-spider`.
- No leaderboard redesign; `LeaderboardShell` may later consume the shared hook but that refactor is optional follow-up, not required here.
- No streak/XP earning rules (owned by `gamification-streak-meaning` if pursued).

## Decisions

1. **Shared hook `useQueryMyGamificationSwr` (new, mock)** — single source returning `{ xp, level, levelProgress: { current, nextThreshold }, streak: { current, days: ISODate[] }, rank: { position, league }, badges: Badge[] }`. Deterministic mock matching today's leaderboard values (4820 / 12 / 7 / 3). *Why not read from LeaderboardShell*: those values are inline JSX, not importable; a hook mirrors the house SWR pattern and gives BE swap-in later. Lives beside other mock query hooks.
2. **Dropdown extends, not replaces, `AccountMenuDropdown`** — `UserSummary` gains a level ring (SVG ring around avatar, progress = levelProgress); a new `GamificationStatsRow` block renders three compact chips (streak 🔥, rank 🏆, XP ⚡) between the summary and the menu links. Chips are links: streak/XP → `/profile/progress`, rank → `/leaderboard`. *Why chips not a table*: dropdown width is fixed and scannability at a glance is the point. Skeleton chips (same box sizes) while the hook loads — dropdown must not jump.

   **Dropdown order (logged in):** (a) level-ring header (avatar + name + email), (b) `GamificationStatsRow` chips, (c) **"Khám phá" (Explore) section** (D8), (d) menu links (Profile, Saved, Settings), (e) theme switch, (f) logout.

8. **[Amendment] "Khám phá" (Explore) section inside the avatar popup (D8)** — product owner đổi hướng (VN): *"Bỏ Explore đi… mấy cái Explore như AI, For you… nhét vào chỗ profile popup."* Header không còn là nhà của discovery shortcuts; chúng dời vào popup này.
   - **Vị trí:** một labeled group riêng "Khám phá" (`profileMenu.explore.title`), đặt **giữa `GamificationStatsRow` và menu links** — có divider trên/dưới. Chọn vị trí này (thay vì cuối menu) vì đây là điều hướng "đi khám phá", đồng hạng với các link tài khoản, đặt ngay dưới chips gamification (khối "danh tính/khám phá của tôi").
   - **4 shortcut (icon phosphor + label):** Trợ lý AI (`Robot` → `/ai`), Dành cho bạn / For You (`Newspaper` → community For You feed, tức feed `/community` mặc định), Gợi ý cho bạn / Recommendations (`Sparkle` → `/recommendations`), Thịnh hành / Trending (`TrendUp` → community trending). Mỗi shortcut là link 1 hàng (icon + label), click đóng popup rồi navigate.
   - **Guest state:** popup guest hiện Explore nhưng phân loại theo auth:
     - **Public (không cần đăng nhập): For You + Trending** — điều hướng bình thường (feed cộng đồng công khai). *Lý do:* cộng đồng đọc được khi chưa login.
     - **Auth-gated: Trợ lý AI + Recommendations** — click → mở `AuthenticationModal` (không navigate), vì AI hub + gợi ý cá nhân hoá cần user. Sau khi đăng nhập, tiếp tục tới route.
   - **Route contract:** `/ai` và `/recommendations` VẪN là route hợp lệ; popup này là entry point mới sau khi header gỡ chúng (owner header removal = `app-shell-header-nav`).

9. **[Amendment] Coupled `useAppNav` edit ships here (D9)** — implementation của change NÀY cũng sửa `src/components/features/app-shell/useAppNav.tsx` để `/ai` và `/recommendations` KHÔNG còn ở header. **[Cập nhật theo directive mới]** `app-shell-header-nav` đã ĐẢO sang **header link thuần, KHÔNG dropdown** — nên không còn "dropdown Workplace/Course" để gỡ item; việc cần đảm bảo là `/ai` và `/recommendations` chỉ reachable qua **popup này** (và search), không nằm ở header dưới bất kỳ hình thức nào. Lý do gộp: header + popup ship cùng lúc để không có khoảng thời gian `/ai`/`/recommendations` mất đường vào. `app-shell-header-nav` spec hoá header không-dropdown; change này thực thi popup + đảm bảo entry point.
3. **Progress tab = dashboard sections in one column**: (a) XP/level progress bar card, (b) streak calendar heatmap (last ~12 weeks, CSS grid of day cells, no new dependency), (c) rank/league card, (d) badges grid, (e) skill-graph section embedding `SkillGraph` full-graph. *Why heatmap hand-rolled*: a date grid is trivial with tokens; a charting lib is overkill for mock data.
4. **Portfolio tab = mock CRUD-lite in local state** — list of projects (title, description, tech tags, link) + external links; add/edit/remove mutate component state seeded from the mock hook `useQueryMyPortfolioSwr`; no persistence (documented assumption). *Why CRUD-lite*: shows the full intended UX without inventing a BE contract.
5. **Community tab = read-only summary** — reputation snapshot + my recent posts list from mock `useQueryMyCommunitySummarySwr`, linking into community routes. Read-only because authoring lives in community changes.
6. **Identity card chips** reuse the same chip visual as the dropdown row (one small shared chip component) fed by the same hook — guarantees visual + numeric consistency.
7. **Capability naming** avoids collisions with placeholder-era sibling changes (`profile-progress-section` etc.): this change uses `profile-gamification-dashboard`, `profile-portfolio-showcase`, `profile-community-summary` and supersedes those changes' scope.

## Risks / Trade-offs

- [Sibling changes `profile-progress`/`profile-portfolio`/`profile-community` overlap] → proposal marks this change as superseding; archive/close those before or when applying this one to avoid duplicate work.
- [`skill-graph-spider` not yet implemented when this change is applied] → Progress tab renders the skill-graph section behind a guard: if the component is absent, tasks order requires implementing `skill-graph-spider` first (hard dependency, stated in tasks).
- [CRUD-lite state lost on reload] → acceptable for mock stage; empty/filled states spec'd so BE swap changes only the hook.
- [Dropdown grows taller] → stats row is one compact line; the Explore section is 4 compact rows; mobile drawer/popup variant keeps the same order (header → chips → Khám phá → links → theme → logout), spec'd scenario covers it.

## Open Questions

- League naming (Bronze/Silver/Gold vs FTES-specific) — placeholder "Gold" in mock until product decides.
