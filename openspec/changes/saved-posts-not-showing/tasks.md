# Tasks — saved-posts-not-showing

## 1. Store: reconcile bài đã lưu từ server
- [x] 1.1 Thêm type `MergeSavedPostInput` + action `mergeSavedPosts(posts)` vào `savedItems/store.ts`: hợp nhất BỔ SUNG các post id server-known còn thiếu; giữ nguyên entry sẵn có (savedAt/source); no-op khi không có gì để thêm; giữ thứ tự mới-lưu-trước; persist localStorage.

## 2. SavedLibrary: gọi reconcile khi mở trang
- [x] 2.1 Lấy `mergeSavedPosts` từ store; thêm `useEffect` gọi nó với `bookmarkedPosts` (từ `useQueryBookmarkedPostsSwr`) — loop-safe nhờ no-op.
- [x] 2.2 Cập nhật TSDoc `SavedLibrary` mô tả TẬP bài viết giờ được reconcile từ danh sách bookmark server.

## 3. Test
- [x] 3.1 `savedItems/store.test.ts`: post server thiếu ở store được THÊM; không trùng/không ghi đè entry sẵn có; idempotent (same-ref) khi đủ id; thứ tự mới-lưu-trước; persist.
- [x] 3.2 Các test `SaveButton` cũ vẫn xanh (không regress hợp đồng ghi-bookmark).

## 4. Verify
- [x] 4.1 `npx tsc --noEmit` exit 0.
- [ ] 4.2 `npm run build` (webpack) xanh (CI/Vercel xác minh nếu build local timeout).
- [x] 4.3 `/community/saved` (CommunitySaved) không đổi — vẫn đọc thẳng bookmark server.
