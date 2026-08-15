# profile-course-history (delta)

## ADDED Requirements

### Requirement: Course history lists every enrolment from the shared enrolment adapter

`/profile/settings/learning` SHALL list every course the viewer has joined, each with its completion,
whether it is still a trial, and the term window when the course is term-bound. Each row SHALL open
that course's learn shell.

The data SHALL come from the SAME adapter the home "continue learning" band and `/courses/me` use
(the REST enrolments endpoint), so this screen can never disagree with them about what the viewer is
enrolled in or how far along they are. The GraphQL hook of the same name SHALL NOT be used.

A search field SHALL appear only once the list is long enough to need it (four or more courses).
Loading, empty and error+retry states SHALL all be rendered.

#### Scenario: Viewer with enrolments

- **WHEN** the screen loads for a viewer with enrolments
- **THEN** each course renders with its cover, title, progress meter and any trial / access-window chip

#### Scenario: Short list

- **WHEN** the viewer has fewer than four courses
- **THEN** no search field is shown

#### Scenario: Agreement with the home band

- **WHEN** the same viewer opens the home page and this screen
- **THEN** both show the same set of enrolments and the same progress, because both read one adapter

### Requirement: Course history stops at the hub rather than fabricating a breakdown

The screen SHALL NOT render a per-course day timeline or chapter outline. The enrolment adapter
carries only the aggregate completion percent — no per-course event history — so a drill-down would
have to invent the numbers it displays.

#### Scenario: Opening a course row

- **WHEN** the viewer activates a course row
- **THEN** they navigate to that course's learn shell, not to an invented in-settings breakdown
