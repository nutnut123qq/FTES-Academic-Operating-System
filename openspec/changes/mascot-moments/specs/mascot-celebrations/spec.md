# mascot-celebrations

## ADDED Requirements

### Requirement: Celebratory mascot on positive milestones via gamification event host

The app SHALL render the FTES mascot (reusing `FtesMascot`) in the `cheer` pose to celebrate
positive milestones, emitted through a shared `GamificationEventHost` rather than logic scattered
into each feature. The grounded milestone SHALL be claiming all of the day's quests on QuestBoard —
a branch distinct from the "no quests today" empty state. The celebration SHALL be shown at most
once per milestone type per day (persisted via a per-day localStorage flag) and SHALL NOT block
interaction (dismissible, no hard modal).

#### Scenario: Claiming all daily quests celebrates

- **WHEN** the user claims the last remaining quest so that all of today's quests are claimed (not
  the `quests.length === 0` empty branch)
- **THEN** the `GamificationEventHost` shows the mascot in the `cheer` pose with congratulatory copy

#### Scenario: Celebration does not repeat within the day

- **WHEN** the all-quests-claimed celebration has already shown once today
- **THEN** re-visiting the quest board the same day does not show it again

#### Scenario: Empty quest board is not a celebration

- **WHEN** the quest board has `quests.length === 0`
- **THEN** the `explain`-pose empty state is shown (per mascot-empty-states), not the `cheer`
  celebration

#### Scenario: Celebration never blocks interaction

- **WHEN** the celebration overlay is showing
- **THEN** the user can dismiss it and continue interacting with the page without a focus trap
