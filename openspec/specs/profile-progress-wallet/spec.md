# profile-progress-wallet Specification

## Purpose
TBD - created by archiving change profile-feature-complete. Update Purpose after archive.
## Requirements
### Requirement: Progress tab displays FTES Coin balance
The Progress tab SHALL render the current FTES Coin balance as a metric card.

#### Scenario: Wallet loads
- **WHEN** the wallet hook returns a balance
- **THEN** a FTES Coin metric card renders the balance and links to the wallet page

### Requirement: Progress tab displays Reputation
The Progress tab SHALL render the user's reputation score as a metric card.

#### Scenario: Reputation loads
- **WHEN** the community summary hook returns a reputation score
- **THEN** a Reputation metric card renders the score and links to the community

### Requirement: Progress tab keeps existing gamification dashboard
The Progress tab SHALL continue to show XP/level, rank/league, streak heatmap, badges, and skill graph.

#### Scenario: Progress tab renders
- **WHEN** the Progress tab is active
- **THEN** the wallet/reputation row renders above the existing dashboard sections

