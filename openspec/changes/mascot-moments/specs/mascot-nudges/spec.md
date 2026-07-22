# mascot-nudges

## ADDED Requirements

### Requirement: Anti-nag guidance nudges

The app SHALL support contextual guidance nudges that render the FTES mascot (reusing `FtesMascot`,
pose `point`) as a dismissible overlay — distinct from empty-state content — to steer the user
toward a next action (e.g. completing their career profile). Every nudge SHALL obey the anti-nag
guardrail: shown at most once per nudge type per device, dismissible, and its "seen" state
persisted to localStorage keyed `ftes:mascot:nudge:{principal}:{type}` (with `principal` = user id
when authenticated or a generated device id when anonymous) so it does not reappear.

#### Scenario: Complete-profile nudge shows once

- **WHEN** the user's career profile is missing data and the `completeProfile` nudge has not been seen
- **THEN** the mascot nudge is shown once, pointing toward the profile completion action

#### Scenario: Dismissed nudge does not reappear

- **WHEN** the user dismisses the nudge
- **THEN** the `ftes:mascot:nudge:{principal}:completeProfile` flag is set and the nudge does not
  appear again on that device

### Requirement: Nudges yield to the onboarding tour and never stack

A nudge SHALL NOT be shown while an onboarding tour overlay is active, and at most one nudge SHALL
be visible at any time. Nudges SHALL NOT block interaction — they are dismissible via a close
control and Escape, with the mascot marked decorative and the copy exposed via an `aria-live`
region.

#### Scenario: Active tour suppresses nudges

- **WHEN** an onboarding tour overlay is running and a nudge becomes eligible
- **THEN** the nudge is not shown until the tour ends

#### Scenario: Nudges do not stack

- **WHEN** a nudge is already visible and a second nudge becomes eligible
- **THEN** only one nudge is shown at a time

#### Scenario: Nudge is dismissible and non-blocking

- **WHEN** a nudge is visible
- **THEN** the user can close it with the close control or Escape and continue interacting with the
  page, and a screen reader can read the nudge copy from its `aria-live` region
