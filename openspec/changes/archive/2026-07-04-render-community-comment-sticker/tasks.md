## 1. Parser & Self-Check

- [x] 1.1 Create `src/components/reuseable/PostCommentThread/parse-sticker.ts` with `parseStickerFromText(text)` returning `{ plainText, stickerFile, stickerAlt }`.
- [x] 1.2 Add runtime self-check assertions: token input → file/alt/text clean; non-token input → no sticker, text unchanged.
- [x] 1.3 Export the sticker token regex/path pattern so the composer and parser share one source of truth.

## 2. Render Path

- [x] 2.1 Update `CommentRow` in `src/components/reuseable/PostCommentThread/index.tsx` to call the parser and render plain text via `Typography` only when non-empty.
- [x] 2.2 Render parsed sticker as `<img className="size-20 object-contain" src="/stickers/<file>" alt="<alt>" />` when present.
- [x] 2.3 Ensure the sticker image is placed after the plain text block and does not break the existing row layout (avatar + content column).

## 3. Composer Alignment

- [x] 3.1 Update composer serialization in `PostCommentThread` to write `![<localized label>](/stickers/<file>.svg)` instead of `![](...)`.
- [x] 3.2 Verify the regex in `parse-sticker.ts` matches the new serialized format.

## 4. Runtime Verify Fixture

- [x] 4.1 Add a mock comment containing a sticker token to `fetchPostDetailMock` in `src/components/features/community/hooks/useQueryPostDetailSwr.ts`.
- [x] 4.2 Run the parser self-check manually (`npx tsx` on a small script) and confirm assertions pass.
- [x] 4.3 Inspect generated markup / manual smoke-test to confirm the sticker renders as `<img>` and the literal Markdown string does not appear.

## 5. Verify & Archive

- [x] 5.1 Run `npx tsc --noEmit` and fix type errors.
- [x] 5.2 Run `npm run lint` on touched files and fix lint errors.
- [x] 5.3 Run `npm run build` (webpack) and fix build errors.
- [x] 5.4 Run `starci-fe-cannon-audit` on the changed area and address P0/P1 findings.
- [x] 5.5 Run `starci-fe-layout-apply` on the comment row if spacing changes are needed.
- [x] 5.6 Run `openspec-archive-change` for `render-community-comment-sticker`.
