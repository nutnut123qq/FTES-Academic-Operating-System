# mindmap-progress-assistant (delta)

## ADDED Requirements

### Requirement: Progress read-out on the course mind map

The course mind map SHALL present a study-progress assistant derived from the per-viewer learn
tree, showing overall completion (percent + lesson tally), the learner's completed modules
(strengths), and the in-progress modules to finish (review). The panel SHALL be collapsible so it
never blocks the canvas, and SHALL be theme- and mobile-safe.

#### Scenario: Overall roll-up is shown

- **WHEN** the mind map renders for a course with modules
- **THEN** the assistant shows the overall completion percent and the completed / total lesson tally

#### Scenario: Strengths and review lists

- **WHEN** the learner has finished some modules and started others
- **THEN** finished modules appear as "strengths" and started-but-unfinished modules appear under
  "finish these", ordered nearest-to-done first

### Requirement: Single recommended next step

The assistant SHALL surface exactly one recommended next step chosen by a deterministic priority:
(1) resume the "you are here" lesson when unfinished; else (2) finish the most-complete in-progress
module; else (3) start the next untouched module; else (4) prompt to enroll/unlock when every
remaining step is premium-locked; else (5) report the course complete. Each recommendation SHALL
carry a plain-language reason.

#### Scenario: Resume the current lesson

- **WHEN** the viewer's resume pointer lesson is not yet completed
- **THEN** the recommendation is that lesson with a "continue" reason

#### Scenario: Finish the nearest module before starting a new one

- **WHEN** no resume lesson is pending and two modules are in progress
- **THEN** the recommendation targets the module with the higher completion ratio

#### Scenario: Course complete

- **WHEN** every lesson is completed
- **THEN** the assistant reports completion and shows no "study now" action

### Requirement: On-canvas suggestion highlight and jump

The recommended lesson's node on the canvas SHALL be visually marked (accent outline + a "suggested"
badge). Acting on the recommendation ("study now") SHALL follow the SAME open rule as clicking that
node — routing into the lesson reader when accessible, or opening the premium package gate when the
lesson is locked.

#### Scenario: Highlighted recommended node

- **WHEN** a lesson is recommended
- **THEN** its node shows the "suggested" badge and accent outline

#### Scenario: Jump respects the gate

- **WHEN** the learner acts on a recommendation whose lesson is premium-locked
- **THEN** the package gate opens instead of routing into the locked lesson
