# post-engagement — Delta

## ADDED Requirements

### Requirement: Zero-count suppression (opt-in)
The engagement bar SHALL support an opt-in `hideZeroCounts` mode: when enabled, a
count of 0 SHALL render nothing next to its icon (the icon alone remains); counts of
1 or more render as before. The mode defaults to OFF so existing surfaces keep their
current behavior. Community feed rows and the community post detail SHALL enable it.

#### Scenario: Zero count renders silent icon
- **GIVEN** a community feed post with 0 likes and 0 comments
- **WHEN** its engagement bar renders with `hideZeroCounts`
- **THEN** the like and comment icons render with no adjacent number

#### Scenario: Non-zero counts unaffected
- **GIVEN** a community post with 42 likes
- **WHEN** its engagement bar renders with `hideZeroCounts`
- **THEN** the like count "42" renders inline next to the heart as before

#### Scenario: Default behavior unchanged elsewhere
- **GIVEN** a surface that does not pass `hideZeroCounts` (e.g. group feed)
- **WHEN** a post with 0 likes renders
- **THEN** the count renders exactly as it did before this change
