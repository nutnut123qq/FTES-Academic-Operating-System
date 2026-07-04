## MODIFIED Requirements

### Requirement: Progress tab displays FTES Coin balance
The Progress tab SHALL render the current FTES Coin balance as a metric card, independent of the gamification dashboard's load state.

#### Scenario: Wallet loads
- **WHEN** the wallet hook returns a balance
- **THEN** a FTES Coin metric card renders the balance and links to the wallet page

#### Scenario: Gamification unavailable
- **WHEN** the gamification fetch is loading, empty, or failed
- **THEN** the FTES Coin metric card still renders from its own wallet hook

### Requirement: Progress tab displays Reputation
The Progress tab SHALL render the user's reputation score as a metric card, independent of the gamification dashboard's load state.

#### Scenario: Reputation loads
- **WHEN** the community summary hook returns a reputation score
- **THEN** a Reputation metric card renders the score and links to the community

#### Scenario: Gamification unavailable
- **WHEN** the gamification fetch is loading, empty, or failed
- **THEN** the Reputation metric card still renders from its own community-summary hook
