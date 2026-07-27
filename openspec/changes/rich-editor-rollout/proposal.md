## Why

Hầu hết các ô soạn nội dung do người dùng nhập trên FTES-AOS vẫn là `<textarea>`/`TextArea`
thuần: comment bài học, hỏi/đáp, comment community/blog, body bài community/subject/group,
thông báo nhóm, mô tả nhóm… Người dùng không định dạng được (đậm/nghiêng/danh sách/liên kết/
`@mention`/ảnh). Trong khi đó FTES-AOS ĐÃ có sẵn một bộ rich canon-compliant:

- `RichCommentEditor` — Tiptap + `tiptap-markdown` (serialize ra **Markdown**), có
  `@mention`/emoji/sticker/toolbar. Đang dùng cho comment community (`PostCommentThread`).
- `MarkdownContent` — react-markdown + remark-gfm + rehype-sanitize (an toàn XSS).

Không cần thêm dependency (Quill…) hay đổi backend: mọi field nội dung ở BE là `string` không
validate định dạng, và plain text là tập con của Markdown nên dữ liệu cũ vẫn render nguyên.

## What Changes

- **Editor dùng chung `RichTextEditor`** (controlled, presentational): props `value`/`onChange`
  (Markdown), `placeholder`, `minHeight`, `toolbar: "comment" | "full"`, `onUploadImage?`.
  Scope `"full"` thêm H2/H3 và nút chèn ảnh (qua `uploadCommunityMedia` → `![alt](url)`).
- **Tách base dùng chung** `buildEditorExtensions()` + node `ProfileMention` +
  `getEditorMarkdown`/`trimMarkdown`; `RichCommentEditor` refactor để consume base (giữ nguyên
  chrome submit/emoji/sticker/Ctrl+Enter — UX comment không đổi).
- **Phủ editor lên các composer** theo pha, mỗi lần đổi composer sang Markdown thì chỗ render
  tương ứng chuyển sang `MarkdownContent` trong CÙNG thay đổi (hợp đồng định dạng):
  - Sửa comment inline (`PostCommentThread`).
  - Community: composer tạo bài + dialog sửa bài (render chi tiết → `MarkdownContent`).
  - Block `Discussion` (comment bài học, Course Q&A, comment học liệu, footer reaction).
  - Blog comment; bài Thảo luận môn học; feed nhóm; thông báo nhóm; mô tả nhóm.
- **KHÔNG** thêm dependency, **KHÔNG** đổi backend, **KHÔNG** `dangerouslySetInnerHTML`.

## Capabilities

### New Capabilities
- `rich-text-composers`: một editor Markdown dùng chung phủ lên mọi composer nội dung, kèm ràng
  buộc "composer Markdown thì render qua `MarkdownContent`".

## Impact

- **Mới**: `src/components/reuseable/RichTextEditor/` (`index.tsx`, `extensions.ts`,
  `mention-suggestion.ts` chuyển từ `RichCommentEditor/`).
- **Sửa (composer + render kèm)**: `RichCommentEditor` (consume base),
  `PostCommentThread`, `CommunityComposerForm`, `CommunityPostDetail/PostEditDialog` +
  `CommunityPostDetail/index`, `reuseable/Discussion/{CommentComposer,CommentItem}`,
  `blog/BlogPost/BlogEngagement/{CommentComposer,CommentItem}`, `subject/SubjectCommunity`,
  `group/GroupFeed/{GroupFeedComposer,index}`, `group/GroupAnnouncement/{AnnouncementForm,index}`,
  `group/GroupCreate`, `group/GroupManagement/GroupInfoSection`, `group/GroupsList`.
- **i18n**: namespace mới `richEditor.*` (vi + en, mirrored).
- **Backend**: không đổi (field nội dung là `string`; lưu Markdown không cần migration).
