## 1. Editor dùng chung (nền tảng)

- [x] 1.1 Thêm `src/components/reuseable/RichTextEditor/index.tsx` — editor CONTROLLED,
  presentational (props `value`/`onChange` Markdown, `placeholder`, `minHeight`,
  `toolbar: "comment" | "full"`, `onUploadImage?`, `autoFocus`, `disabled`, `ariaLabel`)
- [x] 1.2 Tách `extensions.ts`: `buildEditorExtensions({ placeholder, headings })` + node
  `ProfileMention` + `getEditorMarkdown` + `trimMarkdown` (dùng chung comment + body)
- [x] 1.3 Chuyển `mention-suggestion.ts` (+ test) sang `RichTextEditor/` (base sở hữu `@mention`)
- [x] 1.4 Refactor `RichCommentEditor` consume `buildEditorExtensions` — GIỮ NGUYÊN chrome
  submit/emoji/sticker/Ctrl+Enter (UX comment không regress)
- [x] 1.5 Scope `"full"`: thêm H2/H3 + nút chèn ảnh (upload → chèn `![alt](url)`)
- [x] 1.6 i18n: namespace `richEditor.*` (vi + en, mirrored)

## 2. Pha 0 — sửa comment inline (comment scope, không rủi ro định dạng)

- [x] 2.1 `PostCommentThread` `CommentRow`: ô sửa comment `TextArea` → `RichTextEditor`
  (render đã là `MarkdownContent`)

## 3. Pha 1 — community (composer + render kèm)

- [x] 3.1 `CommunityComposerForm`: body bài MỚI → `RichTextEditor` scope `"full"` (giữ commentary
  repost dạng plain vì repost card render raw)
- [x] 3.2 `CommunityPostDetail/PostEditDialog`: body sửa bài → `RichTextEditor` `"full"`
- [x] 3.3 Render kèm: `CommunityPostDetail` body `Typography` → `MarkdownContent`

## 4. Pha 2 — block Discussion (4 bề mặt cùng lúc)

- [x] 4.1 `reuseable/Discussion/CommentComposer`: `TextArea` → `RichTextEditor` `"comment"`
  (phủ cả tạo/trả lời/sửa)
- [x] 4.2 `reuseable/Discussion/CommentItem`: render `{comment.body}` → `MarkdownContent`

## 5. Pha 3 — bodies + thông báo + mô tả (composer + render kèm)

- [x] 5.1 Blog comment: `BlogEngagement/CommentComposer` → editor; `BlogEngagement/CommentItem`
  render → `MarkdownContent` (giới hạn 5000 ký tự chuyển sang chặn lúc submit)
- [x] 5.2 Bài Thảo luận môn: `SubjectCommunity` `SubjectComposer` → editor; `SubjectPostRow`
  snippet → `MarkdownContent`
- [x] 5.3 Feed nhóm: `GroupFeedComposer` → editor; `GroupFeed` card → `MarkdownContent`
- [x] 5.4 Thông báo nhóm: `AnnouncementForm` → editor; card thông báo → `MarkdownContent`
- [x] 5.5 Mô tả nhóm: `GroupCreate` + `GroupInfoSection` → editor; `GroupsList` card →
  `MarkdownContent`

## 6. Pha 4 — DEFER (follow-up, CHƯA làm)

- [ ] 6.1 Group thread body (chưa render/ngắn) → theo dõi
- [ ] 6.2 Group event description → theo dõi
- [ ] 6.3 Resource description + resource review → theo dõi
- [ ] 6.4 Collection note/description → theo dõi
- [ ] 6.5 Profile bio → theo dõi

## 7. Verify

- [x] 7.1 `npx tsc --noEmit` sạch (sau mỗi pha và cuối cùng)
- [x] 7.2 `npm run build` (webpack) biên dịch thành công
