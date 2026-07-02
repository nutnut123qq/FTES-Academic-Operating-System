# course-lesson Specification

## Purpose
TBD - created by archiving change course-learn-player. Update Purpose after archive.
## Requirements
### Requirement: Course learn player
The lesson route `/courses/[courseId]/lessons/[lessonId]` SHALL render a learn player:
a curriculum rail plus a content area. Data is FE-mocked until the BE contract lands.

#### Scenario: Curriculum rail with active lesson and progress
- **WHEN** a lesson opens
- **THEN** a rail lists chapters → lessons with a completion marker per lesson and the active lesson highlighted
- **AND** the chapter holding the active lesson is expanded
- **AND** a progress header shows completed/total

#### Scenario: Content area with tabs and navigation
- **WHEN** the content area renders
- **THEN** it shows a video area, the lesson title, and tabs for lecture / documents / notes
- **AND** a mark-complete action, a previous action (disabled at the first lesson), and a next action (disabled at the last lesson)

#### Scenario: Mark a lesson complete
- **WHEN** the user presses mark-complete
- **THEN** the action reflects the completed state and the rail marker + progress update

#### Scenario: End-of-chapter challenge
- **WHEN** the lesson has a chapter challenge
- **THEN** a challenge callout is shown with a CTA into the challenge

#### Scenario: Premium lesson lock
- **WHEN** a lesson is premium
- **THEN** the rail shows it with a lock marker (it unlocks by enrolling, never by a separate VIP purchase)

#### Scenario: Loading and error states
- **WHEN** the outline or lesson is loading
- **THEN** the rail and content each show a skeleton
- **WHEN** loading fails with no cached data
- **THEN** an error state with a retry action is shown

