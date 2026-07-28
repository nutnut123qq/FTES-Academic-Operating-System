# content-list-type-icons

## ADDED Requirements

### Requirement: Course content-list items show an icon matching their content type
Each item in a course content list SHALL display an icon that reflects the item's content type rather than one generic icon for all items. This applies to each lesson row in the learn `ContentMap` rail and each lesson row in the `CourseDetail` syllabus outline. A VIDEO lesson SHALL show a video/play icon, a DOCUMENT (written) lesson SHALL show a document icon, and a materials / resource lesson SHALL show a materials icon, resolved by a shared `lessonTypeIcon` helper from the lesson's `contentType` (the BE `LessonView.type`). Completion and lock indicators are STATE markers orthogonal to type: a completed row SHALL keep its completion icon and a locked row SHALL keep its lock icon; only the default (not-completed, not-locked) row carries the type icon. Nested exercise rows SHALL keep a per-type icon that distinguishes a challenge from an assignment.

#### Scenario: A video lesson and a document lesson show different icons
- **WHEN** the content list renders a not-completed, not-locked VIDEO lesson and a DOCUMENT lesson
- **THEN** the VIDEO row shows a video/play icon and the DOCUMENT row shows a document icon
- **AND** the two rows do not share one generic icon

#### Scenario: A materials / resource lesson shows a materials icon
- **WHEN** a lesson's content type resolves to materials / resource / attachment
- **THEN** its row shows the materials icon (paperclip), distinct from the video and document icons

#### Scenario: Completion and lock stay as state indicators
- **WHEN** a lesson row is completed, or is locked for the viewer
- **THEN** it shows the completion icon (completed) or the lock icon (locked) — not the type icon
- **AND** a not-completed, not-locked row shows the type icon rather than a generic play icon

#### Scenario: Exercise rows distinguish challenge from assignment
- **WHEN** a lesson nests a challenge and an assignment as child rows
- **THEN** the challenge shows its per-type solver icon and the assignment shows the assignment icon
- **AND** an unknown content type falls back to the default play icon rather than breaking

#### Scenario: The sibling course-detail syllabus uses the same type icons
- **WHEN** the `CourseDetail` syllabus outline lists an unlocked VIDEO lesson and an unlocked DOCUMENT lesson
- **THEN** each row shows the icon for its content type via the same `lessonTypeIcon` helper
- **AND** a locked syllabus row keeps its lock icon
