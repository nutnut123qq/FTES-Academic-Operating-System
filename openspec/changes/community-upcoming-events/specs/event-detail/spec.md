# event-detail (delta)

## ADDED Requirements

### Requirement: Event detail page at `/events/[slug]`

The app SHALL serve an event detail page at `/events/{slug}` that renders the event's identity (type
icon, title, type chip, lifecycle status), its schedule, its location, its remaining seats when the
capacity is bounded, and its description. Every field the detail DTO omits SHALL be left out rather
than filled with a placeholder value. An unknown slug SHALL render a not-found state with a link
back to the catalog instead of a crash or a blank page.

#### Scenario: Open an event from the catalog

- **WHEN** a visitor activates an event card in `/events`
- **THEN** `/events/{slug}` renders that event's title, schedule, location and description

#### Scenario: Unknown slug

- **WHEN** the detail request 404s (unknown or unpublished slug)
- **THEN** a not-found state is shown with a link back to `/events`

#### Scenario: Missing optional fields

- **WHEN** the event has no bounded capacity
- **THEN** no seats row is rendered at all

### Requirement: Public joining link for online events

The detail page SHALL show the event's `venue` to every viewer, signed in or not. When `venue` is an
`http(s)` URL it SHALL be rendered as a link that opens in a new tab with `rel="noopener noreferrer"`;
otherwise it SHALL be rendered as plain text next to the location-type label. When the backend omits
`venue`, only the location-type label SHALL be shown.

#### Scenario: Guest sees the meeting link

- **WHEN** a signed-out visitor opens a published online event whose `venue` is a meeting URL
- **THEN** the joining link is rendered and opens in a new tab

#### Scenario: On-site address

- **WHEN** the event's `venue` is a street address rather than a URL
- **THEN** it is rendered as text, not as a link

#### Scenario: Backend omits venue

- **WHEN** the detail payload carries no `venue`
- **THEN** the location row shows only the location-type label, with no empty link

### Requirement: Register for an event from its detail page

The detail page SHALL offer a register action that calls
`POST /api/v1/event/events/{id}/registrations`. A signed-out visitor SHALL get the authentication
modal with an event-registration context message and no request SHALL be sent. After a successful
write the page SHALL re-read the event from the server before changing the label — the resulting
state (registered or waitlisted) SHALL come from the server, never from an optimistic guess. An event
whose status is ended or cancelled SHALL NOT offer registration.

#### Scenario: Signed-in registration

- **WHEN** a signed-in learner activates the register action
- **THEN** the registration request is sent and, after revalidation, the page shows the registration
  state returned by the server

#### Scenario: Guest is prompted

- **WHEN** a signed-out visitor activates the register action
- **THEN** the authentication modal opens and no registration request is sent

#### Scenario: Registration survives a reload

- **WHEN** a learner registers and reloads the page
- **THEN** the registered state is still shown

#### Scenario: Waitlisted

- **WHEN** the server reports the registration as waitlisted
- **THEN** the page shows a waitlist label rather than a plain "registered" label

#### Scenario: Closed event

- **WHEN** the event's status is ended or cancelled
- **THEN** the register action is unavailable and the reason is shown

#### Scenario: Write fails

- **WHEN** the registration request fails
- **THEN** an error message is shown and the previous state is kept

### Requirement: Event times render in a single timezone

Every event timestamp shown on the catalog, the community rail and the detail page SHALL be formatted
by one shared helper in the platform timezone (`Asia/Ho_Chi_Minh`), so the same event never shows two
different clock times across surfaces. The detail page SHALL label the timezone so a viewer elsewhere
can convert.

#### Scenario: Same time on every surface

- **WHEN** an event is shown in the catalog, in the community rail and on its detail page
- **THEN** all three show the same clock time for its start

#### Scenario: Viewer in another timezone

- **WHEN** the viewer's device is set to a non-Vietnam timezone
- **THEN** the times shown are still the platform-timezone times, and the detail page labels them as such

#### Scenario: Unparseable timestamp

- **WHEN** a timestamp is missing or unparseable
- **THEN** the corresponding row is omitted instead of rendering an invalid date
