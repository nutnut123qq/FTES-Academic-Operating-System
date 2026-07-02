# search-results Specification

## Purpose
TBD - created by archiving change search-results. Update Purpose after archive.
## Requirements
### Requirement: Global search results at `/search`
The system SHALL provide a global search page at `/search` that lets the user run a
query and see hits grouped by domain category (users, subjects, courses, resources,
community posts).

#### Scenario: Empty search prompt
- **WHEN** the user visits `/search` with no query entered
- **THEN** the page renders a titled surface with a single search input and an
  empty-state message prompting the user to type to search

#### Scenario: Search returns grouped results
- **WHEN** the user types a non-empty query into the search input
- **THEN** the page renders one section per non-empty category (users, subjects,
  courses, resources, posts), each with a heading and a list of rows
- **AND** each row shows a category icon, a title and a subtitle

#### Scenario: No results
- **WHEN** the user's query matches nothing in any category
- **THEN** the page shows a no-results message instead of result sections

#### Scenario: Open a result
- **WHEN** the user activates a result row
- **THEN** the app navigates to the row's linked domain surface (for example
  `/subjects`, `/courses`, `/resources`, `/community`, `/profile`)

