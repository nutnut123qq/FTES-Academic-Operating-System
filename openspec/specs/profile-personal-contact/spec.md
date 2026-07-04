# profile-personal-contact Specification

## Purpose
TBD - created by archiving change profile-feature-complete. Update Purpose after archive.
## Requirements
### Requirement: Personal tab shows structured contact information
The Personal tab SHALL display a Contact card with email, phone, and address rows.

#### Scenario: Contact information exists
- **WHEN** the personal detail hook returns contact fields
- **THEN** each non-empty contact row renders with its icon and value

#### Scenario: Contact information is empty
- **WHEN** all contact fields are empty
- **THEN** the card shows an empty state inviting the user to edit their profile

### Requirement: Contact card is separate from social links
The Personal tab SHALL render Contact and Social links as two distinct `LabeledCard` sections.

#### Scenario: Both sections present
- **WHEN** the Personal tab renders
- **THEN** the Contact card appears before the Social links card

