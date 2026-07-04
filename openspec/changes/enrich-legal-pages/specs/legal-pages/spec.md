## ADDED Requirements

### Requirement: Structured legal document model
The legal content model SHALL let a document declare a lead `intro` plus ordered numbered `sections`, where each section carries a `heading` and any combination of the following optional blocks, rendered natively with Typography (no markdown): `paragraphs`, bullet `items` (optional bold `label` + `text`), a `callout`, `definitions`, `cards`, `steps`, a `contact` block, and nested `subsections`.

#### Scenario: Section with only paragraphs
- **WHEN** a section declares `heading` and `paragraphs`
- **THEN** the page renders the heading followed by each paragraph as muted body text

#### Scenario: Section mixing blocks
- **WHEN** a section declares `heading`, `paragraphs`, a `callout`, and `cards`
- **THEN** all declared blocks render in a stable order under the heading, and omitted blocks render nothing

### Requirement: Important-notice callout
A section SHALL be able to carry a `callout` with a semantic `tone`, a `title`, and body `text`, and the page SHALL render it via the shared `blocks/feedback/Callout` block.

#### Scenario: Warning callout
- **WHEN** a section carries a `callout` with tone `warning`, a title, and text
- **THEN** the page renders a warning-tinted `Callout` with that title and text

### Requirement: Definitions glossary
A section SHALL be able to carry `definitions`, each a `term`, a `definition`, and an optional `example`, rendered as a term-anchored list.

#### Scenario: Definition with example
- **WHEN** a definition includes an `example`
- **THEN** the page renders the term, its definition, and the example as a distinct muted line

#### Scenario: Definition without example
- **WHEN** a definition omits `example`
- **THEN** only the term and definition render, with no empty example line

### Requirement: Card grid
A section SHALL be able to carry `cards`, each an optional `icon`, a `label`, and `text`, rendered as a responsive grid (payment methods, information categories, user rights).

#### Scenario: Payment method cards
- **WHEN** a section carries three cards
- **THEN** the page renders them in a responsive grid, each showing its icon, label, and text

### Requirement: Numbered steps
A section SHALL be able to carry `steps` — an ordered list of plain strings — rendered each with its 1-based number badge.

#### Scenario: Purpose list
- **WHEN** a section carries `steps` of N strings
- **THEN** the page renders N rows numbered 1..N in order

### Requirement: Contact block
A section SHALL be able to carry a `contact` block (company name, address, phone), rendered as a bordered contact panel.

#### Scenario: Contact panel
- **WHEN** a section carries a `contact` with company, address, and phone
- **THEN** the page renders a bordered panel showing all three lines

### Requirement: Per-locale content and single reading column
The `/terms` and `/privacy` pages SHALL select the document for the active locale (falling back to `vi`), render it in a single centered reading column (`max-w-3xl`) inside the existing `PageContainer` with breadcrumb, `PageHeader` (title, description, last-updated), and SHALL keep `TERMS_LAST_UPDATED` / `PRIVACY_LAST_UPDATED` and the existing `legal.*` i18n keys.

#### Scenario: Locale fallback
- **WHEN** the active locale has no document
- **THEN** the page renders the `vi` document

#### Scenario: Last updated shown
- **WHEN** either page renders
- **THEN** the header shows the localized last-updated date from the page's `*_LAST_UPDATED` constant
