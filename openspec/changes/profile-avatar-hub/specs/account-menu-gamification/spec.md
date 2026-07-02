## ADDED Requirements

### Requirement: Logged-in dropdown header with level ring
The account menu dropdown SHALL, for a logged-in user, render its header block as the user's avatar wrapped in a level progress ring (ring fill = progress toward the next level, current level number labeled) alongside the user's name and email, followed by the stats row, then the existing menu links (Profile, Saved, Settings), theme switch, and logout — in that order.

#### Scenario: Logged-in dropdown opens
- **WHEN** a logged-in user clicks their avatar in the navbar
- **THEN** the dropdown shows avatar + name + email with a level ring around the avatar indicating current level and progress to the next level
- **AND** below it a stats row, then menu links (Profile, Saved, Settings), theme switch, and logout in unchanged order

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
