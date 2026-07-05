## Context

Composer comment hiện tại trong `PostCommentThread` là `<textarea>` thuần với emoji picker, sticker picker, và chip preview sticker. Body gửi đi là plain string; sticker được serialize thành Markdown image `![label](/stickers/<file>.svg)`. `CommentRow` hiển thị bằng `Typography` thuần và parse sticker thủ công qua `parse-sticker.ts`. `MarkdownContent` đã có sẵn nhưng chưa được dùng cho comment.

## Goals / Non-Goals

**Goals:**
- Thay textarea bằng Tiptap WYSIWYG editor xuất Markdown.
- Hỗ trợ định dạng: bold, italic, underline, strikethrough, link, bullet list, ordered list, blockquote, code inline, code block.
- Hỗ trợ mention `@` với mock user list.
- Emoji và sticker chèn inline vào editor (sticker là inline image node).
- Composer tuân theo luật composer-in-box của nhà.
- Hiển thị comment qua `MarkdownContent` ở chế độ compact, sticker nhỏ inline.
- Giữ nguyên `body: string`, KHÔNG đổi backend.

**Non-Goals:**
- Không thay đổi API GraphQL hoặc data model.
- Không tích hợp API user thật cho mention (mock only, ghi chú swap sau).
- Không hỗ trợ heading trong comment.
- Không hỗ trợ upload ảnh thật.

## Decisions

1. **Tiptap + tiptap-markdown**
   - Lý do: hệ sinh thái TipTap tích hợp tốt React, dễ mở rộng mention, image inline, và xuất Markdown chuẩn.
   - Thay thế: Slate cũng mạnh nhưng cần tự build markdown serializer phức tạp hơn.

2. **Component `RichCommentEditor` riêng trong `src/components/reuseable/`**
   - Lý do: reuse trên tất cả surface dùng `PostCommentThread` (CommunityFeed, CommunityPostDetail, GroupFeed, GroupDiscussion, SubjectCommunity). Tách logic editor khỏi thread.

3. **Composer-in-box: 1 box bo tròn chứa editor flat + toolbar row**
   - Lý do: tuân theo canon nhà (`.claude/rules/drafts/ai-chat-composer-box-controls-and-settings-modal.md`) và ví dụ `SubjectAiTutor`.
   - Editor zone dùng Tiptap `EditorContent` với class `bg-transparent outline-none`, không viền riêng.

4. **Sticker là inline image node**
   - Lý do: đơn giản hóa serialize/deserialize. `tiptap-markdown` tự xuất `![label](/stickers/<file>.svg)`. Bỏ `StickerChip` + `parse-sticker.ts`.

5. **Mention mock**
   - Lý do: BE/user API chưa sẵn sàng. Dùng danh sách user cố định 5 ngườidùng với ghi chú swap API. Serialize mention thành link markdown `[@displayName](/u/<username>)` để `MarkdownContent` render clickable.

6. **Phím gửi Ctrl/Cmd+Enter**
   - Lý do: Enter cần để xuống dòng và tạo list/quote trong editor.

7. **MarkdownContent compact cho CommentRow**
   - Lý do: comment không cần typography reading lớn. Giữ `reading={false}`.

## Risks / Trade-offs

- **Hydration mismatch SSR**: Tiptap có thể render khác server/client. → Dùng `immediatelyRender: false`.
- **`tiptap-markdown` inline image**: cần verify serialize sticker đúng cú pháp. → Thêm unit-like test qua mock comment.
- **Bundle size**: Tiptap extensions tăng bundle. → Accept vì comment editor là tính năng trọng tâm; chỉ import extensions cần thiết.
- **Mention suggestion UI**: Tiptap mention mặc định dùng tippy.js. → Nếu conflict dependency, tự render suggestion list đơn giản bằng HeroUI Popover.
- **Accessibility toolbar**: các nút format đều cần `aria-label` và i18n.
