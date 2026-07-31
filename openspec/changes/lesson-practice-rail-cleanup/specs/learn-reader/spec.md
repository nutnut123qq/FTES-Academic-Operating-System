# learn-reader

## ADDED Requirements

### Requirement: The lesson's documents appear as a right-rail panel below "Practice this lesson"
The lesson reading rail (`OnThisPage`) SHALL render a "Tài liệu cho lesson này" / "Lesson
materials" panel directly BELOW the "Practice this lesson" (`lessonRail.challenges`) panel
whenever the lesson has document/slide attachments. The panel SHALL load attachments via the
shared `useQueryLessonDocumentsSwr(contentId)` hook (SWR key `["lesson-documents", contentId]`,
so it dedupes with any other caller) and SHALL render only when `documents.length > 0`. Each
attachment SHALL be a compact link (`Label` + small links, matching the challenges panel) that
opens `doc.url` directly in a new tab (`target="_blank"` + `rel="noopener noreferrer"`) and
shows `doc.title`. The rail's early-return guard SHALL keep the rail mounted when the lesson has
documents even if it has no in-article headings and no challenge — it renders nothing only when
there are no headings AND no challenge AND no documents.

#### Scenario: A lesson with documents shows the materials panel in the rail
- **WHEN** the open lesson has one or more document attachments
- **THEN** the rail shows a "Tài liệu cho lesson này" panel below "Practice this lesson"
- **AND** each document is a link that opens its URL in a new tab

#### Scenario: A lesson with no documents shows no materials panel
- **WHEN** the open lesson has no document attachments
- **THEN** no materials panel renders in the rail

#### Scenario: A documents-only lesson still renders the rail
- **WHEN** the lesson has documents but no in-article headings and no challenge
- **THEN** the rail still renders (only the materials panel), instead of returning null

## REMOVED Requirements

### Requirement: The lesson reader shows a Content/Challenges tab bar
**Reason**: Practice now lives solely in the right-rail "Practice this lesson" panel; a
Content/Challenges tab that duplicates that entry (and can dead-end) is removed. The reader's
main area always renders the reading/content view.
**Migration**: None — the right-rail practice panel already lists the lesson's challenges as
buttons. The `DocumentReader` path stays selected by `contentType === "DOCUMENT"`, unaffected by
the removed `view` state.

### Requirement: The lesson reader top bar shows exercise and material shortcut buttons
**Reason**: The "Làm thử thách", "Làm bài tập" and "Tài liệu buổi học" top-bar buttons are
removed. Practice is reached from the right-rail panel; documents are reached from the new
right-rail materials panel; the inline `LessonDocumentsBlock` (and its `#lesson-documents`
anchor) is removed. The top bar keeps only Previous / Next and the sidebar toggle.
**Migration**: None — the after-content `TrialChallengeCta` (free challenge) and the inline
`LessonAssignmentBlock` (real assignment submission surface) at the bottom of the lesson remain.
