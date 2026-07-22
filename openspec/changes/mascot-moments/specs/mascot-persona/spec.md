# mascot-persona

## ADDED Requirements

### Requirement: Single reused mascot identity across all moments

Every mascot moment (empty states, celebrations, nudges, guest greetings) SHALL reuse the same
`FtesMascot` component from `onboarding-mascot-guide` and SHALL NOT introduce any alternative
mascot character. All mascot copy SHALL refer to the mascot by the single localized name
`mascot.name` and keep a consistent friendly, concise voice, in both Vietnamese and English.

#### Scenario: No alternative mascot is introduced

- **WHEN** any new mascot moment surface renders the mascot
- **THEN** it renders the shared `FtesMascot` component, not a bespoke or different mascot

#### Scenario: One localized name everywhere

- **WHEN** the app locale is Vietnamese
- **THEN** every mascot moment refers to the mascot by the `mascot.name` value from the `vi` bundle

### Requirement: Guest-gate greeting for unauthenticated visitors

On guest-gate surfaces where an unauthenticated visitor is asked to sign in, the app SHALL render
`FtesMascot` in the `greeting` pose welcoming the visitor and inviting sign-in, in place of the
default sign-in icon. This greeting is a welcome, not a nudge, and SHALL therefore not be
frequency-capped.

#### Scenario: Guest visiting quests is greeted

- **WHEN** an unauthenticated user opens the quest board (`!authenticated`)
- **THEN** the sign-in gate shows the mascot in the `greeting` pose inviting them to sign in for
  daily quests

#### Scenario: Guest visiting saved library is greeted

- **WHEN** an unauthenticated user opens the saved library guest gate
- **THEN** the mascot greets them in the `greeting` pose, and this appears each time without a cap

### Requirement: Mascot treated as decorative

Across all persona moments the mascot SHALL be marked `aria-hidden` (decorative) with meaning
carried by the accompanying text, and its idle animation SHALL be disabled under
`prefers-reduced-motion` (as provided by `FtesMascot`).

#### Scenario: Reduced motion disables idle animation

- **WHEN** a persona moment renders the mascot and the user has `prefers-reduced-motion: reduce`
- **THEN** the mascot renders without the idle bobbing animation and screen readers announce only
  the accompanying text
