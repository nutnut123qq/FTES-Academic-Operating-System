# account-menu-gamification Specification

## Purpose
TBD - created by archiving change profile-avatar-hub. Update Purpose after archive.
## Requirements

### Requirement: Logged-in dropdown header with level ring
The account menu dropdown SHALL, for a logged-in user, render its header block as the user's avatar wrapped in a level progress ring (ring fill = progress toward the next level, current level number labeled) alongside the user's name and email, followed by the stats row, then the "Khám phá" (Explore) section, then the existing menu links (Profile, Saved, Settings), theme switch, and logout — in that order.

#### Scenario: Logged-in dropdown opens
- **WHEN** a logged-in user clicks their avatar in the navbar
- **THEN** the dropdown shows avatar + name + email with a level ring around the avatar indicating current level and progress to the next level
- **AND** below it a stats row, then the Explore section, then menu links (Profile, Saved, Settings), theme switch, and logout in that order

#### Scenario: Guest dropdown unchanged
- **WHEN** a guest (not logged in) opens the account menu
- **THEN** the existing guest content renders exactly as before, with no level ring, no stats row, and no gamification content

### Requirement: Gamification stats chip row
The dropdown SHALL render a compact stats row of three chips — streak (flame icon + day count), rank (trophy icon + position), and XP (bolt icon + total) — fed exclusively by `useQueryMyGamificationSwr`. Each chip MUST be a navigable link: streak and XP chips navigate to the profile Progress tab, the rank chip navigates to `/leaderboard`, and navigation closes the dropdown.

#### Scenario: Stats chips render
- **WHEN** the logged-in dropdown is open and gamification data has loaded
- **THEN** three chips show streak days, rank position, and XP total matching the shared hook's values

#### Scenario: Chip navigation
- **WHEN** the user activates the rank chip
- **THEN** the app navigates to `/leaderboard` and the dropdown closes
- **AND** activating the streak or XP chip navigates to the profile Progress tab and closes the dropdown

#### Scenario: Stats loading skeleton
- **WHEN** the dropdown opens while gamification data is still loading
- **THEN** three skeleton chips of the same dimensions render in place of the stats row
- **AND** the dropdown height does not shift when real chips replace the skeletons

#### Scenario: Stats error fallback
- **WHEN** the gamification hook errors with no data
- **THEN** the stats row is omitted entirely and the remaining dropdown content (links, theme, logout) still works

### Requirement: Dropdown i18n and accessibility
All new dropdown strings (chip labels, level label) SHALL be localized in Vietnamese and English. Each chip MUST have an accessible name describing its metric and value (e.g., "Streak: 7 days"), the level ring MUST expose its meaning via `aria-label`, and chips MUST be keyboard-focusable in the dropdown's tab order.

#### Scenario: Localized chips
- **WHEN** the locale is vi or en
- **THEN** chip labels and the level label render in that locale with no hard-coded copy

#### Scenario: Screen reader announces stats
- **WHEN** a screen-reader user focuses a stats chip
- **THEN** the metric name and value are announced (icon-only visuals carry `aria-label`s)
- **AND** keyboard users can reach and activate each chip with Tab and Enter

### Requirement: Explore ("Khám phá") shortcuts section in the popup
The account menu popup SHALL render a labeled "Khám phá" (Explore) section, placed between the gamification stats row and the account menu links (divided from both), containing exactly four discovery shortcuts, each a single row with a phosphor icon + localized label: **Trợ lý AI** (Robot icon → `/ai`), **Dành cho bạn / For You** (Newspaper icon → the community For You feed), **Gợi ý cho bạn / Recommendations** (Sparkle icon → `/recommendations`), and **Thịnh hành / Trending** (TrendUp icon → the community Trending view). Activating any shortcut for a logged-in user SHALL close the popup and navigate to its destination. These shortcuts are the relocated discovery entries removed from the header dropdowns (owned by change `app-shell-header-nav`); the routes `/ai` and `/recommendations` SHALL remain valid.

#### Scenario: Explore section renders in logged-in popup
- **GIVEN** a logged-in user
- **WHEN** the account popup opens
- **THEN** a "Khám phá" section renders between the stats row and the menu links, listing Trợ lý AI, Dành cho bạn, Gợi ý cho bạn, and Thịnh hành, each with its phosphor icon and localized label

#### Scenario: Explore shortcut routes correctly
- **GIVEN** the logged-in popup is open
- **WHEN** the user activates the Trợ lý AI shortcut
- **THEN** the popup closes and the app navigates to `/ai`
- **AND** activating Gợi ý cho bạn navigates to `/recommendations`, Dành cho bạn navigates to the community For You feed, and Thịnh hành navigates to the community Trending view

#### Scenario: Guest handling of Explore shortcuts
- **GIVEN** a guest (not logged in) with the account popup open
- **WHEN** the guest activates the public shortcuts Dành cho bạn (For You) or Thịnh hành (Trending)
- **THEN** the app navigates to the community feed/trending view without requiring login
- **AND** activating the auth-gated shortcuts Trợ lý AI or Gợi ý cho bạn opens the AuthenticationModal instead of navigating, resuming to `/ai` or `/recommendations` after successful login

#### Scenario: Explore section mobile parity
- **GIVEN** a mobile viewport where the account menu renders as its mobile drawer/popup form
- **WHEN** the account surface opens
- **THEN** the "Khám phá" section renders with the same four shortcuts in the same order (header → stats → Khám phá → links → theme → logout)

#### Scenario: Explore i18n and accessibility
- **GIVEN** the locale is vi or en
- **WHEN** the Explore section renders
- **THEN** the section title and every shortcut label come from `profileMenu.explore.*` message keys in that locale with no hard-coded copy
- **AND** each shortcut exposes menu-item semantics with an accessible name, is keyboard-focusable in the popup tab order, and its icon-only visual carries an `aria-label`
