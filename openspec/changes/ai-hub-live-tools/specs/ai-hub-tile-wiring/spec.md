# ai-hub-tile-wiring

## ADDED Requirements

### Requirement: Every hub tile has a real action
The system SHALL make every AI hub tile CTA perform its real action: summary/flashcards/quiz/debug/cvReview/planner navigate to their tool pages, and tutor routes into learning (single enrolled course → its latest lesson; multiple → a course-picker modal; none → a catalog CTA modal); no rendered tile may be a no-op.

#### Scenario: Planner tile opens the planner
- **WHEN** a user presses "Mở" on the planner tile
- **THEN** the app navigates to `/ai/tools/planner`

#### Scenario: Tutor with several courses asks which one
- **WHEN** a user enrolled in 3 courses presses the tutor tile
- **THEN** a modal lists the 3 courses and picking one navigates to that course's learn surface

### Requirement: Dead tiles removed from the learner catalog
The system SHALL remove the `mentor` tool from the learner hub catalog (it moves to the Admin lecturer AI console); the hub only lists tools a learner can actually use.

#### Scenario: Mentor tile gone
- **WHEN** the hub renders for a student
- **THEN** no mentor tile appears in any category
