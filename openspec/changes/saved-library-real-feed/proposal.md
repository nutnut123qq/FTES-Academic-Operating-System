# Saved library: nạp bài viết đã lưu từ endpoint bookmark THẬT (bỏ join feed bằng id giả)

## Why

Trang `/saved` (`SavedLibrary`) đang giải dữ liệu cho các bài viết đã lưu bằng cách
JOIN id trong store `localStorage` với **feed nhóm** và **feed môn học** gọi bằng id
GIẢ `"saved-library"`:

```
useQueryGroupFeedSwr("saved-library")
useQuerySubjectFeedSwr("saved-library", "forYou")
```

Từ khi hai feed này được nối vào REST/GraphQL thật (`GET /api/v1/groups/{id}/feed`,
`subjectWorkspace(subjectId)`), `GroupController.feed(@PathVariable UUID id, ...)` ép
`"saved-library"` → `UUID` → `MethodArgumentTypeMismatch` → **400 Bad Request** ngay khi
mở trang. Feed cộng đồng (`useQueryCommunityFeedSwr`) cũng chỉ dùng để giải bài viết
theo id — một cách join mong manh (bài không nằm trang đầu feed bị rơi im lặng).

Trong khi đó backend ĐÃ có endpoint chuyên trách trả về đúng danh sách bài viết mà
người dùng đã lưu, hydrate đầy đủ (tác giả/tiêu đề/snippet/like/comment), mới-lưu-trước,
cursor+limit: `GET /api/v1/community/bookmarks/posts`
(`community/web/InteractionController.java` → `bookmarks/posts`). FE cũng đã có hook
`useQueryBookmarkedPostsSwr` gọi đúng endpoint này (đang dùng ở `/community/saved`), và
`SaveButton` cho bài viết đã ghi bookmark THẬT qua `PUT/DELETE /community/bookmarks/{id}`.
Nghĩa là cách join feed cho bài viết vừa **gây 400** vừa **đã lỗi thời**.

## What Changes

- **Bỏ 3 lời gọi feed để giải bài viết** trong `SavedLibrary`:
  `useQueryGroupFeedSwr("saved-library")`, `useQuerySubjectFeedSwr("saved-library", ...)`
  (nguồn 400) và `useQueryCommunityFeedSwr()` (join mong manh) — không còn request nào
  bắn với id giả `"saved-library"`.
- **Giải bài viết đã lưu bằng endpoint bookmark THẬT**: dùng `useQueryBookmarkedPostsSwr`
  (`GET /api/v1/community/bookmarks/posts`) làm nguồn dữ liệu hiển thị cho bài viết; tra
  theo `postId` để lấy tác giả/tiêu đề/snippet đã hydrate từ BE.
- **Giữ nguyên cơ chế còn lại**: tập "đã lưu" + thứ tự mới-lưu-trước vẫn do store
  `savedItems` (localStorage) nắm; dòng "nguồn" (Cộng đồng / tên nhóm / tên môn) vẫn lấy
  từ `source` lưu lúc bấm; `SaveButton` bỏ-lưu-tại-chỗ vẫn hoạt động như cũ (store toggle
  → hàng biến mất ngay; đồng thời `DELETE /community/bookmarks/{id}` chạy nền). Tài liệu
  và khoá học không đổi.
- **Không regress** feed nhóm/feed môn thật: các hook đó vẫn được `GroupFeed`,
  `SubjectCommunity`, `SubjectOverview` gọi bằng id THẬT — chỉ gỡ chỗ dùng sai id giả.

## Capabilities

### New Capabilities

Không thêm capability mới. Thay đổi bổ sung cho capability `saved-library-page` một yêu
cầu về NGUỒN dữ liệu bài viết (endpoint bookmark thật thay cho join feed id giả).

## Impact

- Affected specs: `saved-library-page` (thêm 1 requirement về nguồn hydrate bài viết).
- Affected code (FE-only):
  `src/components/features/saved/SavedLibrary/index.tsx` (gỡ 3 hook feed, thêm
  `useQueryBookmarkedPostsSwr`, viết lại nhánh giải "post" + loading/error/retry).
- **Không đụng backend**: endpoint `GET /api/v1/community/bookmarks/posts` đã tồn tại;
  `SaveButton` đã ghi bookmark thật. Đây là FE-only fix.
- Follow-up (ngoài phạm vi): tập "đã lưu" của `/saved` cho bài viết vẫn theo store
  localStorage (device-local) + giải theo trang bookmark đã nạp; bản endpoint-driven đầy
  đủ, cross-device đã có ở trang riêng `/community/saved`.
