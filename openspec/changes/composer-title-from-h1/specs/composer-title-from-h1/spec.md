# composer-title-from-h1

## ADDED Requirements

### Requirement: Single-editor composer with H1 title affordance
Post/article composers SHALL present a SINGLE `RichTextEditor` (toolbar `"full"`) with NO
separate title input; the `"full"` toolbar MUST expose an H1 control so the author can mark a
leading H1 as the title, and the editor MUST serialize/parse that H1 as Markdown `# `.

#### Scenario: No separate title field
- **WHEN** a user opens a post, subject discussion, group feed, or group announcement composer
- **THEN** only one rich editor is shown and there is no standalone title `<input>` above it

#### Scenario: H1 control is available
- **WHEN** a user opens the `"full"` toolbar
- **THEN** an H1 button (alongside H2/H3) toggles the current block to a level-1 heading

### Requirement: Title is derived from the leading H1 and stripped from the stored body
On submit, the composer SHALL derive the BE `title` from the FIRST block when it is an H1
(`# …`) — using its plain text — and MUST remove that H1 line from the `content` it sends, so
the stored title and body stay separate and the feed/detail never renders the title twice.

#### Scenario: Leading H1 becomes the title
- **WHEN** the editor content starts with `# My title` followed by a body
- **THEN** the post is created with `title = "My title"` and `content` = the body WITHOUT that
  H1 line

#### Scenario: H1 is not double-rendered
- **WHEN** a post whose title came from a leading H1 is displayed in a feed card or detail view
- **THEN** the title shows once (from the stored `title`) and the body rendered through
  `MarkdownContent` does not repeat it

#### Scenario: Inline marks are stripped from the derived title
- **WHEN** the leading H1 contains inline formatting (e.g. `# Hello **world**`)
- **THEN** the derived `title` is plain text (`"Hello world"`)

### Requirement: Fallback title when there is no leading H1
When the first block is NOT an H1, the composer SHALL fall back to using the first non-empty
line's plain text (trimmed, capped at 120 characters) as the `title`, and SHALL leave the
`content` unchanged; blank input yields an empty title.

#### Scenario: First line used as title
- **WHEN** the editor content has no leading H1 (e.g. a plain paragraph first)
- **THEN** the `title` is the first non-empty line's plain text and the `content` is sent as-is

#### Scenario: Empty editor yields an empty title
- **WHEN** the editor is blank or whitespace-only
- **THEN** the derived `title` and `body` are both empty and the submit control stays disabled

### Requirement: Edit round-trip recombines and re-splits title and body
When an existing post is opened for editing, the composer SHALL re-join the stored `title` and
`content` into one Markdown value (title as a leading `# ` H1) so both are edited together, and
on save SHALL split them apart again so the stored body never contains the title H1.

#### Scenario: Editing seeds a combined editor
- **WHEN** the edit dialog/form opens for a post that has a stored title
- **THEN** the single editor is seeded with `# {title}` above the existing body

#### Scenario: Saving splits the title back out
- **WHEN** the author saves the edit
- **THEN** the leading H1 is sent as `title` and the remaining Markdown is sent as `content`
  (the H1 is not duplicated into the stored body)
