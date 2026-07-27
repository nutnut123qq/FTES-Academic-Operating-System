# rich-text-composers

## ADDED Requirements

### Requirement: Shared Markdown rich-text editor
The app SHALL provide a shared, controlled, presentational rich-text editor
(`RichTextEditor`) that reads and writes Markdown and is reused by every plain-text content
composer, so formatting behaves identically everywhere without adding a new dependency or
changing the backend.

#### Scenario: Formatting produces Markdown
- **WHEN** a user applies bold, a list, a quote, inline code, or a link in the editor
- **THEN** the editor emits the equivalent Markdown through `onChange`

#### Scenario: Mention serializes to a profile link
- **WHEN** a user picks someone from the `@` typeahead
- **THEN** the mention is serialized to a Markdown profile link that `MarkdownContent` can render

#### Scenario: External value reset clears the editor
- **WHEN** the parent sets `value` back to an empty string after a successful submit
- **THEN** the editor content is cleared without re-emitting `onChange`

#### Scenario: Edit form is seeded
- **WHEN** the editor mounts with an existing Markdown `value` (editing existing content)
- **THEN** that Markdown is parsed and shown as formatted content ready to edit

### Requirement: Comment and full toolbars
The editor SHALL offer a `"comment"` toolbar (inline formatting only) and a `"full"` toolbar
that additionally exposes H2/H3 headings and an image button; the comment editor UX
(`RichCommentEditor` submit/emoji/sticker/Ctrl+Enter) MUST NOT regress.

#### Scenario: Comment scope stays lightweight
- **WHEN** a composer uses the `"comment"` toolbar
- **THEN** no heading or image control is shown and headings never enter the document

#### Scenario: Full scope inserts an uploaded image
- **WHEN** a user picks an image with the `"full"` toolbar image button
- **THEN** the image is uploaded and inserted as `![alt](url)` Markdown at the cursor

### Requirement: Markdown composers render through MarkdownContent
Every surface whose composer emits Markdown SHALL render its stored value through
`MarkdownContent` in the same change, and MUST NOT render user content as raw text or via
`dangerouslySetInnerHTML`, so no Markdown syntax leaks to readers.

#### Scenario: Community post body
- **WHEN** a community post is created or edited with the rich editor
- **THEN** its detail page renders the body through `MarkdownContent` (matching the feed card)

#### Scenario: Discussion and comment bodies
- **WHEN** a comment is written in the Discussion block, a blog comment, or an inline comment edit
- **THEN** the corresponding row renders the body through `MarkdownContent`

#### Scenario: Group and subject surfaces
- **WHEN** a group feed post, group announcement, group description, or subject discussion post
  is authored with the editor
- **THEN** its card or snippet renders the stored Markdown through `MarkdownContent`
