# subject-ai-hub Specification

## Purpose
TBD - created by archiving change workplace-ai. Update Purpose after archive.
## Requirements
### Requirement: AI tab is a functional tool hub
The AI tab at `/subjects/[subjectId]/ai` SHALL render a hub of AI tool cards
(tutor, summary, quiz, flashcards, ocr) where each available tool's CTA opens that
tool's working surface inside the tab; a back action SHALL return to the hub. All
strings SHALL be localized (vi/en).

#### Scenario: Open a tool from its card
- **WHEN** a workspace member clicks the CTA on an available tool card (tutor, summary, quiz, or flashcards)
- **THEN** the card grid is replaced in-place by that tool's surface within the tab content region
- **AND** a back control (with `aria-label`) returns to the hub grid, preserving any in-progress tool state for the SPA session

#### Scenario: Coming-soon tool stays a shell
- **WHEN** the hub renders the OCR card
- **THEN** the card shows a localized "coming soon" state and its CTA is disabled
- **AND** no OCR surface can be opened

#### Scenario: Hub loading and error states
- **WHEN** the tool list is loading
- **THEN** a skeleton mirroring the card grid is shown (identity header/tab chrome stays static)
- **WHEN** loading fails with no cached data
- **THEN** a localized error state with a retry action is shown instead of the grid

### Requirement: AI tools are gated on workspace membership
The system SHALL only allow workspace members (enrolled in the subject) to open AI tool
surfaces. Gating SHALL use the enroll/join axis — copy and CTA say join/enroll, never a
separate VIP/membership product.

#### Scenario: Non-member sees locked hub
- **WHEN** a non-member views the AI tab
- **THEN** tool cards render in a locked/disabled state with a lock indicator
- **AND** a single localized "join this workspace" CTA is shown
- **AND** activating any card CTA does not open a tool surface

#### Scenario: Guard holds beyond the button
- **WHEN** a non-member triggers tool opening through any path (e.g. stale state, keyboard)
- **THEN** the tool surface is not rendered and the locked hub remains
