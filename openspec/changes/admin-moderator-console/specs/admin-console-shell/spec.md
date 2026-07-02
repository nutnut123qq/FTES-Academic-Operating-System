# admin-console-shell

## ADDED Requirements

### Requirement: Console shell with section nav, breadcrumb, and page header
The system SHALL provide an admin console shell under `/admin` that renders a section
navigation, a breadcrumb, and a per-page header (title + description + actions slot)
shared across all admin sections.

#### Scenario: Authorized operator sees the console shell
- **WHEN** an authenticated operator with an admin-capable role opens any `/admin/*` route
- **THEN** the shell renders a section nav landmark, a breadcrumb (`Admin / <Section>[ / <Subpage>]`), and a page header for the current section
- **AND** the nav item matching the current route segment is marked active

#### Scenario: Nav is an accessible landmark
- **WHEN** the section nav renders
- **THEN** it is exposed as a navigation landmark with an accessible label
- **AND** each section is a link to its route

### Requirement: Role-gated section entry
The system SHALL filter the visible sections and permit entry based on the operator's
role: a Moderator SHALL see a subset (Dashboard + Moderation); an Admin or Super Admin
SHALL see all sections; the Config section SHALL be visible only to Super Admin.

#### Scenario: Moderator sees only the permitted subset
- **WHEN** a Moderator opens the console
- **THEN** the nav shows only the Dashboard and Moderation sections
- **AND** the User management and domain CMS sections are not shown in the nav

#### Scenario: Admin sees all operational sections
- **WHEN** an Admin opens the console
- **THEN** the nav shows Dashboard, Users, Moderation, Courses, Resources, Communities, and Events
- **AND** links to Roles and Tools are shown

#### Scenario: Config section is Super Admin only
- **WHEN** an Admin (not Super Admin) opens the console
- **THEN** the Config Center link is not shown
- **AND** when a Super Admin opens the console the Config Center link is shown

#### Scenario: Moderator deep-links to a forbidden section
- **WHEN** a Moderator navigates directly to a section outside their subset (e.g. `/admin/users`)
- **THEN** the system does not mount that section's content
- **AND** it redirects the Moderator to a permitted section or renders a forbidden (403-style) surface stating the access is not permitted

### Requirement: Guest and unauthorized redirect
The system SHALL redirect guests and members away from the console: an unauthenticated
guest SHALL be sent to the admin login surface, and a member (no console access) SHALL be
redirected rather than shown console content.

#### Scenario: Guest is redirected to admin login
- **WHEN** an unauthenticated guest opens any `/admin/*` route
- **THEN** the admin login surface is shown instead of console content
- **AND** no admin data is fetched or rendered

#### Scenario: Member without console access is redirected
- **WHEN** a signed-in member (no admin/moderator role) opens `/admin`
- **THEN** the system redirects them away and does not render console sections

### Requirement: Cross-links to Roles and Config Center
The system SHALL link to the existing Roles surface (`/admin/roles`) and the Config Center
(`/admin/config`) from the nav without embedding their functionality in this console.

#### Scenario: Operator navigates to Roles from the console
- **WHEN** an Admin selects the Roles link in the nav
- **THEN** the system navigates to `/admin/roles`
- **AND** the console does not re-implement roles/permissions management

### Requirement: Responsive shell, i18n, and states
The system SHALL render the shell responsively (nav collapses to a drawer on mobile),
localize all shell text under the `admin.*` namespace (vi/en), and show loading and error
states for the shell chrome.

#### Scenario: Mobile viewport collapses the nav
- **WHEN** the console renders on a mobile viewport
- **THEN** the section nav collapses into a drawer/menu toggled by a labeled control
- **AND** the content area uses the full width

#### Scenario: Shell text is localized
- **WHEN** the active locale is `vi` and then `en`
- **THEN** section labels, breadcrumb, and page headers render from `admin.*` keys in the active language
