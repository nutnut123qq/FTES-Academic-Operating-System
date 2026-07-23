## MODIFIED Requirements

### Requirement: Dynamic challenges tab
The reader's content/challenges tab list SHALL omit the challenges tab when the current
lesson has no challenge, so it never presents a permanent dead-end tab. The lesson's
`hasChallenge` gate SHALL be derived from the real backend signal carried on the
lesson-content contract (`GET /api/v1/lessons/{lessonId}/content` →
`LessonContentView.hasChallenge`, surfaced into `LearnLessonView.hasChallenge` by
`useQueryLearnLessonSwr`), NOT a hardcoded value. Both the challenges tab AND the
"Open challenges" call-to-action in the challenges view SHALL render only when
`hasChallenge` is true.

#### Scenario: No-challenge lesson hides the tab
- **WHEN** the current lesson's backend `hasChallenge` is false
- **THEN** the challenges tab is not shown in the reader tab list

#### Scenario: Challenge lesson shows the tab
- **WHEN** the current lesson's backend `hasChallenge` is true
- **THEN** the challenges tab is shown

#### Scenario: Open-challenges CTA gated on the real signal
- **WHEN** the challenges view renders for a lesson whose backend `hasChallenge` is true
- **THEN** the "Open challenges" button is shown and opens the challenge submission surface
- **WHEN** the lesson's backend `hasChallenge` is false
- **THEN** no "Open challenges" button is shown

#### Scenario: Missing backend field is treated as no challenge
- **WHEN** the lesson-content contract omits `hasChallenge`
- **THEN** the reader treats the lesson as having no challenge (no tab, no CTA)

## ADDED Requirements

### Requirement: AI study tools limited to video lessons
The reader's AI study tools (`LessonAiStudy` — AI Note + AI Flashcards) SHALL be mounted
ONLY for a VIDEO lesson, gated on the lesson content-type carried from the backend
(`LessonView.type`, surfaced into `LearnLessonView` as `contentType` / a derived
`isVideoLesson`), in addition to the existing unlocked-lesson requirement. On a
non-video lesson (document, link-only, or empty) the AI study section SHALL NOT render.

#### Scenario: Video lesson shows the AI study tools
- **WHEN** an unlocked lesson whose content-type is VIDEO is open
- **THEN** the AI study section (AI Note + AI Flashcards entries) is shown

#### Scenario: Document / link lesson hides the AI study tools
- **WHEN** an unlocked lesson whose content-type is not VIDEO is open
- **THEN** the AI study section is not shown

#### Scenario: Locked lesson never shows the AI study tools
- **WHEN** a lesson is locked (unentitled viewer)
- **THEN** the AI study section is not shown regardless of content-type

### Requirement: Inline next-lesson control and content-map toggle
The lesson reader SHALL present, INLINE on the lesson-title header row and right-aligned,
a SMALL "next lesson" button that navigates to the next lesson (the same target as the
bottom pager's next card) and a toggle that shows/hides the layout-owned content-map
sidebar. The next-lesson button SHALL self-hide when there is no next lesson. The full
bottom prev/next pager SHALL remain. The sidebar toggle SHALL drive the layout-owned
left content-map rail via shared state (a `learnSidebar` store) so the reader control and
the route layout stay in sync without prop-drilling.

#### Scenario: Inline next-lesson button advances
- **WHEN** a lesson with a following lesson is open
- **THEN** a small right-aligned "next lesson" button is shown on the title row
- **WHEN** the learner presses it
- **THEN** the reader navigates to the next lesson

#### Scenario: Last lesson hides the inline next button
- **WHEN** the current lesson has no next lesson
- **THEN** the inline next-lesson button is not shown

#### Scenario: Toggle hides and shows the content-map sidebar
- **WHEN** the learner presses the sidebar toggle while the content-map rail is shown
- **THEN** the left content-map sidebar is hidden and the reading column widens
- **WHEN** the learner presses the toggle again
- **THEN** the content-map sidebar is shown again
