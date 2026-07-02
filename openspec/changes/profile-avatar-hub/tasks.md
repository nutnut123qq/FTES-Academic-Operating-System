## 1. Shared data (my-gamification-data)

- [ ] 1.1 Confirm dependency: `skill-graph-spider` change implemented (SkillGraph component + `useQuerySkillGraphSwr` exist); if not, implement it first
- [ ] 1.2 Add types + mock `useQueryMyGamificationSwr` (xp, level, levelProgress, streak {current, days[]}, rank {position, league}, badges) — deterministic, matches leaderboard values 4820/12/7/3; empty when unauthenticated
- [ ] 1.3 Add mock `useQueryMyPortfolioSwr` and `useQueryMyCommunitySummarySwr` with seeded deterministic data

## 2. Account dropdown v2 (account-menu-gamification)

- [ ] 2.1 Build shared `GamificationChip` block (icon + value + accessible label) reused by dropdown and identity card
- [ ] 2.2 Extend `AccountMenuDropdown` UserSummary with level ring (SVG progress ring + level label, aria-label)
- [ ] 2.3 Add `GamificationStatsRow` (streak/rank/XP chips) between header and menu links; chips link to profile Progress / `/leaderboard` and close the dropdown
- [ ] 2.4 Skeleton chips (same dimensions) for loading; omit row on error; verify guest dropdown untouched (except Explore section below)
- [ ] 2.5 i18n `accountMenu.gamification.*` (vi+en); keyboard/tab order + aria-labels on chips

## 2b. Explore "Khám phá" section in the account popup (account-menu-gamification)

- [ ] 2b.1 Build the labeled "Khám phá" (Explore) section in `AccountMenuDropdown`, placed between the stats row and the menu links (divider top/bottom), with 4 shortcut rows (phosphor icon + label): Trợ lý AI (`Robot` → `/ai`), Dành cho bạn / For You (`Newspaper` → community For You feed), Gợi ý cho bạn / Recommendations (`Sparkle` → `/recommendations`), Thịnh hành / Trending (`TrendUp` → community trending)
- [ ] 2b.2 Logged-in: activating a shortcut closes the popup then navigates
- [ ] 2b.3 Guest: For You + Trending navigate (public); Trợ lý AI + Recommendations open `AuthenticationModal` (no navigate), resuming to route after login
- [ ] 2b.4 Mobile parity: Explore renders in the mobile drawer/popup form in the same order (header → stats → Khám phá → links → theme → logout)
- [ ] 2b.5 i18n `profileMenu.explore.*` (title + 4 labels, vi+en); menu-item a11y semantics, keyboard focus order, aria-labels on icon-only visuals

## 2c. Header coupling — remove discovery shortcuts from `useAppNav` (ships with this change; cross-ref `app-shell-header-nav` §7)

- [ ] 2c.1 Edit `src/components/features/app-shell/useAppNav.tsx`: remove the `ai` child from the Workplace module (leaves subjects, resources, challenges, leaderboard, workflow, analytics, career)
- [ ] 2c.2 Edit `src/components/features/app-shell/useAppNav.tsx`: remove the `recommendations` child from the Course module (leaves catalog `/courses`, marketplace `/marketplace`)
- [ ] 2c.3 Verify `/ai` and `/recommendations` remain valid routes reachable via the Explore popup; no orphaned route; no dead `nav.*` i18n keys left in the header path
- [ ] 2c.4 Confirm coupling: header removal (spec'd in `app-shell-header-nav`) and the Explore popup ship together in this change so there is no window where `/ai` or `/recommendations` is unreachable

## 3. Profile Progress tab (profile-gamification-dashboard)

- [ ] 3.1 XP/level card with ARIA progress bar toward next level
- [ ] 3.2 Streak calendar heatmap (~12 weeks CSS grid, active days filled, streak count label, accessible summary, horizontal scroll <sm)
- [ ] 3.3 Rank/league card linking to `/leaderboard` + badges grid with empty state
- [ ] 3.4 Embed `SkillGraph` full-graph section below dashboard under localized heading (no graph internals re-implemented)
- [ ] 3.5 Progress-tab skeleton mirroring dashboard layout; single-column stacking <sm
- [ ] 3.6 Identity card: add streak + rank chips (reuse `GamificationChip` + shared hook)
- [ ] 3.7 i18n `profile.progress.*` (vi+en)

## 4. Portfolio tab (profile-portfolio-showcase)

- [ ] 4.1 Projects list + external links seeded from `useQueryMyPortfolioSwr`; loading skeleton + empty state with CTA
- [ ] 4.2 CRUD-lite: add/edit forms and remove-with-confirmation on local state (no persistence — mock assumption noted in code)
- [ ] 4.3 i18n `profile.portfolio.*` (vi+en); labeled inputs, keyboard-operable actions, external-link indicators

## 5. Community tab (profile-community-summary)

- [ ] 5.1 Reputation snapshot (score + post/comment/reaction counts with labels) + recent posts list linking to community routes; skeleton + empty state
- [ ] 5.2 i18n `profile.community.*` (vi+en); focusable post rows

## 6. Verify

- [ ] 6.1 Manual pass: dropdown logged-in/guest, chip navigation, all profile tabs filled/empty/loading, mobile widths, vi/en toggle
- [ ] 6.2 `npm run build` (webpack) green
- [ ] 6.3 `tsc --noEmit` clean
