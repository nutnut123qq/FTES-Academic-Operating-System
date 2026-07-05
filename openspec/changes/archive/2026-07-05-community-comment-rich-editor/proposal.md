## Why

Comment composer hiện tại là `<textarea>` thuần chỉ hỗ trợ plain text + sticker đính kèm qua chip preview. Ngườidùng không thể định dạng văn bản, chèn link, list hay mention ngườikhác, làm giảm chất lượng thảo luận cộng đồng. Việc nâng cấp lên WYSIWYG giúp comment phong phú hơn trong khi vẫn giữ nguyên backend (body vẫn là string Markdown).

## What Changes

- Thay `<textarea>` trong `PostCommentThread` bằng **Tiptap WYSIWYG editor** xuất Markdown.
- Thêm component mới `RichCommentEditor` trong `src/components/reuseable/RichCommentEditor/` với đầy đủ định dạng: đậm, nghiêng, gạch chân, gạch ngang, link, bullet list, ordered list, blockquote, code inline, code block, mention.
- Chuyển emoji/sticker thành **inline insert** qua Tiptap command/image node thay vì chip preview + parse thủ công.
- Bỏ `StickerChip.tsx` và `parse-sticker.ts`.
- Cập nhật `CommentRow` render `comment.text` qua `MarkdownContent` ở chế độ compact.
- Cập nhật renderer `img` trong `MarkdownContent/map.tsx`: sticker (`/stickers/`) render inline nhỏ, ảnh khác giữ hành vi full-width.
- Thêm mention `@` với mock user list; serialize ra `[@displayName](/u/<username>)` để hiển thị clickable.
- Đổi phím gửi: **Ctrl/Cmd+Enter = Gửi**, Enter = xuống dòng.
- Thêm i18n keys toolbar trong `communityHub.engagement` (vi + en).
- Thêm mock comment Markdown hỗn hợp để verify render.

## Capabilities

### New Capabilities
- `rich-comment-editor`: Component Tiptap WYSIWYG composer cho comment, bao gồm toolbar, emoji/sticker inline, mention mock, và xuất Markdown.

### Modified Capabilities
- `community-comment-composer-tools`: Thay textarea bằng Tiptap, chuyển sticker từ chip preview sang inline image node, đổi phím gửi thành Ctrl/Cmd+Enter.
- `post-engagement`: Cập nhật hiển thị comment row từ Typography thuần sang MarkdownContent (compact); không đổi hành vi engagement bar.

## Impact

- **Frontend**: `src/components/reuseable/PostCommentThread/index.tsx`, `src/components/reuseable/CommentComposerTools/`, `src/components/reuseable/MarkdownContent/map.tsx`, `src/components/reuseable/RichCommentEditor/` (mới).
- **i18n**: `src/messages/vi.json`, `src/messages/en.json`.
- **Mock data**: `src/components/features/community/hooks/useQueryPostDetailSwr.ts`.
- **Dependencies mới**: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-underline`, `@tiptap/extension-placeholder`, `@tiptap/extension-image`, `@tiptap/extension-mention`, `tiptap-markdown`.
- **Backend**: KHÔNG đổi. `CreateCommunityPostCommentRequest.body` vẫn là `string`.
