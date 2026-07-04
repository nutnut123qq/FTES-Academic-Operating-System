## Why

The previous `upgrade-community-comment-sticker` change serializes selected stickers into `body` as Markdown image syntax, but the `CommentRow` renderer in `PostCommentThread` uses plain `Typography` and never interprets that token. Users see the literal string `![](/stickers/heart.svg)` instead of the sticker image. This change completes the feature by rendering the sticker token as a small inline image while keeping text comments plain and safe.

## What Changes

- Add a small pure helper `parse-sticker.ts` that extracts a `/stickers/<file>.svg` token from comment text.
- Update `CommentRow` in `PostCommentThread` to split text into (plain text, sticker file/alt) and render plain text with the existing `Typography`, plus a small `<img>` for the sticker.
- Update composer serialization to include the sticker label as Markdown alt text (`![<label>](/stickers/<file>.svg)`) so the rendered image has accessible alt text.
- Add a self-check assertion for the parser.
- Add a mock comment containing a sticker token to the existing mock data so the render path can be verified end-to-end without a backend.

## Capabilities

### New Capabilities
- `community-comment-sticker-render`: Render-side handling of sticker tokens inside community comments.

### Modified Capabilities
<!-- No existing spec-level requirement changes. -->

## Impact

- **Affected surfaces**: `src/components/reuseable/PostCommentThread/index.tsx`, `src/components/features/community/hooks/useQueryPostDetailSwr.ts`.
- **Backend/API**: None. `body` remains a `string`; no new field.
- **Dependencies**: None.
- **i18n**: Reuses existing `engagement.stickerAlt` key; no new keys required.
