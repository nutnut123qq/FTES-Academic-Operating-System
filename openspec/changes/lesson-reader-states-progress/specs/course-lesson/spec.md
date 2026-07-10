## MODIFIED Requirements

### Requirement: Course learn player
The lesson route `/courses/[courseId]/lessons/[lessonId]` SHALL render a learn player:
a curriculum rail plus a content area. Its state surfaces (empty / loading / error), the
mark-complete progress loop, and the premium lock marker SHALL reflect real per-viewer
data rather than static placeholders.

#### Scenario: Curriculum rail with active lesson and progress
- **WHEN** a lesson opens
- **THEN** a rail lists chapters → lessons with a completion marker per lesson and the active lesson highlighted
- **AND** the chapter holding the active lesson is expanded
- **AND** a progress header shows completed/total

#### Scenario: Content area with tabs and navigation
- **WHEN** the content area renders
- **THEN** it shows a video area, the lesson title, and tabs for lecture / documents / notes
- **AND** a mark-complete action, a previous action (disabled at the first lesson), and a next action (disabled at the last lesson)

#### Scenario: Header meta chips gated on value
- **WHEN** the lesson header renders its meta chips
- **THEN** the "min read" chip is shown only when the read-time value is greater than zero
- **AND** the "challenges" chip is shown only when the challenge count is greater than zero

#### Scenario: Content-less lesson shows an invitation
- **WHEN** the reading view is active, the lesson is not locked, and it has no markdown body, no HTML fallback, no video and no documents
- **THEN** an empty-state invitation is shown instead of a blank bordered reading card

#### Scenario: Video slot communicates its state
- **WHEN** the lesson video source is still resolving
- **THEN** an aspect-ratio skeleton occupies the video slot
- **WHEN** the video fails with a fatal playback error
- **THEN** a compact "video unavailable" placeholder with a retry action is shown instead of an empty slot

#### Scenario: Mark a lesson complete
- **WHEN** the user reads a lesson to the end (a bottom sentinel becomes visible) or presses the manual mark-complete action
- **THEN** the completion is persisted for the viewer
- **AND** the action reflects the completed state and the rail marker + progress header update

#### Scenario: End-of-chapter challenge
- **WHEN** the lesson has a chapter challenge
- **THEN** a challenge callout is shown with a CTA into the challenge

#### Scenario: Premium lesson lock from per-viewer entitlement
- **WHEN** the rail renders a lesson marker
- **THEN** a lesson locked for the current viewer shows a lock marker
- **AND** a premium lesson the viewer already owns shows no lock marker
- **AND** the lock unlocks by enrolling, never by a separate VIP purchase

#### Scenario: Loading and error states
- **WHEN** the outline or lesson is loading
- **THEN** the rail and content each show a skeleton
- **WHEN** loading fails with no cached data
- **THEN** an error state with a retry action is shown

#### Scenario: Discussion entitlement state
- **WHEN** the lesson discussion request is denied for the viewer (HTTP 401 or 403)
- **THEN** an "enroll to join the discussion" invitation is shown instead of an error with a retry
- **WHEN** the discussion request fails transiently (5xx or network)
- **THEN** an error state with a retry action is shown
