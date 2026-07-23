# onboarding-mascot-guide

> Scope note (FE-only slice): this delta describes what the FE-only slice actually
> ships. Cross-device BE sync of the onboarding flag, per-surface first-visit tip
> registry, a tour queue, resume-at-step, an opt-out flag, a floating helper FAB,
> and step route-navigation / interactive pass-through are **out of scope here**
> (see proposal Non-Goals) and are intentionally NOT specified as requirements so
> `openspec sync` never writes unbuilt behaviour into the main specs.

## ADDED Requirements

### Requirement: Branded mascot component with intent poses
The app SHALL provide an `FtesMascot` component rendering the FTES mascot in one of four poses — `greeting`, `explain`, `point`, `cheer` — in small/medium/large sizes, with an optional idle animation that is disabled under `prefers-reduced-motion`, and the mascot SHALL be treated as decorative (`aria-hidden`) so meaning is carried by accompanying text. The pose artwork SHALL be resolved through a single swappable art module so the placeholder art can be replaced with final assets without touching call sites.

#### Scenario: Pose renders per intent
- **WHEN** a tour step with intent `point` is shown
- **THEN** the mascot renders in the `point` pose next to the step's speech bubble

#### Scenario: Reduced motion disables idle animation
- **WHEN** the user has `prefers-reduced-motion: reduce`
- **THEN** the mascot renders without the idle bobbing animation

### Requirement: Data-driven product tour engine with spotlight coach marks
The app SHALL run tours defined as ordered steps, where a step either targets a UI element via its `data-tour` attribute (spotlight overlay dims the page, cuts a highlight hole around the element, scrolls it into view, and anchors a speech bubble that auto-flips to stay on screen) or, when no target is given, renders a centered card; only one tour SHALL be active at a time, and starting a tour while one is running SHALL replace it rather than stack a second overlay.

#### Scenario: Step highlights a targeted element
- **WHEN** a step targets `data-tour="global-search"`
- **THEN** the search control is scrolled into view, dimmed everything else, highlighted with a cut-out, and a speech bubble points to it

#### Scenario: Centered step without target
- **WHEN** a welcome step has no target
- **THEN** a centered card with the mascot and text is shown over a dimmed page

#### Scenario: Only one overlay at a time
- **WHEN** a tour is started while one is already running
- **THEN** the running tour is replaced and only one spotlight overlay (one mascot) is ever on screen

### Requirement: Step navigation and skip
Each coach mark SHALL show a progress indicator (`step n of N`) and controls to go Previous, Next, and Skip; Skip SHALL open a light confirmation prompt in place of the step navigation, and only confirming it SHALL end the entire tour; the final step's primary action SHALL complete the tour.

#### Scenario: Advancing steps
- **WHEN** the user activates Next on step 2 of 5
- **THEN** the tour moves to step 3 and the progress shows 3 of 5

#### Scenario: Skip asks for confirmation first
- **WHEN** the user activates Skip
- **THEN** a "skip the guide?" prompt replaces the step navigation, and the tour stays open until the user confirms or cancels

#### Scenario: Confirming skip ends the tour
- **WHEN** the user confirms the skip prompt
- **THEN** the overlay closes, the done flag is set, and no further steps are shown

### Requirement: Welcome tour for new users
The app SHALL auto-start a welcome tour for a signed-in user on their first visit, guiding through the four header modules, global search, and the account gateway (which fronts the AI tutor and gamification surfaces), ending on a celebratory step; the auto-start SHALL happen at most once and never re-run automatically after the tour has been completed or skipped.

#### Scenario: New account sees the welcome tour
- **WHEN** a signed-in user lands in the app for the first time (the done flag is not set)
- **THEN** the welcome tour starts automatically after a short delay with the mascot greeting

#### Scenario: Returning user not re-prompted
- **WHEN** a user who already completed or skipped the welcome tour opens the app
- **THEN** no tour starts automatically

### Requirement: Completion persistence
The app SHALL persist a single device-wide "welcome tour seen" flag in `localStorage` (key `ftes.tour.onboarding.done`), set when the tour is completed or skipped, so the auto-start never repeats; every access SHALL degrade gracefully when `localStorage` is unavailable (SSR / private mode), and an in-memory session guard SHALL prevent a re-run even when the flag cannot be read.

#### Scenario: Done flag suppresses the auto-start
- **WHEN** the welcome tour has been completed or skipped on this device
- **THEN** re-opening the app does not auto-start the tour

#### Scenario: Storage unavailable does not crash
- **WHEN** `localStorage` throws or is absent
- **THEN** the app treats the tour as not-done without error, and the session guard still prevents a repeated auto-start within the session

### Requirement: Manual replay
The app SHALL expose a manual "replay the guide" entry in the authenticated account menu that starts the welcome tour on demand, ignoring the done flag, and re-sets the flag when the replayed tour finishes or is skipped.

#### Scenario: Replay from the account menu
- **WHEN** the user chooses "replay the guide" from the account menu
- **THEN** the welcome tour starts even if it was previously completed or skipped

### Requirement: Graceful handling of missing targets
When a step's target element is not present (or not visible) within a short wait, the engine SHALL skip that step and continue rather than blocking the tour, so the same tour is safe across viewports where some anchors are hidden.

#### Scenario: Missing target skipped
- **WHEN** a step targets an element that is not rendered on the current viewport
- **THEN** after a brief wait the engine advances to the next step without blocking the tour

### Requirement: Accessibility, reduced motion, and i18n
The tour overlay SHALL move focus into the coach mark, trap Tab / Shift+Tab within it so focus never reaches the inert page behind the scrim, support Escape to request skip, Left/Right to navigate, and Enter to advance, expose step text via an `aria-live` region, meet AA contrast over the dim layer, disable transitions under `prefers-reduced-motion`, and localize all mascot and onboarding strings in Vietnamese and English.

#### Scenario: Keyboard operates the tour
- **WHEN** the user presses Right arrow during a step
- **THEN** the tour advances to the next step

#### Scenario: Focus stays inside the coach mark
- **WHEN** the user presses Tab repeatedly during a step
- **THEN** focus cycles among the coach-mark controls and never lands on a control on the dimmed page behind the overlay

#### Scenario: Localized strings
- **WHEN** the app locale is Vietnamese
- **THEN** the mascot name and all step titles/bodies render from the `vi` bundle
</content>
</invoke>
