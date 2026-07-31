# lesson-topbar-challenge-material

## ADDED Requirements

### Requirement: Lesson reader top bar shows a challenge button only when the lesson has a challenge
The lesson reader top action bar SHALL show a "Làm thử thách" button (in the `actions` slot of its `PageHeader`, next to the next button) ONLY when the open lesson has a challenge — the existing
`hasChallenge` predicate (`(lesson.hasChallenge ?? false) && Boolean(lesson.challengeId)`). When the
lesson has no challenge, no challenge button SHALL render. Pressing the button SHALL navigate to the
SAME challenge-solve route the existing `TrialChallengeCta` and Challenges-tab (`ChallengesView`)
surfaces use — `challengeHref(courseId, lesson.moduleId, contentId, target)` where `target` is
`lesson.freeChallengeSlug` when present (the free-trial slug, matching `TrialChallengeCta`) and
otherwise `lesson.challengeId` (matching `ChallengesView`) — so there is one solve route, not a
divergent one. When the linked challenge is gated for this viewer (`challengeLocked`: a non-free
challenge they have not unlocked), pressing the button SHALL open the package gate instead of routing
into a solver the backend would reject, mirroring `ChallengesView`'s handler. The button SHALL reuse
the existing `reader.trialChallengeCta` label and SHALL NOT remove the existing CTA or Challenges tab
(this surface is additive). The challenge-solve route and its AI grading flow SHALL NOT change.

#### Scenario: A lesson with a challenge shows the top-bar challenge button
- **WHEN** the reader opens a lesson whose `hasChallenge` is true
- **THEN** the top action bar shows a "Làm thử thách" button next to the next-lesson button
- **AND** pressing it navigates to the same challenge-solve route the Challenges tab / trial CTA use

#### Scenario: A lesson without a challenge shows no challenge button
- **WHEN** the reader opens a lesson whose `hasChallenge` is false
- **THEN** no top-bar challenge button renders

#### Scenario: A gated non-free challenge opens the package gate
- **WHEN** the lesson's linked challenge is non-free and the viewer has not unlocked it
- **THEN** pressing the top-bar challenge button opens the package gate rather than routing into the solver

#### Scenario: The free-trial slug is preferred for the route target
- **WHEN** the lesson exposes a free-trial challenge slug (`freeChallengeSlug`)
- **THEN** the top-bar challenge button routes to that slug
- **AND** otherwise it routes to `lesson.challengeId`

### Requirement: Lesson reader top bar shows a materials button only when the lesson has documents
The lesson reader top action bar SHALL show a "Tài liệu buổi học" button ONLY when the open lesson has
at least one attached document. Because no lesson view field reports document existence, the signal
SHALL be the `getLessonDocuments(lessonId)` fetch, read through a shared
`useQueryLessonDocumentsSwr(lessonId)` hook that both the reader and the inline `LessonDocumentsBlock`
use with the SAME SWR key (`["lesson-documents", lessonId]`), so the fetch dedupes to a single request.
The button SHALL render only after the fetch resolves with a non-empty list (document count > 0); while
the fetch is loading it SHALL render nothing (never a button that leads nowhere). Pressing the button
SHALL reveal the documents by smoothly scrolling the page to the inline documents block (anchored by a
stable `id="lesson-documents"`) — a plain in-page scroll, not a route change. The materials button SHALL
carry a new `learn.reader.materialButton` label mirrored in both `vi.json` and `en.json`. The
`LessonDocumentsBlock` rendering SHALL NOT change other than the added `id` anchor and the shared fetch.

#### Scenario: A lesson with documents shows the materials button and scrolls to them
- **WHEN** the reader opens a lesson whose document fetch resolves with a non-empty list
- **THEN** the top action bar shows a "Tài liệu buổi học" button
- **AND** pressing it smoothly scrolls the page to the `#lesson-documents` block

#### Scenario: A lesson with no documents shows no materials button
- **WHEN** the lesson's document fetch resolves empty (or the viewer has no access)
- **THEN** no top-bar materials button renders

#### Scenario: While the document fetch is loading, no materials button renders
- **WHEN** the document fetch for the open lesson has not resolved yet
- **THEN** no materials button renders until a non-empty list resolves

#### Scenario: The reader and the inline block share one document fetch
- **WHEN** both the reader top bar and the inline `LessonDocumentsBlock` need the lesson's documents
- **THEN** they read the same `["lesson-documents", lessonId]` SWR cache and issue a single request

### Requirement: The two top-bar buttons stay compact on mobile
Each of the two new top-bar buttons SHALL use the house `Button` in a toolbar-appropriate secondary
variant with a phosphor icon, and SHALL keep the action row from overflowing on narrow screens by
hiding its text label below the `sm` breakpoint (icon-only) while exposing the label to assistive
technology via `aria-label`; from `sm` up the visible text label SHALL show.

#### Scenario: Buttons are icon-only with an accessible label on mobile
- **WHEN** the reader renders on a viewport narrower than `sm`
- **THEN** each new top-bar button shows only its icon
- **AND** still exposes its label to assistive technology via `aria-label`

#### Scenario: Buttons show their text label on wider screens
- **WHEN** the reader renders at the `sm` breakpoint or wider
- **THEN** each new top-bar button shows its text label alongside the icon
