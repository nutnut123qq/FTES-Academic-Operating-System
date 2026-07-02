# subject-workspace-overview — delta

## ADDED Requirements

### Requirement: Course link-out card ("Khóa học của môn này")
The subject workspace overview SHALL render a "Khóa học của môn này" (en: "Courses for this
subject") card that maps the subject to its linked course(s) via the mock `courseIds` field
on the `Subject` type. For each linked course the card SHALL show the course identity
(code/name) and a CTA linking to `/courses/[courseId]`. The card SHALL NOT embed any course
content (no lesson lists, videos, quizzes, or progress players) — it is a link-out only.
Card title, CTA, and empty/absent copy SHALL be localized (vi/en); the CTA SHALL be a real
link with an accessible name identifying the destination course.

#### Scenario: Subject with linked course(s)
- **WHEN** the overview renders for a subject whose `courseIds` contains one or more ids
- **THEN** the card lists each linked course with its identity and a CTA (vi: "Xem khóa
  học" / en: "View course") linking to `/courses/[courseId]`
- **AND** no course content (sections, lessons, video, quiz, progress) is embedded in the card

#### Scenario: Subject without a linked course
- **WHEN** the overview renders for a subject whose `courseIds` is empty
- **THEN** the card is not rendered (no empty shell, no dead CTA), and the rest of the
  overview is unaffected

#### Scenario: Loading state includes the card slot
- **WHEN** the overview is loading (subject data not yet resolved)
- **THEN** the overview skeleton includes a placeholder mirroring the course link-out card
  alongside the existing banner + hub skeleton, so the layout does not shift when data lands

#### Scenario: CTA accessibility
- **WHEN** a course CTA renders in the card
- **THEN** it is keyboard-focusable and its accessible name includes the course identity
  (not a bare "Xem" / "View")
