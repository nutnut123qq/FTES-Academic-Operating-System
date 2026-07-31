# learn-reader

## ADDED Requirements

### Requirement: Top-bar assignment entry when the lesson has an assignment
The lesson reader's top action bar SHALL show a "Làm bài tập" button when — and only when — the
lesson has at least one assignment (from the shared assignments read). Activating it SHALL bring
the learner to the lesson's inline assignment block (a smooth in-page scroll to its anchor), where
they submit for grading. When the lesson has no assignment the button SHALL NOT render.

#### Scenario: Lesson with an assignment shows the button
- **WHEN** the lesson's assignment list resolves non-empty
- **THEN** the top bar shows the "Làm bài tập" button, which scrolls to the inline assignment block

#### Scenario: Lesson without an assignment hides the button
- **WHEN** the lesson has no assignment
- **THEN** the "Làm bài tập" button does not render
