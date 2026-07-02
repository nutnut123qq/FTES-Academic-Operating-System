# rbac-roles Specification

## Purpose
TBD - created by archiving change rbac-roles. Update Purpose after archive.
## Requirements
### Requirement: Roles overview
The system SHALL present an admin overview of every system role with its localized
name and rounded member count.

#### Scenario: Operator views the role cards
- **WHEN** an operator opens `/admin/roles`
- **THEN** a card is shown for each role (member, moderator, admin, superAdmin)
- **AND** each card shows the localized role name and a rounded member count

### Requirement: Permission matrix
The system SHALL present a read-only matrix of which permissions each role grants,
with permissions as rows and roles as columns.

#### Scenario: Operator reads a grant cell
- **WHEN** an operator views the permission matrix
- **THEN** each cell shows a check icon when the role grants that permission
- **AND** each cell shows an x icon when the role does not grant that permission
- **AND** each cell icon exposes an accessible label describing granted / not granted

#### Scenario: Matrix is accessible
- **WHEN** the matrix table renders
- **THEN** it provides a caption, column headers scoped to roles, and row headers
  scoped to permissions

