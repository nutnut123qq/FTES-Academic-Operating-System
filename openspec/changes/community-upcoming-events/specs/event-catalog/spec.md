# event-catalog (delta)

## MODIFIED Requirements

### Requirement: Event catalog at `/events`
The system SHALL provide an event catalog at `/events` that lists upcoming events and
lets the learner filter them by text and by type. Each card's register CTA SHALL perform a real
registration against `POST /api/v1/event/events/{id}/registrations` rather than being a no-op.

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
- **THEN** the app navigates to `/events/{id}` for that event, which renders the event detail page

#### Scenario: Register from a card
- **WHEN** a signed-in learner activates a card's register CTA
- **THEN** the registration request is sent, the CTA shows its pending state while it runs, and the
  card reflects the state returned by the server once the list is revalidated

#### Scenario: Guest registers from a card
- **WHEN** a signed-out visitor activates a card's register CTA
- **THEN** the authentication modal opens with the event-registration context and no request is sent

#### Scenario: Registration from a card fails
- **WHEN** the registration request fails
- **THEN** an error message is shown and the card keeps its previous state
