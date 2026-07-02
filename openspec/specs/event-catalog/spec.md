# event-catalog Specification

## Purpose
TBD - created by archiving change event-catalog. Update Purpose after archive.
## Requirements
### Requirement: Event catalog at `/events`
The system SHALL provide an event catalog at `/events` that lists upcoming events and
lets the learner filter them by text and by type.

#### Scenario: Browse the catalog
- **WHEN** a learner visits `/events`
- **THEN** the page renders a titled catalog with a grid of event cards, each showing a
  type icon badge, title, type chip, date, location, attendee count and a register CTA

#### Scenario: Search events
- **WHEN** the learner types into the search box
- **THEN** the grid narrows to events whose title or location matches the query
- **AND** an empty-state message shows when nothing matches

#### Scenario: Filter by type
- **WHEN** the learner selects a type filter (`all` or one of webinar, workshop,
  hackathon, competition, meetup)
- **THEN** the grid shows only events of that type, or all events when `all` is selected

#### Scenario: Open an event
- **WHEN** the learner activates an event card's title link
- **THEN** the app navigates to `/events/{id}` for that event

