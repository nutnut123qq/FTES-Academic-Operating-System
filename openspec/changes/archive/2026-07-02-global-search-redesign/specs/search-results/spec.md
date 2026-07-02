# search-results — Delta Specification

## MODIFIED Requirements

### Requirement: Global search results at `/search`
The system SHALL provide a global search page at `/search` that runs the user's query against
the real `autocompleteGlobalSearch` contract for learning entities (courses, modules, contents,
lesson videos, challenges, milestones, milestone tasks, flashcard decks) and against mock
providers for community categories the backend does not index yet (users, posts, groups,
resources — recorded assumption), rendering hits grouped by category. The query SHALL be
URL-driven via `?q=` (pre-filled on load, updated on debounced typing) and SHALL follow the
shared query rules (300 ms debounce, minimum 2 trimmed characters, loading and error states).
Real-category fetching SHALL require authentication; when unauthenticated the page SHALL show a
sign-in prompt for real categories while mock categories still render.

#### Scenario: Empty search prompt
- **WHEN** the user visits `/search` with no query entered
- **THEN** the page renders a search input and an empty-state message prompting the user to
  type to search

#### Scenario: URL query pre-fills the page
- **WHEN** the user opens `/search?q=react` (e.g. via the overlay's "See all results")
- **THEN** the input is pre-filled with "react" and results for "react" load automatically

#### Scenario: Search returns grouped results
- **GIVEN** the user is authenticated
- **WHEN** the user types a query of at least 2 characters and the 300 ms debounce elapses
- **THEN** the page renders one section per non-empty category — real entity groups from the
  autocomplete contract plus mock community groups — each with a localized heading and rows
- **AND** each row shows a category icon, a title, and a supporting line (breadcrumb or subtitle)

#### Scenario: No results
- **WHEN** the user's query matches nothing in any category
- **THEN** the page shows a localized no-results message including the query instead of result
  sections

#### Scenario: Open a result
- **WHEN** the user activates a result row
- **THEN** the app deep-links to that entity's canonical route (course detail, module/content
  learn view, challenge solve view, personal-project page, flashcards page) built from the
  server `path` or `parentPath`; mock community rows link to their domain surface

#### Scenario: Loading and error states
- **WHEN** the real-category request is in flight
- **THEN** a loading skeleton mirrors the results layout
- **AND WHEN** the request fails
- **THEN** an inline error message with a retry action renders for the real categories without
  hiding mock categories

#### Scenario: Unauthenticated visitor
- **GIVEN** the user is not authenticated
- **WHEN** the user searches on `/search`
- **THEN** real entity categories are replaced by a sign-in prompt
- **AND** mock community categories still render their matches

## ADDED Requirements

### Requirement: Category filter tabs
The `/search` page SHALL provide filter tabs — "All" plus one tab per category with a hit-count
badge — that filter the rendered sections client-side. Tabs for categories with zero hits SHALL
be disabled. Tabs with both icon and label SHALL hide the label below the `sm` breakpoint while
keeping an accessible name.

#### Scenario: Filter by category
- **GIVEN** results exist in courses and users
- **WHEN** the user selects the "Courses" tab
- **THEN** only the courses section renders
- **AND** selecting "All" restores every non-empty section

#### Scenario: Empty category tab disabled
- **WHEN** a category has zero hits for the current query
- **THEN** its tab renders disabled with a 0 count

### Requirement: Matched-term highlighting
Result rows SHALL visually highlight the matched query term inside titles and text snippets,
case-insensitively, using semantic mark styling.

#### Scenario: Title highlight
- **WHEN** the query "docker" matches a result titled "Docker Fundamentals"
- **THEN** the "Docker" portion of the title renders highlighted

### Requirement: Breadcrumb parent path on result rows
Rows for learning entities SHALL display their `parentPath` ancestor chain as a breadcrumb
(e.g. course › module › content) when the contract provides it; rows without a resolvable
route SHALL render non-interactive with the breadcrumb only.

#### Scenario: Breadcrumb renders
- **WHEN** a content hit has `parentPath` with course and module refs
- **THEN** the row shows "course title › module" style breadcrumb text under the title

### Requirement: Per-category load more
Each real category section SHALL initially render at most 5 rows with a "show more" action
revealing the remaining fetched rows for that category (client-side over the fetched set, as
the backend contract has no offset pagination — recorded assumption).

#### Scenario: Show more reveals remaining rows
- **GIVEN** a category has 12 fetched hits
- **WHEN** the section renders
- **THEN** 5 rows show with a "show more" action indicating the remainder
- **AND** activating it reveals the remaining 7 rows and removes the action
