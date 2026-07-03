# subject-ai-quiz-flashcards Specification

## Purpose
TBD - created by archiving change workplace-ai. Update Purpose after archive.
## Requirements
### Requirement: Generate a quiz from subject material
The quiz surface SHALL let a member pick source material (subject resource/lesson) and
options (question count), then generate a mock multiple-choice quiz the member can answer
and get graded on FE-side. All strings SHALL be localized (vi/en).

#### Scenario: Generate with loading state
- **WHEN** the member picks a source, sets a question count, and triggers generate
- **THEN** a generation loading state is shown, then a mock quiz of the requested length renders, each question referencing the subject/source context

#### Scenario: Answer and grade
- **WHEN** the member answers all questions (options as accessible radio groups) and submits
- **THEN** a localized result view shows the score, per-question correct/incorrect marking, and actions to retry the same quiz or generate a new one

#### Scenario: Quiz error and empty source
- **WHEN** generation fails (mock failure path)
- **THEN** a localized error state with retry is shown
- **WHEN** the subject has no source material
- **THEN** a localized empty state links to the Resources tab

### Requirement: Generate flashcards from subject material
The flashcards surface SHALL generate a mock deck of term/definition cards from picked
subject material, browsable as a flip deck. All strings SHALL be localized (vi/en).

#### Scenario: Generate and browse the deck
- **WHEN** the member picks a source and triggers generate
- **THEN** after a loading state, a deck of mock cards renders with a position indicator (e.g. "3/10")
- **AND** the member can flip the current card (click/keyboard, control has an accessible name) and navigate previous/next

#### Scenario: Deck states
- **WHEN** the member reaches the last card
- **THEN** an end state offers restart and regenerate actions
- **WHEN** generation fails or no source exists
- **THEN** the same localized error/empty handling as the quiz applies

#### Scenario: Mobile layout
- **WHEN** quiz or flashcards render below the `sm` breakpoint
- **THEN** the surface stays single-column in-panel with no overlay stacking, and cards/questions remain fully operable by touch
