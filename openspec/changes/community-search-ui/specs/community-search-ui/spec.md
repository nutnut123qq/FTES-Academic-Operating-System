## ADDED Requirements

### Requirement: Community page keyword search with time sort and type filter

The community page SHALL provide a keyword search (title/content), a time sort (newest default / oldest),
and a post-type filter above the feed. Entering a keyword or choosing a filter SHALL show global search
results (all published posts); clearing them SHALL return to the tab feed.

#### Scenario: Search replaces the tab feed

- **WHEN** the user types a keyword
- **THEN** the feed shows matching published posts (debounced) instead of the current tab feed

#### Scenario: Clearing returns to the tab feed

- **WHEN** the user clears the keyword and filters
- **THEN** the current tab feed is shown again
