# mindmap-radial-progressive

## ADDED Requirements

### Requirement: Sections are distributed radially around the central course node
The course mind map SHALL place the subject-code root node at the centre and distribute the section (Phần) nodes RADIALLY around it — evenly on all sides at angles `2π·i/N` on a ring, not down a single one-sided column — with the ring radius scaling with the section count so cards never overlap. Positions SHALL be computed with trigonometry (`centre + radius·(cos θ, sin θ)`), and edges SHALL be drawn as straight centre-to-centre spokes (source/target handles at each node's centre). When a section is expanded, its child nodes (lessons + exercises) SHALL fan further outward along that branch's direction, kept inside the section's own angular sector so branches do not overlap each other or the centre.

#### Scenario: Sections fan out on every side of the centre
- **WHEN** the mind map renders a course with N sections
- **THEN** the subject-code root node is at the centre and the N section nodes are placed around it at angles `2π·i/N` on a ring
- **AND** the sections are distributed on all sides (not laid out on one side of the root)

#### Scenario: Ring radius grows with the section count
- **WHEN** a course has many sections
- **THEN** the ring radius scales up with the section count so adjacent section cards do not overlap

#### Scenario: An expanded section's children fan outward within its sector
- **WHEN** a section is expanded
- **THEN** its lesson (and exercise) nodes fan further out along that branch, further from the centre
- **AND** they stay within the section's angular sector so they do not overlap other sections or the centre

### Requirement: Progressive disclosure — sections collapsed by default, expand to reveal children, click a lesson to learn
The mind map SHALL show ONLY the section (Phần) nodes on first paint (all sections collapsed). Clicking a section node SHALL toggle it: an expand reveals that section's lesson (bài) and exercise (bài tập) child nodes, and a second click collapses them again; expanded state SHALL be tracked per-section (a set of expanded section ids). Clicking a LESSON or EXERCISE node SHALL navigate to that lesson's learn page using the existing learn route builder (a challenge routing to its per-lesson solver via its slug), while a fully-locked node SHALL open the same package gate the content-map opens. Clicking the root node SHALL re-frame the camera and SHALL NOT navigate.

#### Scenario: First paint shows sections only
- **WHEN** the mind map first renders with course data
- **THEN** only the section nodes are shown (no lesson or exercise nodes)
- **AND** each section with lessons carries an expand affordance (a caret)

#### Scenario: Expanding then collapsing a section
- **WHEN** the viewer clicks a collapsed section node
- **THEN** that section's lesson and exercise child nodes appear
- **WHEN** the viewer clicks the same section node again
- **THEN** those child nodes are hidden again

#### Scenario: Clicking a lesson navigates to its learn page
- **WHEN** the viewer clicks a lesson node they can access
- **THEN** the app navigates to that lesson's learn content route (`/courses/{courseId}/learn/content/modules/{moduleId}/contents/{lessonId}`)
- **WHEN** the viewer clicks a lesson node that is fully locked
- **THEN** the package gate opens on that lesson instead of navigating into a locked lesson

### Requirement: Section and lesson nodes show a description subtitle
Section (Phần) and lesson (buổi/bài) nodes SHALL display their description as a short subtitle under the title, sourced from the course-outline data already exposed on the learn tree (`module.description` / `lesson.description`, from the course detail's `section.description` / `lesson.description`). The subtitle SHALL be truncated (clamped to two lines) so nodes stay compact, and SHALL be omitted gracefully when the description is empty or absent (so an older backend response that omits it degrades cleanly). Exercise nodes carry no description in the current contract and SHALL show none.

#### Scenario: A section with a description shows it under the title
- **WHEN** a section node's data carries a non-empty description
- **THEN** the node shows that description as a subtitle under the title, clamped to at most two lines

#### Scenario: A lesson with a description shows it under the title
- **WHEN** a lesson node's data carries a non-empty description
- **THEN** the node shows that description as a subtitle under the title

#### Scenario: An empty description is omitted
- **WHEN** a section or lesson node has an empty or absent description
- **THEN** no subtitle is rendered and the node stays compact
