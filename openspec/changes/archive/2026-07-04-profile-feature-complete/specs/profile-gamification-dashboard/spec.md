## MODIFIED Requirements

### Requirement: Progress tab gamification dashboard
The profile Progress tab SHALL replace its placeholder with a gamification dashboard fed by `useQueryMyGamificationSwr`, containing: an XP/level card with a progress bar toward the next level, a streak calendar heatmap of roughly the last 12 weeks, a rank/league card, and a badges grid.

#### Scenario: Dashboard renders
- **WHEN** a logged-in user opens the profile Progress tab with loaded data
- **THEN** the XP/level progress bar, streak heatmap, rank/league card, and badges grid all render with the shared hook's values

#### Scenario: Dashboard loading state
- **WHEN** the Progress tab opens while data is loading
- **THEN** a skeleton mirroring the dashboard layout renders instead of the content

## ADDED Requirements

### Requirement: Progress tab displays wallet and reputation snapshot
The Progress tab SHALL display FTES Coin balance and Reputation score as top-level metric cards above the existing gamification dashboard.

#### Scenario: Wallet and reputation load
- **WHEN** the Progress tab renders with wallet and community summary data
- **THEN** FTES Coin and Reputation metric cards appear before the XP/level row

#### Scenario: Wallet or reputation missing
- **WHEN** either data source is empty
- **THEN** the corresponding metric card renders `0` or an empty state
