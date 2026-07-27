# preview-blur-document-trial-only

## ADDED Requirements

### Requirement: Preview blur cover limited to DOCUMENT free-trial lessons
The lesson reader SHALL show the partial-preview blur affordances — the bottom fade gradient over `#lesson-article`, the `select-none` on the article, and the "You're viewing the preview / Subscribe to a package" teaser footer — ONLY when the lesson content type is DOCUMENT AND the lesson is a free-trial preview (`isLocked` with `accessLevel === "PREVIEW"`). It SHALL NOT show any of these affordances for a VIDEO lesson, nor for a lesson that is not a free-trial preview.

#### Scenario: Document free-trial preview shows the blur teaser
- **WHEN** a non-purchaser opens a DOCUMENT lesson served as a PREVIEW with teaser text
- **THEN** the article renders `select-none`, a bottom fade gradient over the teaser, and the "viewing the preview" paywall footer

#### Scenario: Video free-trial preview does not blur the article
- **WHEN** a non-purchaser opens a VIDEO lesson served as a PREVIEW (its own preview-remaining countdown chip is present)
- **THEN** the article renders no fade gradient, no `select-none`, and no "viewing the preview" teaser footer
- **AND** the video's own preview-remaining clamp remains the only gating surface

#### Scenario: Fully-locked no-trial lesson keeps the hard paywall
- **WHEN** a non-purchaser opens a lesson whose `accessLevel` is NONE (no trial)
- **THEN** the partial-preview blur teaser does not render
- **AND** the separate hard paywall (locked title + enroll CTA) still renders

### Requirement: Per-lesson access badges in the course content map
The course content-map rail SHALL show, on each lesson row, a "Preview" chip (accent tone) when the lesson `accessLevel` is PREVIEW, a "Premium" chip with a lock icon when the lesson is locked with no trial, and neither badge for a lesson the viewer fully owns.

#### Scenario: Trial viewer sees preview and premium badges
- **WHEN** a not-yet-purchased viewer opens the content map of a course with mixed access
- **THEN** each PREVIEW lesson row shows a "Preview" chip
- **AND** each locked (no-trial) lesson row shows a "Premium" chip with a lock icon

#### Scenario: Fully-enrolled viewer sees no access badge
- **WHEN** a viewer with full course access opens the content map
- **THEN** no lesson row shows a "Preview" or "Premium" badge

### Requirement: Branded course cover in the package gate modal
The package gate modal — including the video "preview has ended" gate — SHALL render the course cover image (from the course `imageHeader`) beside the modal title with the course title as its `alt`, and SHALL fall back to the lock-icon header layout when no cover image is available.

#### Scenario: Preview-ended modal shows the course cover
- **WHEN** a video preview reaches its limit and the package gate modal opens for a course that has a cover image
- **THEN** the modal header shows the course cover thumbnail with `alt` equal to the course title

#### Scenario: Missing cover degrades to the lock icon
- **WHEN** the package gate modal opens for a course with no cover image
- **THEN** the modal header shows the lock-icon badge layout unchanged

### Requirement: Video fullscreen control in the bottom-right corner
Both the YouTube-embed player and the self-hosted (native `<video>`) player SHALL position the custom fullscreen (enlarge/shrink) control in the bottom-right corner of the video, keeping it clickable above the media, without changing its enter/exit behavior.

#### Scenario: Fullscreen button is bottom-right on both players
- **WHEN** a lesson video renders (YouTube embed or self-hosted)
- **THEN** the fullscreen toggle appears in the bottom-right corner of the video
- **AND** pressing it still enters or exits container fullscreen as before
