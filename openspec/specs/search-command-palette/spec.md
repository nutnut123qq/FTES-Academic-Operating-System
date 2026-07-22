# search-command-palette Specification

## Purpose
TBD - created by archiving change global-search-redesign. Update Purpose after archive.
## Requirements
### Requirement: Open and close the search overlay
The full-screen search overlay SHALL remain the search surface on viewports below the `md` breakpoint ONLY: opened from the navbar search icon or the Ctrl/Cmd+K shortcut, closed via Esc, backdrop press, the visible close affordance, or result navigation, rendering as a full-screen sheet with the input pinned at the top. On `md` and larger viewports the navbar SHALL host the inline search input (see "Inline navbar search dropdown on desktop") and pressing Ctrl/Cmd+K SHALL focus that inline input instead of opening the overlay. The Ctrl/Cmd+K shortcut SHALL be registered in exactly one place (the navbar container) — the overlay component SHALL NOT register its own duplicate listener.

#### Scenario: Mobile full-screen overlay

- **GIVEN** the viewport is below the `md` breakpoint
- **WHEN** the user presses the navbar search icon
- **THEN** the search overlay opens as a full-screen sheet with the input focused and a visible close affordance

#### Scenario: Keyboard shortcut on desktop focuses the inline input

- **GIVEN** a viewport at or above `md`
- **WHEN** the user presses Ctrl+K (or Cmd+K on macOS)
- **THEN** the inline navbar search input receives focus (no overlay opens)
- **AND** the browser's default Ctrl/Cmd+K behavior is prevented

#### Scenario: Keyboard shortcut on mobile opens the overlay

- **GIVEN** a viewport below `md` (e.g. a tablet with a hardware keyboard)
- **WHEN** the user presses Ctrl/Cmd+K
- **THEN** the full-screen search overlay opens with the input focused

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

### Requirement: Inline navbar search dropdown on desktop
On viewports at or above `md`, the navbar SHALL render a REAL search input (replacing the press-to-open trigger) that the user types into directly. When the input is focused and the trimmed query reaches the minimum length, a results dropdown SHALL open anchored directly below the input, reusing the shared debounced search state (`useGlobalSearch` — 300 ms debounce, min 2 chars, authenticated gate) and the existing grouped-results rendering. The dropdown SHALL support the same states as the overlay (loading without discarding previous results, inline error with retry, localized no-results, sign-in prompt for guests) and a persistent "See all results" action navigating to `/search?q=<query>`. The dropdown SHALL close on Esc (keeping input focus and query), on outside interaction, and after activating a result; activating a result SHALL navigate to its entity route and record the query in recent searches. The input SHALL implement the WAI-ARIA combobox pattern with ArrowUp/ArrowDown moving the active option (wrapping) and Enter activating it (or handing off to `/search` when none is active).

#### Scenario: Typing directly in the navbar shows results below the field

- **GIVEN** an authenticated user on a desktop viewport
- **WHEN** they click the navbar search field and type "docker" (≥ 2 chars, 300 ms pause)
- **THEN** a dropdown opens directly under the field showing grouped real results
- **AND** no separate panel/drawer opens and the page behind stays interactive-visible

#### Scenario: Keyboard navigation inside the dropdown

- **GIVEN** the dropdown shows results in two groups
- **WHEN** the user presses ArrowDown twice then Enter
- **THEN** the second flattened result activates: the app navigates to its route, the dropdown closes, and the query is stored in recent searches

#### Scenario: Esc closes only the dropdown

- **GIVEN** the dropdown is open with a typed query
- **WHEN** the user presses Esc
- **THEN** the dropdown closes while the input keeps focus and its text, and a subsequent keystroke reopens it

#### Scenario: Outside click dismisses

- **WHEN** the user clicks anywhere outside the input and its dropdown
- **THEN** the dropdown closes without clearing the query

#### Scenario: Guest sees a sign-in prompt, no request fired

- **GIVEN** an unauthenticated visitor on desktop
- **WHEN** they type 2+ characters in the navbar field
- **THEN** no search request is sent and the dropdown shows a localized sign-in prompt that opens the auth flow

#### Scenario: See all results handoff

- **GIVEN** the dropdown is open with query "react"
- **WHEN** the user presses the "See all results" action (or Enter with no active option)
- **THEN** the app navigates to `/search?q=react`, the dropdown closes, and the `/search` page input is pre-filled with "react"

