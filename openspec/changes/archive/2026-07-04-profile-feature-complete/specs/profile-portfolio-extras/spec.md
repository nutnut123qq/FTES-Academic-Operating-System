## ADDED Requirements

### Requirement: Portfolio tab displays a Resume/CV card
The Portfolio tab SHALL render a Resume card with filename, upload date, and View/Download actions.

#### Scenario: Resume exists
- **WHEN** the portfolio hook returns a resume object
- **THEN** the card renders the document metadata and action buttons

#### Scenario: Resume missing
- **WHEN** no resume is present
- **THEN** the card shows an empty state

### Requirement: Portfolio tab displays a Certificates list
The Portfolio tab SHALL render a list of certificates showing name, issuer, date, and external link.

#### Scenario: Certificates exist
- **WHEN** the portfolio hook returns certificates
- **THEN** each certificate renders as a row/card with all fields

#### Scenario: No certificates
- **WHEN** the certificate list is empty
- **THEN** the section shows an empty state

### Requirement: Portfolio tab displays an Achievements wall
The Portfolio tab SHALL render earned achievements as a grouped badge wall.

#### Scenario: Achievements exist
- **WHEN** the portfolio hook returns achievements
- **THEN** they render in category groups with icon, name, and earned date

#### Scenario: No achievements
- **WHEN** the achievement list is empty
- **THEN** the section self-hides or shows an empty state

### Requirement: Projects render in a polished pinned-style grid
The Portfolio tab SHALL render projects as bordered cards in a responsive 2-column grid, with pinned projects listed first.

#### Scenario: Projects exist
- **WHEN** the portfolio hook returns projects
- **THEN** each project renders as a card with title, description, tags, and link
