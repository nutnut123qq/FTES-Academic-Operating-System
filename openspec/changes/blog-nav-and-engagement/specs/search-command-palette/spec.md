# search-command-palette — Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
