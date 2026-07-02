# admin-dashboard-overview Specification

## Purpose
TBD - created by archiving change admin-moderator-console. Update Purpose after archive.
## Requirements
### Requirement: Admin dashboard stat cards
The system SHALL present a dashboard overview at `/admin` with stat cards summarizing total
users, total content (courses, resources, communities, events), and pending reports, from
mock data.

#### Scenario: Operator views the dashboard overview
- **WHEN** an authorized operator opens `/admin`
- **THEN** stat cards are shown for total users, total content counts, and pending reports
- **AND** each card shows its metric label and value

#### Scenario: Cards link to their sections
- **WHEN** an operator selects a stat card (e.g. pending reports)
- **THEN** the system navigates to the corresponding section (e.g. `/admin/moderation`)

### Requirement: Role-scoped dashboard
The system SHALL scope the visible stat cards to the operator's role, showing a Moderator
only the cards relevant to their permitted sections.

#### Scenario: Moderator sees a scoped dashboard
- **WHEN** a Moderator opens the dashboard
- **THEN** the pending-reports card is shown
- **AND** cards tied to sections the Moderator cannot access (e.g. user totals) are hidden

### Requirement: Dashboard states, BE assumption, i18n, and a11y
The system SHALL show loading and error states for the dashboard, source metrics from a mock
service with a documented BE assumption, localize text under `admin.dashboard.*` (vi/en),
and render responsively and accessibly.

#### Scenario: Loading and error states
- **WHEN** the dashboard metrics are loading
- **THEN** a skeleton mirroring the stat-card layout is shown
- **AND** when the mock metrics fetch fails an error state is shown instead of blank cards

#### Scenario: Localized and accessible cards
- **WHEN** the dashboard renders in `vi` or `en`
- **THEN** all card labels come from `admin.dashboard.*` keys and each interactive card exposes an accessible label

