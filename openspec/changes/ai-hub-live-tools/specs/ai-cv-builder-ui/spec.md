# ai-cv-builder-ui

## ADDED Requirements

### Requirement: Harvard CV builder form
The system SHALL provide a CV builder on `/ai/tools/cv-review` matching the BE `career.cv_profiles.sections` shape — header, summary, and repeaters for education/experience/projects/skills/awards — loading the caller's CV from `GET /career/cv/me` (empty form when null) and saving via `PUT /career/cv/me`.

#### Scenario: First-time user builds and saves
- **WHEN** a user with no CV fills header + education + skills and presses save
- **THEN** the PUT body carries the sections in the declared shape and the form reflects the saved state

### Requirement: Client-side Harvard PDF export
The system SHALL export the built CV to PDF entirely client-side using `@react-pdf/renderer` with a Harvard-style single-column template (uppercase section headings, bullet lists), downloaded as a blob without any BE render endpoint.

#### Scenario: Export produces a PDF
- **WHEN** the user presses "Xuất PDF" on a saved CV
- **THEN** a PDF file downloads containing every non-empty section in Harvard layout

### Requirement: Review from builder or upload
The system SHALL submit CV review jobs from either source: "Đưa CV này đi review" sends `{cvProfileId}`; the upload tab accepts pdf/docx ≤ 10MB through the existing presigned upload flow then submits `{storageKey}` (or `{resourceId}` per the upload flow's return); both poll the job and render the structured result (score badge, summary, strengths, improvements, sectionFeedback, model).

#### Scenario: Builder CV review end-to-end
- **WHEN** a user with a saved CV presses review and the job completes
- **THEN** the result panel shows score 0..100, strengths and improvements lists

#### Scenario: Wrong file type rejected client-side
- **WHEN** a user drops a .png on the upload tab
- **THEN** a validation message shows and no upload starts
