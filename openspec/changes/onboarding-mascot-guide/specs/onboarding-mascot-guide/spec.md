# onboarding-mascot-guide

## ADDED Requirements

### Requirement: Branded mascot component with intent poses
The app SHALL provide an `FtesMascot` component rendering the FTES mascot in one of four poses — `greeting`, `explain`, `point`, `cheer` — in small/medium/large sizes, with an optional idle animation that is disabled under `prefers-reduced-motion`, and the mascot SHALL be treated as decorative (`aria-hidden`) so meaning is carried by accompanying text.

#### Scenario: Pose renders per intent
- **WHEN** a tour step with intent `point` is shown
- **THEN** the mascot renders in the `point` pose next to the step's speech bubble

#### Scenario: Reduced motion disables idle animation
- **WHEN** the user has `prefers-reduced-motion: reduce`
- **THEN** the mascot renders without the idle bobbing animation

### Requirement: Data-driven product tour engine with spotlight coach marks
The app SHALL run tours defined as ordered steps, where a step either targets a UI element via its `data-tour` attribute (spotlight overlay dims the page, cuts a highlight hole around the element, scrolls it into view, and anchors a speech bubble that auto-flips to stay on screen) or, when no target is given, renders a centered card; only one tour SHALL be active at a time.

#### Scenario: Step highlights a targeted element
- **WHEN** a step targets `data-tour="global-search"`
- **THEN** the search control is scrolled into view, dimmed everything else, highlighted with a cut-out, and a speech bubble points to it

#### Scenario: Centered step without target
- **WHEN** a welcome step has no target
- **THEN** a centered card with the mascot and text is shown over a dimmed page

#### Scenario: Only one tour at a time
- **WHEN** a second tour is triggered while one is running
- **THEN** the second tour is queued and starts only after the first ends

### Requirement: Step navigation and skip
Each coach mark SHALL show a progress indicator (`step n of N`) and controls to go Previous, Next, and Skip; Skip SHALL confirm and then end the entire tour; the final step's primary action SHALL complete the tour.

#### Scenario: Advancing steps
- **WHEN** the user activates Next on step 2 of 5
- **THEN** the tour moves to step 3 and the progress shows 3 of 5

#### Scenario: Skipping ends the tour
- **WHEN** the user confirms Skip
- **THEN** the overlay closes and no further steps are shown

### Requirement: Welcome tour for new users
The app SHALL auto-start a welcome tour on first login / just-registered state, guiding through the four header modules, global search, the start-learning CTA, and the AI tutor, ending on a celebratory step; the auto-start SHALL happen at most once and never re-run automatically after completion or opt-out.

#### Scenario: New account sees the welcome tour
- **WHEN** a user finishes registration and lands in the app for the first time
- **THEN** the welcome tour starts automatically with the mascot greeting

#### Scenario: Returning user not re-prompted
- **WHEN** a user who already completed or opted out of the welcome tour opens the app
- **THEN** no tour starts automatically

### Requirement: Contextual first-visit tips per surface
The app SHALL support registering per-surface tours triggered on the user's first visit to that surface, each shown at most once and coordinated through the single-active-tour queue.

#### Scenario: First visit to a surface
- **WHEN** the user opens the Workplace surface for the first time
- **THEN** its registered tip tour runs once, and does not run on subsequent visits

### Requirement: Progress persistence and opt-out
The app SHALL persist tour completion, the resume step, and an opt-out flag in localStorage keyed by user id when authenticated or a generated device id when anonymous, so tours do not repeat, can resume if abandoned mid-way, and can be permanently disabled.

#### Scenario: Resume after abandoning
- **WHEN** a user closes the browser on step 3 of a tour without finishing
- **THEN** re-entering that tour resumes at step 3

#### Scenario: Opt-out suppresses auto tours
- **WHEN** the user selects "don't show again"
- **THEN** no tour auto-starts thereafter, though manual replay still works

### Requirement: Floating mascot helper and manual replay
The app SHALL provide a floating mascot helper that opens a help panel to replay the welcome tour, browse registered surface tips, and reach docs; the helper SHALL be hideable and SHALL not overlap while a tour overlay is active.

#### Scenario: Manual replay from helper
- **WHEN** the user opens the helper and chooses "replay quick guide"
- **THEN** the welcome tour starts even if it was previously completed or opted out

### Requirement: Graceful handling of missing targets and routes
When a step's target element is not present within a short wait, the engine SHALL skip that step and continue; when a step declares a route different from the current one, the engine SHALL navigate there before anchoring.

#### Scenario: Missing target skipped
- **WHEN** a step targets an element that is not rendered
- **THEN** after a brief wait the engine advances to the next step without blocking the tour

### Requirement: Accessibility, reduced motion, and i18n
The tour overlay SHALL move focus into the coach mark, support Escape to skip, Left/Right to navigate, and Enter to advance, expose step text via an `aria-live` region, meet AA contrast over the dim layer, disable transitions under `prefers-reduced-motion`, and localize all mascot and onboarding strings in Vietnamese and English.

#### Scenario: Keyboard operates the tour
- **WHEN** the user presses Right arrow during a step
- **THEN** the tour advances to the next step

#### Scenario: Localized strings
- **WHEN** the app locale is Vietnamese
- **THEN** the mascot name and all step titles/bodies render from the `vi` bundle
