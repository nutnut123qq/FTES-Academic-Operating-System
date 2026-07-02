## ADDED Requirements

### Requirement: Generate a summary from a picked subject source
The summary surface SHALL let a member pick one source (a resource or lesson of the
current subject, from the subject's mock catalog) and generate a mock summary for it.
All strings SHALL be localized (vi/en).

#### Scenario: Pick a source and generate
- **WHEN** the member selects a source from the subject's resource/lesson list and triggers generate
- **THEN** a loading state (skeleton or progress indicator mirroring the output layout) is shown
- **AND** a mock summary referencing the picked source's title renders as structured output (key points list + short abstract)

#### Scenario: Output actions
- **WHEN** a summary is displayed
- **THEN** the member can copy it (icon-only button with `aria-label`, localized success feedback) and regenerate it for the same source

#### Scenario: Empty and error states
- **WHEN** the subject has no resources/lessons to summarize
- **THEN** a localized empty state links to the Resources tab
- **WHEN** generation fails (mock failure path)
- **THEN** a localized error state with retry is shown and the previous summary, if any, is preserved

#### Scenario: Gated like the hub
- **WHEN** a non-member reaches the summary entry point
- **THEN** the surface does not open (hub gating applies)
