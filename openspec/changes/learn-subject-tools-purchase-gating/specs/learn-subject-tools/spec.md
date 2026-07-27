# learn-subject-tools

## ADDED Requirements

### Requirement: Learn-page subject tools rail
The learn content dashboard right rail SHALL, when the course carries a linked
`subjectCode`, render the subject's workplace shortcuts — "Học liệu / Ôn tập" to
`/subjects/{code}/resources`, "Flashcard / Luyện tập" to `/subjects/{code}/practice`,
"Không gian môn học" to `/subjects/{code}`, and "Hỏi đáp" to
`/subjects/{code}/discussion` — and SHALL hide the entire subject group when the course
has no linked subject.

#### Scenario: Subject linked
- **WHEN** a learner opens the content dashboard of a course whose `subjectCode` is set
- **THEN** the subject group lists the four workplace shortcuts
- **AND** each shortcut navigates to the matching `/subjects/{code}/...` route

#### Scenario: No subject linked
- **WHEN** the course has no linked subject (`subjectCode` is null)
- **THEN** the subject group is not rendered at all

### Requirement: Locked learn tools open the course buy flow
The subject tools rail SHALL render features that have no working FTES route yet
(Playground, Dự án cá nhân) as locked rows carrying a lock marker (a phosphor icon, not
an emoji), and pressing a locked row SHALL open the whole-course package gate modal
(with an empty package list falling through to the COURSE_UNLOCK offer) instead of
navigating.

#### Scenario: Locked feature pressed
- **WHEN** a learner presses the Playground or Dự án cá nhân row
- **THEN** the package gate modal opens for the current course
- **AND** no navigation to a broken route occurs

### Requirement: Trial to buy nudge on the content dashboard
The learn content dashboard SHALL show a "Bạn đang học thử / Mở khóa học" card only when
the viewer has not purchased the course, hide it for purchasers, and drive its primary
CTA through the course enroll flow (resolve COURSE_UNLOCK → cart → payment) with
enroll/unlock copy, never "VIP".

#### Scenario: Non-purchaser sees the nudge
- **WHEN** a viewer who has not purchased the course opens the content dashboard
- **THEN** the trial→buy card is shown with the course price and an unlock CTA
- **AND** the continue-learning and progress blocks remain intact

#### Scenario: Purchaser hidden
- **WHEN** a viewer who has purchased the course opens the content dashboard
- **THEN** the trial→buy card is not rendered

### Requirement: Purchase-gated workplace materials
The subject Resources list SHALL, for a material the server marks `lockedForViewer`,
show a lock badge, withhold every affordance that would reveal the material body or URL
(download, ask-AI, save), and route a click on the locked row to the subject's linked
course buy page; when no course is linked the locked row SHALL be inert and show a
NEUTRAL locked hint and aria label that makes no buy promise.

#### Scenario: Locked material
- **WHEN** the Resources list contains a `lockedForViewer` material and the subject has a linked course
- **THEN** that row shows a lock badge and exposes no download / ask-AI / save control
- **AND** clicking the row navigates to `/courses/{linkedCourseId}`
- **AND** its hint and aria label promise the linked-course unlock path

#### Scenario: Locked material with no linked course
- **WHEN** a `lockedForViewer` material's subject has no linked course
- **THEN** the row is inert (no navigation on click)
- **AND** it shows a neutral "locked material" hint and aria label with no buy promise

### Requirement: Subject workspace cover image
The subject workspace header SHALL render the subject cover image from
`SubjectDetail.imageUrl` (falling back to the legacy `thumbnailUrl`) using a plain image
element so a remote host renders without Next optimizer configuration, and SHALL fall
back to the initials badge when no cover is available or the image fails to load.

#### Scenario: Cover present
- **WHEN** a subject exposes an `imageUrl`
- **THEN** the workspace header renders that cover image

#### Scenario: No cover
- **WHEN** a subject has neither `imageUrl` nor `thumbnailUrl` (or the image fails to load)
- **THEN** the header shows the subject-code initials badge
