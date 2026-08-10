# community-side-rails (delta)

## ADDED Requirements

### Requirement: Upcoming events panel in the discovery rail

The right discovery rail SHALL render an "upcoming events" panel between the poll panel and the live
chat panel, listing at most the 3 nearest events whose start is in the future and whose status is
published or ongoing, ordered by start time ascending. Each row SHALL show a type icon, the event
title, and a meta line of `day · time · location type`, and SHALL link to that event's detail page.
The panel SHALL carry a "see all" link to `/events`. Rows SHALL NOT carry a register action — the
detail page owns registration. When there is no upcoming event the panel SHALL say so rather than
render an empty list.

#### Scenario: Nearest events are listed

- **WHEN** the community page renders at ≥1280px width with five upcoming events available
- **THEN** the panel shows the three nearest ones, soonest first

#### Scenario: Past and unpublished events are excluded

- **WHEN** the event list contains events that already started, or events whose status is neither
  published nor ongoing
- **THEN** none of them appear in the panel

#### Scenario: Open an event from the rail

- **WHEN** the user activates a row
- **THEN** the app navigates to `/events/{slug}` for that event

#### Scenario: See all

- **WHEN** the user activates the panel's "see all" link
- **THEN** the app navigates to `/events`

#### Scenario: Nothing upcoming

- **WHEN** no upcoming event matches
- **THEN** the panel renders an empty-state line instead of a bare title

### Requirement: Events entry point in the community navigation

The community shell SHALL expose an "Sự kiện" entry pointing at `/events` in BOTH the left nav rail
(from `xl`) and the ⋯ menu (below `xl`), so the events surface is reachable at every viewport — the
discovery rail panel is desktop-only. The entry SHALL use the same icon-plus-label row shape as the
other nav rail shortcuts and SHALL be localized from `communityHub.menu.*`.

#### Scenario: Desktop nav rail

- **WHEN** the community page renders at ≥1280px width
- **THEN** the left nav rail shows an events row that navigates to `/events`

#### Scenario: Below xl

- **WHEN** the viewport is below 1280px
- **THEN** the ⋯ menu contains the events entry and it navigates to `/events`

#### Scenario: Localized label

- **WHEN** the locale switches between vi and en
- **THEN** the entry's label comes from the message catalogs, with no hardcoded string
