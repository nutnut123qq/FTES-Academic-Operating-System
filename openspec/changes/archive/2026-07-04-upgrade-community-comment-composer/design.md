## Context

The community comment composer lives in `src/components/reuseable/PostCommentThread/index.tsx` as a plain auto-growing `<textarea>`. Submission uses the existing SWR mutation `useMutateCreatePostCommentSwr` with an optimistic update. The read-side already renders comment `body` through `MarkdownContent`, so any Markdown image syntax is rendered natively.

The project uses HeroUI v3, Tailwind v4, Phosphor icons, next-intl for i18n, and an SWR-based data layer. No backend contract change is permitted for this feature.

## Goals / Non-Goals

**Goals:**
- Add rounded textarea styling (`rounded-2xl`).
- Add an emoji picker that inserts Unicode emoji at the caret position.
- Add a sticker picker that previews a selected sticker as a chip and serializes it to Markdown image syntax on submit.
- Keep all existing composer behaviors and accessibility intact.
- Add reusable, auditable components under `src/components/reuseable/CommentComposerTools/`.

**Non-Goals:**
- Changing the GraphQL schema, request/response types, or `body` type.
- Adding a real-time emoji/sticker search or infinite scrolling picker.
- Uploading custom stickers or images.
- Persisting sticker selection as a separate field.

## Decisions

- **Markdown image as sticker transport**: Stickers serialize to `![](/stickers/<name>.svg)` inside `body`. Rationale: `body` stays a `string`, no backend changes, and `MarkdownContent` already renders images. Trade-off: the backend cannot distinguish a sticker from an inline image; this is acceptable for the current scope.
- **Static emoji array**: A curated `Array<string>` of ~40 Unicode emojis instead of a third-party emoji library. Rationale: avoids extra dependency, bundle bloat, and license concerns while covering common reactions.
- **pixelarticons subset**: Install `pixelarticons`, then copy a chosen subset into `public/stickers/`. Rationale: the package is MIT-licensed and provides ~880 free SVG icons; copying a subset avoids exposing the whole package to the public asset pipeline and keeps the bundle predictable.
- **Toolbar components split**: `EmojiPicker`, `StickerPicker`, and `StickerChip` live under `CommentComposerTools/` so the main composer remains focused on input/submit orchestration.
- **Popover trigger uses HeroUI `Button` with `onPress`**: Aligns with project convention and keyboard/accessibility behavior.

## Risks / Trade-offs

- **Markdown-image ambiguity** → A comment with only a sticker is indistinguishable from a comment containing only an inline image. Mitigation: documented as a known trade-off; future backend upgrade could add a `stickerId` field or structured `body` block.
- **Sticker SVG path coupling** → Renaming or removing a sticker file breaks historical comments. Mitigation: treat `/stickers/` as a stable public asset namespace; never rename/remove files after release.
- **Caret insertion complexity** → Inserting emoji at caret and restoring selection/focus must be tested across browsers. Mitigation: use standard `setSelectionRange` on the textarea.
- **Mobile sticky layout** → New toolbar buttons must not alter the existing sticky mobile positioning or height calculations. Mitigation: keep the toolbar inside the existing composer wrapper and preserve the current bottom-padding spacer logic.

## Migration Plan

1. Install `pixelarticons`.
2. Copy selected SVGs to `public/stickers/`.
3. Implement and wire the toolbar components.
4. Update i18n catalogs.
5. Run `tsc --noEmit`, `npm run build`, `npm run lint`.

No database migration or backend deployment is required.

## Open Questions

- Should the emoji set be locale-specific in the future? (Out of scope; current set is universal Unicode.)
- Should we support sticker removal from the chip preview? (Implemented as chip with an remove button.)
