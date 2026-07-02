## ADDED Requirements

### Requirement: For-you recommendation feed
The system SHALL provide a `/recommendations` page presenting personalized
recommendations grouped by kind (subjects, courses, groups, mentors, challenges).

#### Scenario: Feed groups recommendations by kind
- **WHEN** a learner opens `/recommendations`
- **THEN** the page shows a title and subtitle
- **AND** renders one section per recommendation kind that has items, each with a
  heading and a horizontal-wrapping grid of suggestion cards

#### Scenario: Each card explains why it was recommended
- **WHEN** a recommendation card is rendered
- **THEN** it shows an icon badge, the recommended item's title, and a "reason"
  caption (e.g. "Because you study PRF192")
- **AND** exposes a mock "view" action

#### Scenario: Empty kinds are omitted
- **WHEN** a recommendation kind has no items
- **THEN** its section is not rendered
