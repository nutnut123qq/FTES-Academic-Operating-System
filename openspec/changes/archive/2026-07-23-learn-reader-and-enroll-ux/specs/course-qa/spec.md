## MODIFIED Requirements

### Requirement: Course-wide questions roll-up
The learn experience SHALL provide a course-wide Q&A roll-up that lists every top-level
question asked across the course's lessons, with filter tabs (unanswered / answered /
mine / all) whose active value is reflected in the URL, a debounced search, a
course-general question composer, and an invitation empty-state when no questions exist
yet. The roll-up SHALL reveal additional questions PROGRESSIVELY AND INLINE (a "See more"
control that appends the next page below the current rows and scrolls to it) rather than
navigating between pages with a prev/next pager. The lesson discussion's "See all
questions" entry SHALL reveal this roll-up INLINE on the current reading surface (an
embedded roll-up variant, with its page chrome suppressed, mounted below the discussion
and smooth-scrolled into view) instead of navigating to a separate Q&A page.

#### Scenario: Browse and filter questions
- **WHEN** the roll-up opens
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

#### Scenario: See all questions reveals inline without navigation
- **WHEN** the lesson discussion renders and the learner presses "See all questions"
- **THEN** the course-wide roll-up is revealed inline below the discussion and scrolled into view
- **AND** the learner is NOT navigated to a separate page (the lesson stays open)

#### Scenario: See more appends the next page inline
- **WHEN** more questions exist than are currently shown and the learner presses "See more"
- **THEN** the next page of questions is appended below the current rows and scrolled into view
- **AND** no route navigation occurs
