# subject-catalog (delta)

## MODIFIED Requirements

### Requirement: Compact catalog filters as two dropdowns

The subject catalog SHALL present its major and semester filters as two dropdowns, and the semester
dropdown SHALL list all program semesters (1..9), so a user can pick any semester regardless of
whether it currently has subjects.

#### Scenario: Pick a semester

- **WHEN** a user opens the "Kỳ" dropdown
- **THEN** it lists "Tất cả" and Kì 1 through Kì 9

#### Scenario: Empty semester

- **WHEN** a user picks a semester that has no subjects
- **THEN** the grid is empty (not silently unfiltered)
