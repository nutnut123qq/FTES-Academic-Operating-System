## Context

The composer now appends sticker tokens as `![](/stickers/<file>.svg)` (or `![<label>](/stickers/<file>.svg)` after this change). The read-side `CommentRow` currently renders `comment.text` through a plain `Typography` element, so the token is displayed literally. The project already has a `MarkdownContent` block, but it renders images full-width with borders, which is wrong for a small inline sticker and would also enable full Markdown parsing of user comments — out of scope.

## Goals / Non-Goals

**Goals:**
- Render sticker tokens as small inline images (`size-20 object-contain`, no border).
- Keep non-sticker comment text as plain `Typography` (no full Markdown).
- Make the parser robust and self-checked.
- Ensure the token regex matches exactly what the composer emits.

**Non-Goals:**
- Converting `CommentRow` to full Markdown rendering.
- Changing the backend or GraphQL schema.
- Adding a separate `stickerId` field.
- Supporting multiple stickers per comment (future scope).

## Decisions

- **Parse, don't Markdown**: A small regex parser (`/!\[([^\]]*)\]\(\/stickers\/([\w-]+\.svg)\)/`) keeps control over image sizing/alt and avoids running user text through a Markdown pipeline.
- **Alt text from Markdown alt**: The composer will write `![<localized label>](/stickers/<file>.svg)`. The parser captures that alt for the `<img>` element, improving accessibility without new i18n keys.
- **Token path single source of truth**: Both composer and parser use `/stickers/<file>` derived from `stickerImagePath` in `CommentComposerTools`.
- **Self-check at module load**: The parser file includes runtime assertions for token/no-token cases. This is lightweight and fails fast in development/tests.

## Risks / Trade-offs

- **Regex fragility** → The composer controls the exact token format, so the regex can be kept tight. If the composer format ever changes, both sides must change together.
- **User could type the token manually** → They would see a small sticker image. This is acceptable because the token format is internal and not exposed as a user-facing shortcut; it is also harmless.
- **Sticker-only comment** → Parser returns empty plain text; `CommentRow` skips the `Typography` block and renders only the image.

## Migration Plan

1. Implement parser + self-check.
2. Update `CommentRow` render path.
3. Update composer to include alt label.
4. Add sticker mock comment.
5. Run helper self-check, `tsc --noEmit`, `npm run lint` on touched files, `npm run build`.

## Open Questions

- Should we expose a manual sticker syntax to users in the future? (Deferred; keep internal token format for now.)
