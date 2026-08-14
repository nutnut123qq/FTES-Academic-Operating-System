# community-composer

## MODIFIED Requirements

### Requirement: Deriving a post title from the single editor
The composer SHALL derive a post title from a LEADING H1 (`# …`) only. When the Markdown has no
leading H1 the system SHALL send an EMPTY title and SHALL keep the whole text as the body; it
SHALL NOT promote the first line into a title while also leaving that line in the body, because
both fields then render and the post reads as the same line twice.

A surface whose write endpoint REQUIRES a non-blank title SHALL opt in explicitly via a
`fallbackTitle` option, which restores first-line derivation.

#### Scenario: Plain one-line post has no title
- **WHEN** the author types `Làm thế nào để ăn cơm` with no heading and submits
- **THEN** the request carries `title: ""` and `content: "Làm thế nào để ăn cơm"`

#### Scenario: Leading H1 still becomes the title
- **WHEN** the author types `# Hướng dẫn cài Java` followed by a body
- **THEN** the request carries that heading text as `title` and the body WITHOUT the heading line

#### Scenario: Announcement opts in to a fallback title
- **WHEN** a group announcement is submitted with no leading H1
- **THEN** the first line is used as the title, because the announcement endpoint rejects a blank title

### Requirement: Rendering a post without a title
The feed and the post detail SHALL render the title block ONLY when the stored title is
non-empty. A post with an empty title SHALL render as a single continuous text block.

#### Scenario: Untitled post renders once
- **WHEN** a post with `title: ""` is rendered in the feed
- **THEN** only the body text is shown, with no empty emphasized line above it

#### Scenario: Titled post keeps its heading
- **WHEN** a post with a non-empty title is opened
- **THEN** the title renders as the heading and the body renders below it
