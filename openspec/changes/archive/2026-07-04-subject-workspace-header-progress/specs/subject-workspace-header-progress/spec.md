## ADDED Requirements

### Requirement: Progress bar for subject workspace header

The subject workspace header SHALL render a visual progress bar for course completion instead of plain percentage text.

#### Scenario: Subject header displays completion progress
- **WHEN** the header renders for a subject with `progress` value (0–100)
- **THEN** it MUST display a progress bar whose filled portion equals `subject.progress` percent
- **AND** the progress bar element MUST expose `role="progressbar"`, `aria-valuenow={subject.progress}`, `aria-valuemin="0"`, `aria-valuemax="100"`
- **AND** the previous text "{percent}% hoàn thành" / "{percent}% complete" MUST be removed from the header subtitle

### Requirement: Remove lecturer name badge from subject workspace header

The subject workspace header SHALL NOT display a badge or chip containing the lecturer/student name.

#### Scenario: Subject header does not show lecturer/user name chip
- **WHEN** the subject workspace header renders
- **THEN** no badge or chip displaying the lecturer/student name MUST appear in the header row
- **AND** only the subject identity block (icon, title, progress bar) MUST remain on that row
