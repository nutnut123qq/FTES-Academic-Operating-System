## ADDED Requirements

### Requirement: Course-wide questions roll-up
The learn experience SHALL provide a course-wide Q&A route that lists every top-level question
asked across the course's lessons, with filter tabs (unanswered / answered / mine / all) whose
active value is reflected in the URL, a debounced search, a course-general question composer,
and an invitation empty-state when no questions exist yet.

#### Scenario: Browse and filter questions
- **WHEN** the Q&A route opens
- **THEN** it lists the course's questions under a default filter
- **WHEN** the learner picks a different filter
- **THEN** the list updates and the active filter is written to the URL

#### Scenario: Search questions
- **WHEN** the learner types a query
- **THEN** after a short debounce the list narrows to matching questions

#### Scenario: Ask a course-general question
- **WHEN** the learner submits a question in the composer
- **THEN** the question is added and appears in the list

#### Scenario: Empty roll-up invites participation
- **WHEN** the course has no questions and no filter/search is applied
- **THEN** an invitation card is shown that funnels into the course content

#### Scenario: Reachable from a lesson
- **WHEN** the lesson discussion renders
- **THEN** it links to the course-wide Q&A roll-up
