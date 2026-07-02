## 1. Shared data (my-gamification-data)

- [ ] 1.1 Confirm dependency: `skill-graph-spider` change implemented (SkillGraph component + `useQuerySkillGraphSwr` exist); if not, implement it first
- [ ] 1.2 Add types + mock `useQueryMyGamificationSwr` (xp, level, levelProgress, streak {current, days[]}, rank {position, league}, badges) — deterministic, matches leaderboard values 4820/12/7/3; empty when unauthenticated
- [ ] 1.3 Add mock `useQueryMyPortfolioSwr` and `useQueryMyCommunitySummarySwr` with seeded deterministic data

## 2. Account dropdown v2 (account-menu-gamification)

- [ ] 2.1 Build shared `GamificationChip` block (icon + value + accessible label) reused by dropdown and identity card
- [ ] 2.2 Extend `AccountMenuDropdown` UserSummary with level ring (SVG progress ring + level label, aria-label)
- [ ] 2.3 Add `GamificationStatsRow` (streak/rank/XP chips) between header and menu links; chips link to profile Progress / `/leaderboard` and close the dropdown
- [ ] 2.4 Skeleton chips (same dimensions) for loading; omit row on error; verify guest dropdown untouched
- [ ] 2.5 i18n `accountMenu.gamification.*` (vi+en); keyboard/tab order + aria-labels on chips

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
