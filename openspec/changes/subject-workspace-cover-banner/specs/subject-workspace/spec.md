# subject-workspace

## MODIFIED Requirements

### Requirement: Subject cover image renders as a header banner
The subject workspace header SHALL render the subject's cover image (`imageUrl`) as a
full-width banner across the top of the content region when present, so the Admin-set
"ảnh bìa môn" reads as a cover. When no cover image is present, or the image fails to
load, the header SHALL fall back to the identity row with a short subject-code initials
chip and SHALL NOT show a broken image.

#### Scenario: Subject with a cover image shows a banner
- **WHEN** the subject detail/workspace read returns a non-empty `imageUrl`
- **THEN** the workspace header shows a full-width cover banner above the identity row

#### Scenario: Subject without a cover shows only the identity row
- **WHEN** the subject has no `imageUrl` (or the image errors on load)
- **THEN** the header shows the identity row with an initials chip and no banner, never a broken image
