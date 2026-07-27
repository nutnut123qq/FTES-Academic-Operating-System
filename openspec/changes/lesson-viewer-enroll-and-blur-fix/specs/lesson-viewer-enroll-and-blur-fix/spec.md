# lesson-viewer-enroll-and-blur-fix

## ADDED Requirements

### Requirement: Locked non-document lessons show the enroll card
The lesson reader SHALL render the enroll paywall card — the lock icon, the preview/locked title (`reader.previewTitle` / `reader.lockedTitle`), and the "Enroll in course" button that opens the package gate — for any locked non-DOCUMENT lesson (video or mixed content), whether that lesson is served as a partial free-trial PREVIEW or is fully locked with no trial. Showing the enroll card SHALL NOT depend on the document-only partial-blur teaser, so a locked PREVIEW video gets the enroll card without the article blur.

#### Scenario: Locked preview video shows the enroll card
- **WHEN** a non-purchaser opens a locked VIDEO lesson served as a PREVIEW (`accessLevel === "PREVIEW"`)
- **THEN** the reader renders the enroll card with the preview title and the "Enroll in course" button
- **AND** pressing that button opens the package gate modal
- **AND** the article is not blurred (no fade gradient, no `select-none`)

#### Scenario: Fully-locked video still shows the enroll card
- **WHEN** a non-purchaser opens a fully-locked VIDEO lesson with no trial (`accessLevel` NONE)
- **THEN** the reader renders the enroll card with the locked title and the "Enroll in course" button

### Requirement: Short document preview fade stays contained within the article box
The document preview fade cover SHALL be an `inset-0` overlay that exactly matches the article container and is transparent across its top half, so that regardless of how short the article body is, the fade never extends above the container to bleed over the lesson title, description, or header. This containment SHALL apply in both the `DocumentReader` and the `LessonReader` reading-card paths, and the fade SHALL remain gated on the existing document free-trial preview condition (only shown when there is teaser body to fade).

#### Scenario: Short document preview fade does not spill over the header
- **WHEN** a non-purchaser opens a DOCUMENT free-trial preview whose body is shorter than the fade height
- **THEN** the fade gradient covers only the article box and fades softly at its bottom
- **AND** the fade does not overlay the lesson title, description, or any header above the article

#### Scenario: Empty-teaser locked lesson renders no fade
- **WHEN** a locked DOCUMENT lesson has an empty teaser body (files/links only, no markdown)
- **THEN** no fade overlay is rendered
