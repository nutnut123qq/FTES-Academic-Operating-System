## 1. Discovery & Prep

- [x] 1.1 Read `starci-fe-cannon-apply` skill and `.claude/cannon/CONTENT.md` to confirm component/hook conventions (HeroUI v3 compound anatomy, spacing scale, i18n, Phosphor icons).
- [x] 1.2 Inspect the current composer implementation in `src/components/reuseable/PostCommentThread/index.tsx` and the SWR mutation `useMutateCreatePostCommentSwr`.
- [x] 1.3 Inspect existing i18n files (e.g., `src/messages/vi.json`, `src/messages/en.json`) to confirm key structure and all locales.

## 2. Dependency & Assets

- [x] 2.1 Install `pixelarticons` as a runtime dependency (`npm install pixelarticons`).
- [x] 2.2 Create `public/stickers/` and copy a curated subset of ~12–20 SVG files from `node_modules/pixelarticons/svg/`.
- [x] 2.3 Create a manifest/index file that maps sticker file names to display labels/alt text so the grid can iterate without hardcoding filenames in components.

## 3. New Toolbar Components (on-canon)

- [x] 3.1 Create `src/components/reuseable/CommentComposerTools/index.tsx` barrel export.
- [x] 3.2 Create `src/components/reuseable/CommentComposerTools/EmojiPicker.tsx`: HeroUI `Popover` + static ~40-emoji grid, inserts emoji at caret via `textareaRef` callback.
- [x] 3.3 Create `src/components/reuseable/CommentComposerTools/StickerPicker.tsx`: HeroUI `Popover` + grid of sticker thumbnails from the manifest, on select calls `onSelect(stickerKey)`.
- [x] 3.4 Create `src/components/reuseable/CommentComposerTools/StickerChip.tsx`: chip preview of the selected sticker with a Phosphor remove button.

## 4. Composer Integration

- [x] 4.1 Change textarea class from `rounded-large` to `rounded-2xl` in `PostCommentThread`.
- [x] 4.2 Add a toolbar row above/below the textarea with Phosphor emoji and sticker buttons, wired to the new picker components.
- [x] 4.3 Track selected sticker state in the composer; render `StickerChip` when a sticker is selected.
- [x] 4.4 Serialize the sticker to Markdown image syntax (`![](/stickers/<name>.svg)`) and append to `body` before calling the create-comment mutation.
- [x] 4.5 Update empty-input guard so a selected sticker enables submit even when textarea is empty.
- [x] 4.6 Preserve existing behaviors: auto-grow, Enter submit, Shift+Enter newline, mobile sticky positioning, optimistic update, and draft preservation on error.

## 5. i18n

- [x] 5.1 Add new keys for toolbar labels and sticker alt text under `engagement.*` in every locale (e.g., `engagement.emojiPickerLabel`, `engagement.stickerPickerLabel`, `engagement.stickerAlt`, `engagement.removeSticker`).
- [x] 5.2 Use the new keys in `EmojiPicker`, `StickerPicker`, and `StickerChip` instead of hardcoded strings.

## 6. Verify & Polish

- [x] 6.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 6.2 Run `npm run build` (webpack) and fix build errors.
- [x] 6.3 Run `npm run lint` and fix lint errors.
- [x] 6.4 Run `starci-fe-cannon-audit` on the changed files and address P0/P1 findings.
- [x] 6.5 Run `starci-fe-layout-apply` on the composer region to ensure toolbar spacing follows the house scale.
