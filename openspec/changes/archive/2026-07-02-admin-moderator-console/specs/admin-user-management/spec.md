# admin-user-management

## ADDED Requirements

### Requirement: User list with search and filter
The system SHALL present a searchable, filterable list of users at `/admin/users` showing
name, email, role, and status, available to Admin and Super Admin.

#### Scenario: Admin searches and filters the user list
- **WHEN** an Admin opens `/admin/users` and enters a query and/or selects a role/status filter
- **THEN** the list shows only users matching the query and filters
- **AND** each row shows name, email, role, and status

#### Scenario: Empty and loading states
- **WHEN** the user list is loading
- **THEN** a skeleton mirroring the list/table layout is shown
- **AND** when no users match the query/filter an empty state is shown instead of an empty table

### Requirement: User detail
The system SHALL provide a user detail surface at `/admin/users/[userId]` showing the
user's profile fields, role, status, and available actions.

#### Scenario: Admin opens a user detail
- **WHEN** an Admin selects a user from the list
- **THEN** the detail surface shows the user's name, email, role, status, and metadata
- **AND** exposes the available management actions

### Requirement: Change role, suspend, ban, and reset password (mock, confirmed)
The system SHALL let an Admin change a user's role and suspend, ban, or reset a user's
password via mock mutations, and SHALL require a confirmation dialog before any destructive
action (change role, suspend, ban, reset).

#### Scenario: Changing a role requires confirmation
- **WHEN** an Admin selects a new role for a user
- **THEN** a confirmation dialog describing the consequence is shown before the change is applied
- **AND** canceling the dialog leaves the user's role unchanged

#### Scenario: Suspend or ban a user
- **WHEN** an Admin confirms a suspend or ban action
- **THEN** the mock mutation runs and the user's status updates to suspended or banned
- **AND** a success toast is shown, or on a mocked failure an error toast is shown and the prior status is retained

#### Scenario: Reset password
- **WHEN** an Admin confirms a reset-password action
- **THEN** the mock mutation runs and a confirmation (e.g. reset link sent) is shown

### Requirement: BE contract assumption for user administration
The system SHALL implement all user mutations against a mock admin service and SHALL document
the assumed backend contract without depending on any existing endpoint.

#### Scenario: Mutations run against the mock service
- **WHEN** any user mutation is invoked
- **THEN** it executes against the mock admin service (no real backend call)
- **AND** the assumed backend endpoints and response envelope are documented as an assumption

### Requirement: Accessibility and i18n for user management
The system SHALL localize user-management text under `admin.users.*` (vi/en) and expose the
list and actions accessibly.

#### Scenario: Accessible table and localized text
- **WHEN** the user list renders in `vi` or `en`
- **THEN** the table exposes a caption and scoped column headers, and action controls have accessible labels
- **AND** all visible text comes from `admin.users.*` keys in the active language
