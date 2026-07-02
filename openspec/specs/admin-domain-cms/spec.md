# admin-domain-cms Specification

## Purpose
TBD - created by archiving change admin-moderator-console. Update Purpose after archive.
## Requirements
### Requirement: Domain CMS lists for Courses, Resources, Communities, and Events
The system SHALL provide CMS list surfaces for Courses (`/admin/courses`), Resources
(`/admin/resources`), Communities/Groups (`/admin/communities`), and Events
(`/admin/events`), each listing items with title and status, accessible to Admin and above.

#### Scenario: Admin views a domain CMS list
- **WHEN** an Admin opens a domain CMS section (e.g. `/admin/courses`)
- **THEN** the list shows each item's title and current status (draft/published/archived)
- **AND** shows whether the item is featured or pinned

#### Scenario: Empty and loading states
- **WHEN** a CMS list is loading
- **THEN** a skeleton mirroring the list layout is shown
- **AND** when the domain has no items an empty state is shown

### Requirement: Status toggle and feature/pin (mock, confirmed on destructive)
The system SHALL let an Admin toggle an item's publication status and toggle its featured
and pinned flags via mock mutations, and SHALL require confirmation before a destructive
status change such as archiving.

#### Scenario: Admin toggles publication status
- **WHEN** an Admin changes an item's status (e.g. draft ↔ published)
- **THEN** the mock mutation runs and the item's status updates with a success toast
- **AND** on a mocked failure an error toast is shown and the prior status is retained

#### Scenario: Archiving requires confirmation
- **WHEN** an Admin chooses to archive an item
- **THEN** a confirmation dialog is shown before archiving
- **AND** canceling leaves the item's status unchanged

#### Scenario: Admin features or pins an item
- **WHEN** an Admin toggles the featured or pinned flag
- **THEN** the mock mutation runs and the flag updates, reflected in the row

### Requirement: Link to existing detail pages
The system SHALL link each CMS row to its existing user-facing detail page
(e.g. `/courses/[courseId]`, `/community/[postId]` or `/groups/[groupId]`, `/events`,
`/resources`) rather than re-implementing item detail.

#### Scenario: Admin opens an item's detail
- **WHEN** an Admin selects a CMS row's detail link
- **THEN** the system navigates to that item's existing detail page

### Requirement: CMS gating, BE assumption, i18n, and a11y
The system SHALL gate CMS sections to Admin and above, run mutations against a mock service
with a documented BE assumption, localize text under `admin.cms.*` (vi/en), and be
responsive and accessible.

#### Scenario: Localized and responsive CMS list
- **WHEN** the CMS list renders in `vi` or `en` on desktop and mobile
- **THEN** text comes from `admin.cms.*` keys, the table exposes accessible headers, and on mobile rows stack into cards

