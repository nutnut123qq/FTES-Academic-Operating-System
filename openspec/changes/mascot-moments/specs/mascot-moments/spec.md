# mascot-moments

## ADDED Requirements

### Requirement: Anti-nag guarantees for all mascot moments
Every mascot moment outside the guided tour SHALL honour the anti-nag contract: at most one mascot on screen per page, dismissible celebrations and nudges, no moment shown while a guided tour is active (`useTour().isActive`), frequency capped through `localStorage`, the mascot marked decorative (`aria-hidden`) with its copy carried in an `aria-live` speech bubble, and idle animation disabled under `prefers-reduced-motion`.

#### Scenario: One mascot per page
- **WHEN** a page can show both a celebration/nudge and an empty-state mascot
- **THEN** only one mascot is rendered at a time (the branches are mutually exclusive)

#### Scenario: Moments never stack on a tour
- **WHEN** a guided tour overlay is active
- **THEN** no celebration or nudge is shown

### Requirement: Once-per-day mascot celebration
The app SHALL provide a `MascotCelebration` banner (cheer pose) that appears at most once per calendar day per device — keyed by a `YYYY-MM-DD` day stamp in `localStorage` under `ftes.mascot.celebration.<id>` — is dismissible, and is suppressed while a tour is active WITHOUT consuming the day's slot, so it can still appear once the tour ends. A new calendar day SHALL re-arm it.

#### Scenario: Fires once per day
- **WHEN** the trigger condition is met and the celebration has not been shown today
- **THEN** the celebration appears and the day is stamped so it does not repeat until tomorrow

#### Scenario: Deferred by an active tour, not consumed
- **WHEN** the trigger condition is met while a tour is active
- **THEN** the celebration is withheld and the day is NOT stamped, and it appears once the tour ends (still on the same day)

#### Scenario: Dismiss hides it for the day
- **WHEN** the user dismisses the celebration
- **THEN** it disappears and does not reappear until a new calendar day

### Requirement: Once-per-device profile nudge
The app SHALL provide a `MascotProfileNudge` (point pose) inviting a signed-in user to complete a sparse profile (missing avatar, bio, or a distinct display name), shown at most once per device — permanently dismissed via `ftes.mascot.nudge.<id>` — never for guests, complete profiles, or while a tour is active, with an explicit dismiss control and a CTA that routes to profile editing.

#### Scenario: Shown for a sparse profile
- **WHEN** a signed-in user with a sparse profile visits a surface hosting the nudge, no tour is active, and it has not been dismissed
- **THEN** the nudge appears with a "complete your profile" call to action

#### Scenario: Dismissed forever on this device
- **WHEN** the user dismisses the nudge
- **THEN** it never appears again on this device

#### Scenario: Not shown for complete profiles or guests
- **WHEN** the viewer is a guest or already has avatar, bio, and a distinct display name
- **THEN** the nudge is not rendered

### Requirement: Level-up celebration moment
The app SHALL show a mascot (cheer pose) inside the gamification level-up modal when a level-up event fires, congratulating the user with localized copy.

#### Scenario: Level-up shows the cheering mascot
- **WHEN** a level-up event is emitted
- **THEN** the level-up modal opens with the cheering mascot and the new level in its copy

### Requirement: Mascot empty-states across surfaces
The app SHALL render a decorative `FtesMascot` (pose chosen to fit the tone — `greeting` for sign-in gates, `explain` for guidance, `point` for "not found") in the empty / gated states of the cart, community feed, my-courses, saved library (guest gate and per-tab empty), search (no results), and quest board (guest gate and empty), with meaning carried by the accompanying title/description, not the mascot.

#### Scenario: Empty cart shows a mascot
- **WHEN** the cart is empty
- **THEN** its empty state shows the mascot with a guiding message and a browse action

#### Scenario: No search results shows a mascot
- **WHEN** a search returns no results
- **THEN** the no-results state shows the mascot (point pose) with the empty message

### Requirement: Localized moment copy
All mascot-moment copy — celebration titles/bodies, the profile nudge, and every surface empty-state — SHALL be referenced by i18n key and provided in Vietnamese and English.

#### Scenario: Localized celebration
- **WHEN** the app locale is Vietnamese
- **THEN** the celebration and nudge strings render from the `vi` bundle
</content>
