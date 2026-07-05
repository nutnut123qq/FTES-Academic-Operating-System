# post-engagement Specification

## Purpose
Engagement interactions on posts and discussions: like, comment, share, save, and comment display.

## ADDED Requirements

### Requirement: Comment rows render via MarkdownContent
Each `CommentRow` SHALL render `comment.text` through the shared `MarkdownContent` component in compact mode (`reading={false}`) instead of plain `Typography`.

#### Scenario: View formatted comment
- **GIVEN** a comment body contains Markdown such as bold text, a list, and a link
- **WHEN** the comment row renders
- **THEN** the formatted text, list, and link are rendered using `MarkdownContent`

### Requirement: Sticker images render inline and small
When `MarkdownContent` renders an image whose `src` starts with `/stickers/`, it SHALL render as an inline small image without a figure or border. Other images SHALL keep the existing full-width figure behavior.

#### Scenario: Sticker in comment
- **GIVEN** a comment body contains `![Yêu thích](/stickers/heart.svg)`
- **WHEN** the comment row renders
- **THEN** the sticker appears as a small inline image (e.g. `size-20 object-contain`) and no figure caption is rendered

#### Scenario: Non-sticker image unchanged
- **GIVEN** a comment body contains a regular Markdown image not under `/stickers/`
- **WHEN** the comment row renders
- **THEN** it keeps the existing full-width figure/image behavior

### Requirement: Remove manual sticker parsing
`CommentRow` SHALL NOT use `parseStickerFromText` or any manual sticker parsing logic. Sticker rendering SHALL be handled entirely by `MarkdownContent`.

#### Scenario: Comment row code cleanup
- **WHEN** the `CommentRow` component is inspected
- **THEN** it imports and uses `MarkdownContent` and does not import `parseStickerFromText`

## MODIFIED Requirements

*None beyond the added rendering requirements above.*

## REMOVED Requirements

*None.*
