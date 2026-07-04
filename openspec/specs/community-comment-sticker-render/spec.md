# community-comment-sticker-render Specification

## Purpose
TBD - created by archiving change render-community-comment-sticker. Update Purpose after archive.
## Requirements
### Requirement: Parse sticker token from comment text
The renderer SHALL extract at most one sticker token matching the format emitted by the composer (`![<optional alt>](/stickers/<file>.svg)`). It SHALL return the remaining plain text, the sticker asset filename, and the alt text.

#### Scenario: Text with trailing sticker
- **GIVEN** a comment body of "Hay quá ![Yêu thích](/stickers/heart.svg)"
- **WHEN** the parser runs
- **THEN** it returns plain text "Hay quá", sticker file "heart.svg", and alt text "Yêu thích"

#### Scenario: Sticker-only comment
- **GIVEN** a comment body of "![Thích](/stickers/thumbs-up.svg)"
- **WHEN** the parser runs
- **THEN** it returns empty plain text, sticker file "thumbs-up.svg", and alt text "Thích"

#### Scenario: Plain comment without sticker
- **GIVEN** a comment body of "Cảm ơn bạn"
- **WHEN** the parser runs
- **THEN** it returns plain text "Cảm ơn bạn", no sticker file, and no alt text

### Requirement: Render sticker as a small inline image
When a sticker token is present, `CommentRow` SHALL render the sticker as one `<img>` with `className="size-20 object-contain"`, using `/stickers/<file>` as src and the parsed alt text. The image SHALL have no border and SHALL NOT be full-width.

#### Scenario: Comment contains a sticker
- **GIVEN** a parsed sticker with file "heart.svg" and alt "Yêu thích"
- **WHEN** the comment row renders
- **THEN** an `<img src="/stickers/heart.svg" alt="Yêu thích" class="size-20 object-contain">` is present

#### Scenario: Sticker image is not full-width
- **WHEN** the sticker image renders
- **THEN** it uses `size-20` (80×80 Tailwind size) and `object-contain`, not `w-full` or any border class

### Requirement: Render plain text without Markdown
The non-token portion of the comment SHALL be rendered with the existing `Typography` element. If the plain text is empty (sticker-only comment), the `Typography` block SHALL NOT be rendered.

#### Scenario: Mixed text and sticker
- **GIVEN** a comment with plain text "Hay quá" and a sticker
- **WHEN** the row renders
- **THEN** "Hay quá" appears in `Typography` and the sticker image appears below it

#### Scenario: Sticker-only comment hides text block
- **GIVEN** a comment that contains only a sticker token
- **WHEN** the row renders
- **THEN** no empty `Typography` block is rendered; only the sticker image appears

### Requirement: Composer and renderer use matching tokens
The composer SHALL serialize stickers using the same `/stickers/<file>.svg` path that the renderer parses. The alt text MAY be the localized sticker label.

#### Scenario: Composer emits recognized token
- **GIVEN** the user selects the "heart" sticker with label "Yêu thích"
- **WHEN** the composer builds the body
- **THEN** the body contains exactly "![Yêu thích](/stickers/heart.svg)"

#### Scenario: Renderer recognizes composer token
- **GIVEN** a comment body produced by the composer
- **WHEN** the renderer parses it
- **THEN** the sticker file and alt text are recovered

### Requirement: Parser self-check
The parser module SHALL include runtime assertions verifying that a token input returns the expected file/alt/text and that a non-token input returns no sticker with unchanged text.

#### Scenario: Self-check passes
- **WHEN** the parser module loads
- **THEN** its built-in assertions pass without throwing

### Requirement: No backend or schema changes
The renderer SHALL operate on the existing `comment.text: string`. It SHALL NOT require a new GraphQL field or a different data model.

#### Scenario: Render from existing comment type
- **GIVEN** a `PostComment` with `text` containing a sticker token
- **WHEN** the row renders
- **THEN** no additional fields beyond `text` are read

