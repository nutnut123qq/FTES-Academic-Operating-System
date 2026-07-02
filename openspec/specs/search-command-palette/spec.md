# search-command-palette Specification

## Purpose
TBD - created by archiving change global-search-redesign. Update Purpose after archive.
## Requirements
### Requirement: Open and close the search overlay
The system SHALL provide a global command-palette search overlay, opened from the navbar
search button or the Ctrl/Cmd+K shortcut, and closed via Esc, backdrop press, or result
navigation. The overlay SHALL be a top-aligned modal on `sm:` viewports and up.

#### Scenario: Open via keyboard shortcut
- **GIVEN** the user is anywhere in the app shell with no other modal open
- **WHEN** the user presses Ctrl+K (or Cmd+K on macOS)
- **THEN** the search overlay opens with the search input focused
- **AND** the browser's default Ctrl/Cmd+K behavior is prevented

#### Scenario: Open via navbar button
- **WHEN** the user presses the navbar search button
- **THEN** the search overlay opens with the search input focused

#### Scenario: Close via Esc
- **GIVEN** the search overlay is open
- **WHEN** the user presses Esc
- **THEN** the overlay closes and focus returns to the element focused before opening

#### Scenario: Mobile full-screen overlay
- **GIVEN** the viewport is below the `sm` breakpoint
- **WHEN** the search overlay opens
- **THEN** it renders as a full-screen sheet with the input pinned at the top and a visible
  close affordance

### Requirement: Debounced autocomplete query
The overlay SHALL query the real `autocompleteGlobalSearch` contract with the typed query,
debounced 300 ms, only when the trimmed query has at least 2 characters and the user is
authenticated. While a query is in flight the overlay SHALL show a loading indicator without
discarding previously rendered results.

#### Scenario: Typing triggers a debounced fetch
- **GIVEN** the overlay is open and the user is authenticated
- **WHEN** the user types "reac" within 300 ms keystroke intervals
- **THEN** exactly one autocomplete request is sent with query "reac" after typing pauses 300 ms

#### Scenario: Query below minimum length does not fetch
- **WHEN** the trimmed query is shorter than 2 characters
- **THEN** no request is sent
- **AND** the overlay shows the empty-query state (recent searches) instead of results

#### Scenario: Loading state
- **WHEN** a debounced request is in flight
- **THEN** a loading indicator is visible in the overlay
- **AND** previously rendered results for the prior query remain visible until the response lands

#### Scenario: Error state
- **WHEN** the autocomplete request fails
- **THEN** the overlay shows an inline error message with a retry action
- **AND** does not crash or close

#### Scenario: Unauthenticated user
- **GIVEN** the user is not authenticated
- **WHEN** the overlay is open
- **THEN** no autocomplete request is sent
- **AND** the overlay shows a sign-in prompt that opens the auth login flow

### Requirement: Results grouped by entity type
The overlay SHALL render results grouped by entity type (courses, modules, contents, lesson
videos, challenges, milestones, milestone tasks, flashcard decks), each group with a localized
heading, and each row showing an entity icon, title, and its `parentPath` breadcrumb when
available. Empty groups SHALL be omitted.

#### Scenario: Grouped results render
- **WHEN** the query returns hits in courses and challenges only
- **THEN** exactly two group sections render, "Courses" and "Challenges" (localized), in canonical
  group order
- **AND** each row shows the entity icon, title, and breadcrumb (e.g. course › module › content)

#### Scenario: No results
- **WHEN** the query returns no hits in any group
- **THEN** the overlay shows a localized no-results message including the typed query
- **AND** the "See all results" footer remains available

### Requirement: Keyboard navigation
The overlay SHALL support full keyboard navigation across all rendered rows: ArrowUp/ArrowDown
move the active option across group boundaries (wrapping at the ends), Enter activates the
active option, and pointer hover moves the active option.

#### Scenario: Arrow keys traverse groups
- **GIVEN** results render in two groups
- **WHEN** the user presses ArrowDown repeatedly from the input
- **THEN** the active highlight moves through every row of the first group then the second,
  wrapping to the first row after the last

#### Scenario: Enter opens the active result
- **GIVEN** a result row is active
- **WHEN** the user presses Enter
- **THEN** the app navigates to that row's entity route and the overlay closes

### Requirement: Entity routing
Activating a result row SHALL deep-link to the canonical route for its entity type, preferring
the server-provided `path` and otherwise building the route from `parentPath`: course → course
detail, module → module learn view, content → content learn view, lesson video → owning content,
challenge → challenge solve view, milestone/milestone task → owning personal-project page,
flashcard deck → owning course's flashcards. A row whose route cannot be resolved SHALL render
non-interactive.

#### Scenario: Course result routes to course detail
- **WHEN** the user activates a course result with displayId "course-001"
- **THEN** the app navigates to the course detail route for "course-001" and the overlay closes

#### Scenario: Challenge result routes to solve view
- **WHEN** the user activates a challenge result whose `parentPath` has module, content, and
  challenge refs
- **THEN** the app navigates to that challenge's solve route built from those refs

#### Scenario: Unroutable result is inert
- **WHEN** a result has no `path` and an incomplete `parentPath`
- **THEN** the row renders without link semantics and is skipped by keyboard activation

### Requirement: Recent searches
The overlay SHALL persist submitted queries to device-local storage (most recent first, deduped,
maximum 8) and show them in the empty-query state, where selecting one re-runs it and a clear
action removes all. Storage failures SHALL degrade silently to hiding the feature.

#### Scenario: Recent search is recorded
- **WHEN** the user activates a result or presses "See all results" for query "docker"
- **THEN** "docker" is stored at the head of the recent-searches list without duplicates

#### Scenario: Recent searches render on empty query
- **GIVEN** stored recent searches exist
- **WHEN** the overlay opens with an empty input
- **THEN** the recent searches render as selectable rows under a localized heading
- **AND** selecting one fills the input and triggers the query

#### Scenario: Clear recent searches
- **WHEN** the user presses the clear action
- **THEN** all recent searches are removed from storage and the list disappears immediately

#### Scenario: Empty query with no history
- **GIVEN** no recent searches are stored
- **WHEN** the overlay opens with an empty input
- **THEN** a localized hint prompts the user to start typing

### Requirement: See all results handoff
The overlay SHALL show a persistent footer action that navigates to `/search?q=<query>` carrying
the current query, closing the overlay.

#### Scenario: Footer navigates to the search page
- **GIVEN** the overlay is open with query "react"
- **WHEN** the user presses "See all results" (or Enter with no active option)
- **THEN** the app navigates to `/search?q=react` and the overlay closes
- **AND** the `/search` page input is pre-filled with "react"

### Requirement: Accessibility combobox pattern
The overlay SHALL implement the WAI-ARIA combobox pattern: input with `role="combobox"`,
`aria-expanded`, and `aria-activedescendant`; results as `role="listbox"` with grouped
`role="option"` rows; focus retained in the input while arrows move the active option; all
strings localized in Vietnamese and English.

#### Scenario: Screen reader semantics
- **WHEN** results render and the user arrows to the second option
- **THEN** the input's `aria-activedescendant` references that option's id
- **AND** the option is marked selected while DOM focus stays on the input

#### Scenario: Localized strings
- **WHEN** the app locale is vi or en
- **THEN** all overlay labels, group headings, hints, and empty/error messages render in that
  locale with no hard-coded language strings

