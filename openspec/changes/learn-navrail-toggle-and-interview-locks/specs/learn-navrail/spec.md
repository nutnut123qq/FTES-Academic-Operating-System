# learn-navrail

## ADDED Requirements

### Requirement: Collapsible tools rail persists across the overview and lesson pages
The far-left learn course-tools rail SHALL be mounted on BOTH the content dashboard and
the lesson reader so cross-section navigation (Mind map, Leaderboard, Materials, Q&A, …)
stays reachable while reading or watching a lesson, and its desktop form SHALL be a
collapsible sidebar whose collapsed/expanded state persists to `localStorage` so the
choice survives navigation between those pages and full reloads. Collapsing SHALL reduce
the rail to a thin icon-only rail (with a re-open toggle), and there SHALL remain exactly
one source of the rail — no duplicate rail is rendered.

#### Scenario: Rail available on the lesson page
- **WHEN** a learner opens an actual lesson content page (the reader, not just the `/learn/content` overview)
- **THEN** the far-left tools rail is present with its section links (Mind map, Leaderboard, Materials, Q&A, …)
- **AND** activating any link navigates to that section from within the lesson page

#### Scenario: Collapse persists across navigation and reload
- **WHEN** a learner collapses the tools rail and then navigates to another learn page or reloads
- **THEN** the rail is still collapsed (its icon-only form) without being reset
- **AND** re-expanding it and navigating again keeps it expanded

#### Scenario: Collapsed rail stays usable
- **WHEN** the tools rail is collapsed
- **THEN** it shows an icon-only rail plus a toggle to re-open it
- **AND** the resume affordance and each tool remain reachable as icons

### Requirement: Interview tools lock behind course purchase
The Mock interview and Interview rows SHALL be locked whenever the viewer does not have
full course access (`access.fullAccess !== true`, including guests and not-yet-purchased
viewers): a locked row SHALL show a lock marker and, on press, open the whole-course buy
flow (the package gate modal) instead of navigating — the same treatment as the always-
locked Playground and Personal project rows. When the viewer has full course access the
two rows SHALL behave normally and navigate to their routes with no lock marker.

#### Scenario: Not purchased — interview tools locked
- **WHEN** a viewer without full course access (a guest or a non-purchaser) opens the tools rail
- **THEN** the Mock interview and Interview rows show a lock marker
- **AND** pressing either row opens the whole-course package gate modal instead of navigating

#### Scenario: Full access — interview tools open
- **WHEN** a viewer with full course access (bought, free-owned, or otherwise entitled) opens the tools rail
- **THEN** the Mock interview and Interview rows show no lock marker
- **AND** pressing either row navigates to its route (`/learn/mock-interview`, `/learn/interview`)
