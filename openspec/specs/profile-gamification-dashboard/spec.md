# profile-gamification-dashboard Specification

## Purpose
TBD - created by archiving change profile-avatar-hub. Update Purpose after archive.
## Requirements

### Requirement: Progress tab gamification dashboard
The profile Progress tab SHALL replace its placeholder with a gamification dashboard fed by `useQueryMyGamificationSwr`, containing: an XP/level card with a progress bar toward the next level, a streak calendar heatmap of roughly the last 12 weeks (day cells shaded active/inactive, current streak count labeled), a rank/league card (position + league name linking to `/leaderboard`), and a badges grid (earned badges with name and date).

#### Scenario: Dashboard renders
- **WHEN** a logged-in user opens the profile Progress tab with loaded data
- **THEN** the XP/level progress bar, streak heatmap, rank/league card, and badges grid all render with the shared hook's values

#### Scenario: Streak heatmap marks active days
- **WHEN** the heatmap renders
- **THEN** each day cell for a date in the streak data is visually filled and other days are muted
- **AND** the current streak count is labeled next to the heatmap

#### Scenario: Dashboard loading state
- **WHEN** the Progress tab opens while data is loading
- **THEN** a skeleton mirroring the dashboard layout (bar card, heatmap grid, rank card, badges grid) renders instead of the content

#### Scenario: No badges yet
- **WHEN** the snapshot contains zero badges
- **THEN** the badges section shows a localized empty state instead of an empty grid

### Requirement: Embedded skill graph section
The Progress tab SHALL include a skill-graph section below the gamification dashboard that embeds the `SkillGraph` feature component from change `skill-graph-spider` in full-graph (subject-agnostic) mode. This capability MUST NOT redefine graph internals (layout, interactions, mobile fallback) — those requirements belong to `skill-graph-view`.

#### Scenario: Skill graph embeds on Progress tab
- **WHEN** the Progress tab renders for a logged-in user
- **THEN** the `SkillGraph` component mounts in its full-graph mode under a localized section heading
- **AND** its own loading/empty/mobile behavior applies as spec'd in `skill-graph-view`

### Requirement: Identity card streak and rank chips
The profile identity card (left column) SHALL display streak and rank chips using the same chip component and the same shared hook as the account dropdown.

#### Scenario: Identity card shows chips
- **WHEN** the profile page renders for a logged-in user with loaded data
- **THEN** the identity card shows a streak chip and a rank chip whose values match the dropdown's chips exactly

### Requirement: Progress tab responsive, i18n, a11y
On viewports below `sm`, dashboard cards SHALL stack in one column and the heatmap SHALL remain horizontally scrollable rather than shrinking cells below tap size. All strings (section headings, card labels, heatmap legend, empty states) SHALL be localized vi/en. The heatmap MUST expose an accessible summary (e.g., `aria-label` with current streak) rather than requiring per-cell reading, and the progress bar MUST expose its value via ARIA.

#### Scenario: Mobile layout
- **WHEN** the Progress tab renders below the `sm` breakpoint
- **THEN** cards stack vertically in one column and the heatmap scrolls horizontally with cells at a tappable size

#### Scenario: Localized and accessible dashboard
- **WHEN** the locale is vi or en
- **THEN** every dashboard string renders localized
- **AND** the XP progress bar exposes current/max via ARIA and the heatmap has a text summary of the streak
