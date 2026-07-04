## Why

The community comment composer is currently a plain textarea with no affordances for emoji or stickers, making reactions feel underpowered compared to modern thread-style surfaces. Adding a lightweight emoji/sticker toolbar improves expressiveness without changing the existing backend contract.

## What Changes

- Round the comment composer textarea from `rounded-large` to `rounded-2xl`.
- Add an emoji picker button in the composer toolbar: opens a HeroUI `Popover` with a curated static grid of ~40 Unicode emojis; selecting one inserts the emoji at the current caret position in the draft.
- Add a sticker picker button in the toolbar: opens a HeroUI `Popover` with a grid of ~12–20 SVG stickers from the `pixelarticons` package; selecting a sticker renders a chip preview inside the composer and serializes the sticker as a Markdown image (`![](/stickers/<name>.svg)`) appended to `body` on submit.
- Keep `body` as a plain `string`; no GraphQL schema or data-model changes.
- Introduce a new reusable `CommentComposerTools` component family under `src/components/reuseable/CommentComposerTools/`.
- Add/extend i18n keys for toolbar labels in every locale.
- Preserve all existing behaviors: auto-grow, Enter-to-submit, Shift+Enter newline, empty-input disable, mobile sticky positioning, optimistic update, and draft preservation on error.

## Capabilities

### New Capabilities
- `community-comment-composer-tools`: Toolbar behaviors for the community comment composer — emoji picker, sticker picker, sticker chip preview, and sticker serialization to Markdown image.

### Modified Capabilities
<!-- No existing spec-level behavior changes; this is a pure UI/UX enhancement that keeps the post-engagement comment contract unchanged. -->

## Impact

- **Affected surfaces**: `src/components/reuseable/PostCommentThread/index.tsx` (composer) and any consumers of the community comment composer.
- **Dependencies**: Adds `pixelarticons` as a runtime dependency; copies a subset of its SVG files into `public/stickers/`.
- **Backend/API**: None. Comment submission continues to use `CreateCommunityPostCommentRequest.body: string`.
- **i18n**: New keys under `engagement.*` for emoji/sticker toolbar labels and sticker alt text.
