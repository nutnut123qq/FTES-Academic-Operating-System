# community-search-ui (delta)

## MODIFIED Requirements

### Requirement: Community page keyword search with time sort and type filter

The community page SHALL provide a keyword search (title/content), a time sort (newest default /
oldest), and a post-type filter above the feed. Entering a keyword, choosing a type/author/group
filter, OR selecting a non-default sort (Oldest) SHALL show global search results (all published
posts); returning every dimension to its default — empty keyword, no filter, and Newest sort — SHALL
return to the tab feed.

#### Scenario: Search replaces the tab feed

- **WHEN** the user types a keyword
- **THEN** the feed shows matching published posts (debounced) instead of the current tab feed

#### Scenario: Non-default sort routes through search

- **WHEN** the user selects the Oldest sort with no keyword and no filter
- **THEN** the feed routes through community search (which honours `sort`) instead of the tab feed
- **AND** posts are shown oldest-first

#### Scenario: Clearing returns to the tab feed

- **WHEN** the user clears the keyword and filters and the sort is Newest
- **THEN** the current tab feed is shown again
