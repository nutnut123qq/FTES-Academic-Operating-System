# home-press-coverage

## ADDED Requirements

### Requirement: Press coverage section on the home landing
The home landing SHALL render a press-coverage section from a curated `PRESS_ARTICLES` list, using the shared section layout, and SHALL hide the section entirely when the list is empty.

#### Scenario: Section renders with curated articles
- **WHEN** a visitor opens the home page and `PRESS_ARTICLES` is non-empty
- **THEN** a "press / media coverage" section appears with a heading, a source strip, a featured article, and a grid of the remaining articles

#### Scenario: Section hidden when empty
- **WHEN** `PRESS_ARTICLES` is empty
- **THEN** the section does not render and no empty container is shown

### Requirement: Article cards link out safely
Each article SHALL be a single clickable card linking to its source URL, opening in a new tab with `rel="noopener noreferrer"`, exposing an accessible name that includes the article title, the source label, and a new-tab indication.

#### Scenario: Opening an article
- **WHEN** the visitor activates a press card
- **THEN** the source article opens in a new browser tab
- **AND** the link carries `target="_blank"` and `rel="noopener noreferrer"`

### Requirement: Source strip lists distinct publishers
The section SHALL show a "featured on" strip listing each distinct source (by `source` key) exactly once, using a logo when available and the source label otherwise.

#### Scenario: Duplicate sources collapsed
- **WHEN** multiple articles share the same source (e.g. several from Báo Gia Lai)
- **THEN** that source appears only once in the strip

### Requirement: Thumbnail with graceful fallback
Each card SHALL show a self-hosted thumbnail with the article title as `alt` and `loading="lazy"`, and SHALL fall back to a source-labeled placeholder when the image fails to load, without breaking the layout.

#### Scenario: Missing image falls back
- **WHEN** a card's thumbnail fails to load
- **THEN** a placeholder showing the source label renders in its place and the card layout is preserved

### Requirement: Localization and preserved article titles
The section chrome (eyebrow, title, subtitle, "read article", "featured on", new-tab text) SHALL be localized in Vietnamese and English, while article titles and source labels SHALL remain in their original Vietnamese in both locales.

#### Scenario: English locale keeps article titles
- **WHEN** the app locale is English
- **THEN** the section headings render from the `en` bundle while each article title stays in its original Vietnamese
