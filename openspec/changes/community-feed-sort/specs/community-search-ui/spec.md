# community-search-ui (delta)

## MODIFIED Requirements

### Requirement: Community page keyword search with time sort and type filter

The community page SHALL provide a keyword search (title/content), a time sort (newest default /
oldest), and a post-type filter above the feed. Entering a keyword OR choosing a type/author/group
filter SHALL show global search results (all published posts); clearing every keyword/filter SHALL
return to the tab feed. The time sort SHALL apply to whichever feed is shown — the tab feed when no
keyword/filter is set, or the search results when one is — and SHALL NOT by itself switch between
them.

#### Scenario: Keyword or filter replaces the tab feed

- **WHEN** the user types a keyword or picks a type/author/group filter
- **THEN** the feed shows matching published posts (debounced) instead of the current tab feed

#### Scenario: Sort alone re-orders in place, without switching to search

- **WHEN** the user selects the Oldest sort with no keyword and no filter
- **THEN** the CURRENT tab feed is re-ordered oldest-first (via `feed(..., sort)`)
- **AND** the feed does NOT switch to global community search

#### Scenario: Search still honours the sort

- **WHEN** a keyword search is active and the user selects the Oldest sort
- **THEN** the search results are shown oldest-first

#### Scenario: Clearing returns to the tab feed

- **WHEN** the user clears the keyword and filters
- **THEN** the current tab feed is shown again (in the currently selected sort)
