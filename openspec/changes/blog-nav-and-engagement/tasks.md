# Tasks — blog-nav-and-engagement

## 1. Tab Blog trên header (desktop + mobile)
- [ ] 1.1 `useAppNav.tsx`: mở rộng `AppNavModule.key` union thêm `"blog"`; import
      `NewspaperIcon`; thêm `makeModule("blog", p.blog().build(), <NewspaperIcon .../>)`
      SAU community (thứ tự Home · Workplace · Course · Community · Blog).
- [ ] 1.2 i18n `nav.blog` = "Blog" trong `src/messages/vi.json` + `en.json`.
- [ ] 1.3 Cập nhật JSDoc "exactly four" → "exactly five" ở `useAppNav`/`HeaderNav`/`Navbar`
      (không đổi logic 2 consumer — cùng map từ nguồn chung).
- [ ] 1.4 Vòng chất lượng tính năng: unit test (useAppNav trả 5 module đúng thứ tự/path;
      active đúng tại `/blog` và `/blog/x`, không active tại `/`) + e2e test (desktop header
      + mobile drawer hiện tab Blog, click điều hướng `/blog`, drawer đóng) →
      đánh giá vòng 1 → fix → đánh giá vòng 2.

## 2. Types + i18n engagement
- [ ] 2.1 `src/modules/api/rest/blog/types.ts`: `BlogCommentResponse` +
      `authorUsername?: string | null`; `BlogPostPage` + `totalElements?: number | null`.
- [ ] 2.2 i18n vi+en cụm `blog.engagement.*` (design §5).

## 3. BlogEngagement UI
- [ ] 3.1 `BlogEngagement/index.tsx`: container nhận `postId` + `initialEmojiCount`;
      reaction bar post (design §3 — guard `useRequireAuth`, `aria-pressed`, disable khi
      pending); state phân trang accumulate theo `Map<id, comment>` + nút "Xem thêm" theo
      `hasNext` (design §4).
- [ ] 3.2 `CommentComposer.tsx`: textarea (max 5000) + nút gửi; guest → dòng
      `signInToComment` mở modal auth; dùng lại cho edit inline (prefill + nút lưu/huỷ).
- [ ] 3.3 `CommentItem.tsx`: author `UserLink` khi có `authorUsername`, fallback avatar-seed +
      label `anonymous`; time-ago + hậu tố `edited`; nội dung plain text
      `whitespace-pre-wrap break-words`; tim comment toggle; menu Sửa/Xoá CHỈ khi
      `comment.userId === currentUser.id` (Xoá qua confirm modal).
- [ ] 3.4 Mount vào `BlogPost/index.tsx` sau `MarkdownContent`, trước `RelatedPosts`
      (chỉ khi `data` tồn tại).
- [ ] 3.5 Vòng chất lượng tính năng: unit test (owner check, dedupe accumulate, fallback
      author null, guard guest không bắn request) + e2e test (guest đọc + bị chặn write;
      user thật tạo/sửa/xoá comment, toggle tim post/comment thấy count đổi; load more) →
      đánh giá vòng 1 → fix → đánh giá vòng 2.

## 4. Navbar search inline (desktop)
- [ ] 4.1 `navbar/Navbar/SearchInline/`: input thật (mirror style `SearchOverlayInput`:
      icon + clear + spinner; Kbd Ctrl+K khi chưa focus) đọc/ghi Redux `setSearchQuery`;
      wrapper `relative`, mở dropdown khi focus + đủ `SEARCH_MIN_CHARS`; đóng khi
      Esc / click-ngoài / chọn kết quả (design §6.1).
- [ ] 4.2 `SearchDropdown`: panel absolute dưới ô, tái dùng `SearchOverlayResults` +
      footer "Xem tất cả" → `/search?q=`; trạng thái loading (giữ kết quả cũ) / error
      retry / rỗng / guest→prompt đăng nhập; data qua `useGlobalSearch(dropdownOpen, 8)`
      (KHÔNG hook mới, KHÔNG đổi chữ ký).
- [ ] 4.3 Keyboard + a11y: ↑↓ wrap `flatRows`, Enter mở active row hoặc see-all, Esc đóng
      giữ focus; aria combobox (`aria-expanded`/`aria-activedescendant`/listbox) port từ
      overlay; ghi recent khi activate/see-all.
- [ ] 4.4 Navbar wiring: desktop thay `SearchButton` bằng `SearchInline` (xóa
      SearchButton); Ctrl/Cmd+K handler Navbar = single source: ≥ md focus ô inline,
      < md `openSearch()`; gỡ listener Ctrl+K nội bộ của `SearchOverlay`; mobile GIỮ
      icon → full-screen overlay (màn hẹp — không dropdown).
- [ ] 4.5 Vòng chất lượng tính năng: unit test (dropdown chỉ mở khi đủ min-chars + focus;
      keyboard nav wrap + Enter điều hướng; Esc đóng không xóa query; guest không bắn
      request, hiện prompt; Ctrl+K focus inline trên desktop / mở overlay mobile) +
      e2e test (gõ trực tiếp trên navbar → dropdown kết quả thật → Enter mở entity;
      click-ngoài đóng; mobile vẫn ra overlay full-screen) → đánh giá vòng 1 → fix →
      đánh giá vòng 2.

## 5. Verify chung
- [ ] 5.1 `tsc --noEmit` sạch + eslint file đã chạm.
- [ ] 5.2 `npm run build` (webpack) xanh.
- [ ] 5.3 `openspec validate blog-nav-and-engagement --strict` pass.
