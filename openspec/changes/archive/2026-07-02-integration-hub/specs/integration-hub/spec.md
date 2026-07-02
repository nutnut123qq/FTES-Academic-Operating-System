## ADDED Requirements

### Requirement: Integration Hub at `/integrations`
The system SHALL provide an Integration Hub at `/integrations` that lists connected
and available third-party services grouped by category.

#### Scenario: Browse the hub
- **WHEN** a learner visits `/integrations`
- **THEN** the page renders a titled hub with integration cards grouped into category
  sections (auth, developer, communication, payment, ai, storage)
- **AND** each card shows a category icon badge, the service name, a category chip, a
  connection status and a connect/disconnect action

#### Scenario: See connection status
- **WHEN** an integration is connected
- **THEN** its card shows a "Connected" status styled with `text-success`
- **AND** when it is not connected the card shows a "Not connected" status styled with
  `text-muted`

#### Scenario: Trigger a connect/disconnect action
- **WHEN** the learner activates a card's action button
- **THEN** a connected integration offers a "Disconnect" action and a not-connected
  integration offers a "Connect" action (mock, FE-only)
