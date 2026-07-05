## 1. Dependencies

- [x] 1.1 Install Tiptap packages: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-underline`, `@tiptap/extension-placeholder`, `@tiptap/extension-image`, `@tiptap/extension-mention`, `tiptap-markdown`.
- [x] 1.2 Confirm `package.json` and lockfile updated.

## 2. RichCommentEditor component

- [x] 2.1 Create `src/components/reuseable/RichCommentEditor/index.tsx` with SSR-safe `useEditor({ immediatelyRender: false })`.
- [x] 2.2 Configure extensions: StarterKit (no heading), Link, Underline, Placeholder, Image (inline), Mention.
- [x] 2.3 Configure `tiptap-markdown` and expose `getMarkdown()` via `editor.storage.markdown`.
- [x] 2.4 Implement format toolbar with Phosphor icons and HeroUI `isIconOnly` `Button` + `onPress`.
- [x] 2.5 Integrate `EmojiPicker` to insert emoji inline via `editor.chain().focus().insertContent(emoji).run()`.
- [x] 2.6 Integrate `StickerPicker` to insert inline image node via `editor.chain().focus().insertContent({ type: "image", attrs: { src, alt } }).run()`.
- [x] 2.7 Implement `Ctrl/Cmd+Enter` submit and `Enter` newline behavior.
- [x] 2.8 Implement empty guard and clear content after successful submit.
- [x] 2.9 Implement composer-in-box layout: `rounded-2xl border border-separator focus-within:border-accent`, flat editor zone + toolbar row.

## 3. Mention support

- [x] 3.1 Create `src/components/reuseable/RichCommentEditor/mention-suggestion.ts` with mock user list and TODO for API swap.
- [x] 3.2 Configure Mention extension to use the suggestion utility.
- [x] 3.3 Ensure mention serializes to `[@displayName](/u/<username>)`.

## 4. Update PostCommentThread

- [x] 4.1 Replace `<textarea>` composer state with `<RichCommentEditor>`.
- [x] 4.2 Wire submit callback to read Markdown body from editor and call `onSubmit(body, replyTo?.id)`.
- [x] 4.3 Preserve reply mode, mobile sticky behavior, empty guard, optimistic update, and draft preservation on failure.
- [x] 4.4 Remove `parse-sticker.ts` and `StickerChip` usage from composer.
- [x] 4.5 Update `CommentRow` to render `comment.text` via `<MarkdownContent markdown={comment.text} />` (compact).
- [x] 4.6 Remove `parseStickerFromText` import and manual sticker rendering from `CommentRow`.

## 5. Update CommentComposerTools

- [x] 5.1 Update `src/components/reuseable/CommentComposerTools/index.tsx` barrel: remove `StickerChip` and `parse-sticker` exports.
- [x] 5.2 Delete `src/components/reuseable/CommentComposerTools/StickerChip.tsx`.
- [x] 5.3 Delete `src/components/reuseable/PostCommentThread/parse-sticker.ts`.
- [x] 5.4 Verify `EmojiPicker` and `StickerPicker` still work with new inline insert handlers.

## 6. Update MarkdownContent sticker rendering

- [x] 6.1 Update `src/components/reuseable/MarkdownContent/map.tsx` `img` renderer: if `src` starts with `/stickers/`, render `<img>` as `inline-block size-20 object-contain` without figure/border.
- [x] 6.2 Preserve full-width figure behavior for non-sticker images.
- [x] 6.3 Verify link renderer rejects `javascript:` URLs (add guard if needed).

## 7. Internationalization

- [x] 7.1 Add toolbar/placeholder i18n keys under `communityHub.engagement` in `src/messages/vi.json` and `src/messages/en.json`.
- [x] 7.2 Keys: `bold`, `italic`, `underline`, `strikethrough`, `link`, `bulletList`, `orderedList`, `blockquote`, `codeInline`, `codeBlock`, `mention`, `addLink`, `removeLink`, `mentionPlaceholder`.
- [x] 7.3 Ensure no hardcoded toolbar labels remain in `RichCommentEditor`.

## 8. Mock data for verification

- [x] 8.1 Add or update one mock comment in `src/components/features/community/hooks/useQueryPostDetailSwr.ts` with mixed Markdown body: bold + list + link + sticker `![Yêu thích](/stickers/heart.svg)`.
- [x] 8.2 Verify the mock renders formatted text, list, link, and small inline sticker (not raw Markdown).

## 9. Verification

- [x] 9.1 Run `npx tsc --noEmit` and fix any type errors.
- [x] 9.2 Run `npm run lint` on touched files and fix lint errors.
- [x] 9.3 Run `npm run build` (webpack) and ensure green.
- [x] 9.4 Manually verify editor supports bold, italic, list, quote, code, link, mention, and Ctrl+Enter submit.
- [x] 9.5 Manually verify sticker renders small inline in comment row via `MarkdownContent`.

## 10. OpenSpec archive

- [ ] 10.1 Run `npx openspec archive community-comment-rich-editor -y`.
- [ ] 10.2 Confirm archive location and spec sync state.
