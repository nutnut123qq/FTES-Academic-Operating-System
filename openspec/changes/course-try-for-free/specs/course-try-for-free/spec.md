# course-try-for-free

## ADDED Requirements

### Requirement: Document lesson reader with table of contents
The lesson view SHALL render DOCUMENT lessons from `GET /api/v1/lessons/{id}/content` as markdown (GFM) inside a paper card, with slugified heading anchors and a desktop "On this page" rail listing h2–h4 headings with scroll-spy highlighting.

#### Scenario: Entitled learner reads a document lesson
- **WHEN** a learner with full access opens a DOCUMENT lesson
- **THEN** the full markdown body renders with headings, code blocks, and tables
- **AND** clicking a TOC entry scrolls to the matching heading

### Requirement: Teaser paywall on locked documents
The lesson view SHALL, when the content response carries `locked = true`, render the server-provided teaser with a bottom gradient fade (no blur, pointer-events disabled on the overlay), disable text selection, and show an inline paywall card (lock icon, cheapest package name and price, primary CTA) directly beneath the fade.

#### Scenario: Non-purchaser reads partial document
- **WHEN** a signed-in non-purchaser opens a paid DOCUMENT lesson with preview enabled
- **THEN** only the teaser body renders, fading out at the bottom
- **AND** the paywall card shows the cheapest package price and a CTA that opens the package gate modal

### Requirement: Video preview limit experience
The video player SHALL, when the stream response has `mode = "PREVIEW"`, show a countdown chip ("Xem thử còn mm:ss"), limit the visible seek range to `previewSeconds`, and on reaching the limit pause playback, open the package gate modal, and report the limit once per lesson per session via `POST /api/v1/lessons/{id}/preview-limit`.

#### Scenario: Preview viewer hits the limit
- **WHEN** a preview viewer's playback reaches `previewSeconds`
- **THEN** the player pauses and the package gate modal opens
- **AND** the preview-limit endpoint is called exactly once for that lesson in the session

#### Scenario: Dismissing the modal keeps the gate
- **WHEN** the viewer dismisses the modal with "Để sau"
- **THEN** the video remains paused at the limit and resuming past it is not possible

### Requirement: Shared package gate modal
The app SHALL provide one package gate modal used by both document paywall and video limit, showing context-aware title, what the package unlocks, sale price (with struck original price when discounted), a purchase CTA that enters the course-enroll flow, and a dismiss link; unauthenticated users SHALL be routed through the login popup first.

#### Scenario: Purchase unlocks in place
- **WHEN** the viewer completes a package purchase from the modal
- **THEN** lesson content and stream queries revalidate and the lesson unlocks without a page reload

### Requirement: Outline reflects access level
The course outline SHALL replace the lesson-type icon with a lock icon for lessons whose `accessLevel` is NONE (clicking opens the package gate modal) and show a "Học thử" badge for lessons whose `accessLevel` is PREVIEW.

#### Scenario: Locked lesson intercepted
- **WHEN** a learner clicks an outline row with `accessLevel = "NONE"`
- **THEN** navigation is intercepted and the package gate modal opens instead
