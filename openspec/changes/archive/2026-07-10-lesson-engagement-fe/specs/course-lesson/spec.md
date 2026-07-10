## ADDED Requirements

### Requirement: Discussion composer is collapsible
The learn player's top-level discussion composer SHALL render as a slim collapsed pill
(avatar + placeholder) that expands to the full textarea on interaction, so an empty
textarea never dominates the discussion zone above the thread.

#### Scenario: Collapsed until used
- **WHEN** the discussion renders and the viewer has not started a comment
- **THEN** the top-level composer shows a slim avatar + "write a comment" pill
- **WHEN** the viewer activates the pill
- **THEN** it expands to a textarea with submit / cancel controls

### Requirement: Optimistic comment reaction
The learn player SHALL reflect a comment like/unlike immediately in the UI (heart + count)
via an optimistic update, rolling back if the request fails, instead of blocking on a
full refetch.

#### Scenario: Instant like
- **WHEN** the viewer likes a comment
- **THEN** the heart and count update immediately without waiting for the request
- **WHEN** the request fails
- **THEN** the like is rolled back to its prior state

### Requirement: Movable AI entry
On desktop the AI entry point SHALL be draggable vertically (with a drag-vs-click threshold)
and SHALL persist its position, so the learner can park it clear of the reading column.

#### Scenario: Drag and persist
- **WHEN** the learner drags the AI FAB vertically past the drag threshold
- **THEN** the FAB moves and the click that opens the chat is suppressed for that gesture
- **AND** the new position is restored on the next visit

### Requirement: Contextual learn nudges
The content home SHALL surface a contextual nudges strip (e.g. rank / next step) computed
from existing learn data, with each nudge self-hiding when it has nothing to say.

#### Scenario: Nudge shows when meaningful
- **WHEN** the viewer has a computable rank or next step on the content home
- **THEN** a nudge for it is shown

#### Scenario: Nudge hides when empty
- **WHEN** a nudge has no meaningful value (e.g. zero rank)
- **THEN** that nudge is not shown
