## ADDED Requirements

### Requirement: Portfolio tab projects and links
The profile Portfolio tab SHALL replace its placeholder with a projects list (each project: title, short description, tech tags, external URL) and an external links section (label + URL, e.g., GitHub, LinkedIn), seeded from a mock hook `useQueryMyPortfolioSwr`.

#### Scenario: Portfolio renders seeded items
- **WHEN** a logged-in user opens the Portfolio tab with loaded data
- **THEN** seeded mock projects render as cards with title, description, tags, and an outbound link
- **AND** the external links section lists the seeded links

#### Scenario: Portfolio loading state
- **WHEN** the tab opens while portfolio data is loading
- **THEN** a skeleton mirroring the project-card list renders

#### Scenario: Empty portfolio
- **WHEN** the seeded data contains zero projects and zero links
- **THEN** a localized empty state with a call-to-action to add the first project renders instead of the lists

### Requirement: Mock CRUD-lite for portfolio items
The Portfolio tab SHALL support adding, editing, and removing projects and links through in-page forms operating on local component state (no persistence — a documented mock-stage assumption). Removing an item MUST require a confirmation step.

#### Scenario: Add a project
- **WHEN** the user submits the add-project form with a title and URL
- **THEN** the new project appears in the list immediately (local state)

#### Scenario: Edit and remove
- **WHEN** the user edits a project's fields and saves
- **THEN** the card reflects the changes immediately
- **AND** removing an item asks for confirmation before it disappears from the list

#### Scenario: No persistence across reload
- **WHEN** the page reloads after local additions or edits
- **THEN** the tab shows the seeded mock data again (mock-stage behavior, to be replaced by BE mutations later)

### Requirement: Portfolio i18n and accessibility
All Portfolio strings (headings, form labels, empty state, confirmation copy) SHALL be localized vi/en; forms MUST have labeled inputs, destructive actions MUST be reachable by keyboard, and outbound project links MUST indicate they open externally.

#### Scenario: Localized accessible forms
- **WHEN** the locale is vi or en
- **THEN** all Portfolio strings render localized
- **AND** every form input has an associated label and all actions are keyboard-operable
