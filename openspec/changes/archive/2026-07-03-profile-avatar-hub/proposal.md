## Why

A logged-in learner clicking their avatar today sees only name/email + links — none of the gamification identity (streak, rank, XP) that exists solely on `/leaderboard`, and the profile page still has placeholder tabs and no skill graph. The user asked for the avatar to become a "hub": dropdown shows streak/rank at a glance, and the profile page becomes complete (full info, skill graph, stats).

## What Changes

- **Account dropdown v2 (logged in)**: header block = avatar + name wrapped in a level ring; new stats row of compact chips 🔥 streak · 🏆 rank · ⚡ XP linking to profile/leaderboard; a new **"Khám phá" (Explore) section** of discovery shortcuts (Trợ lý AI → `/ai`, Dành cho bạn / For You → community For You feed, Gợi ý cho bạn / Recommendations → `/recommendations`, Thịnh hành / Trending → community trending); then existing menu links (Profile, Saved, Settings), theme switch, logout. Skeleton chips while stats load. Guest dropdown unchanged except the Explore shortcuts (public ones navigate, auth-gated ones open the AuthenticationModal).
- **[Coupling with `app-shell-header-nav`]** This change also performs the header delta: it removes the `ai` child from Workplace ▾ and the `recommendations` child from Course ▾ in `src/components/features/app-shell/useAppNav.tsx`, so the discovery shortcuts move from the header dropdowns into this popup and ship together (no window where `/ai` or `/recommendations` is orphaned).
- **Profile completion**:
  - Progress tab becomes a gamification dashboard: XP/level progress bar, streak calendar heatmap, rank/league card, badges grid, plus a skill-graph section embedding the `SkillGraph` component from change `skill-graph-spider` (full, subject-agnostic graph).
  - Portfolio tab: projects and external links with mock CRUD-lite (add/edit/remove in local state).
  - Community tab: my-posts summary + reputation snapshot (mock).
  - Identity card gains streak + rank chips.
- **Single data source**: one mock `useQueryMyGamificationSwr` hook feeds both the dropdown and profile surfaces (same numbers everywhere; today's leaderboard mock values 4820 XP / Level 12 / Streak 7 / Rank 3 stay consistent).
- i18n vi/en for all new strings; a11y for chips, heatmap, and tabs; mobile layouts specified.

## Capabilities

### New Capabilities
- `my-gamification-data`: shared mock SWR hook `useQueryMyGamificationSwr` — the single source for the current user's XP, level, streak, rank/league, and badges across dropdown and profile.
- `account-menu-gamification`: logged-in avatar dropdown v2 — level-ring header, stats chip row with loading/navigation behavior, an Explore ("Khám phá") shortcuts section (AI, For You, Recommendations, Trending) with guest/auth handling, and header-coupling (removing `ai`/`recommendations` from `useAppNav`).
- `profile-gamification-dashboard`: profile Progress tab as a gamification dashboard (XP/level bar, streak heatmap, rank/league, badges) + embedded skill graph + streak/rank chips on the identity card.
- `profile-portfolio-showcase`: profile Portfolio tab — projects and links with mock CRUD-lite and empty state.
- `profile-community-summary`: profile Community tab — my posts and reputation summary (mock) with empty state.

### Modified Capabilities
- (none — no archived spec in `openspec/specs/` covers the account dropdown or profile tabs; `auth-flows-mock` covers auth forms only)

## Impact

- FE only, mock data (house rule) — no BE, no new dependencies.
- Affected components: `src/components/features/navbar/Navbar/AccountMenuDropdown/` (extended — stats row + Explore section), `src/components/features/app-shell/useAppNav.tsx` (remove `ai` from Workplace ▾ + `recommendations` from Course ▾ — coupled with `app-shell-header-nav`), `ProfileShell` (identity card + Progress/Portfolio/Community tabs filled).
- **Cross-reference `app-shell-header-nav`**: that change specs the header removal; this change owns the Explore popup and performs the coupled `useAppNav` edit so header + popup ship together. Phosphor icons for Explore shortcuts: Robot (AI), Newspaper (For You), Sparkle (Recommendations), TrendUp (Trending).
- **Depends on change `skill-graph-spider`** for the `SkillGraph` component and `useQuerySkillGraphSwr`; this change only embeds it (graph internals stay spec'd there).
- Overlaps with placeholder-era sibling changes `profile-progress` / `profile-portfolio` / `profile-community`: this change supersedes their scope with fuller tabs; distinct capability names avoid delta collisions.
- i18n messages (vi/en). Verify: `npm run build` (webpack) + `tsc --noEmit` stay green.
