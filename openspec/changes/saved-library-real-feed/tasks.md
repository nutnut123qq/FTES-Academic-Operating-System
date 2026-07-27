# Tasks — saved-library-real-feed

## 1. Gỡ join feed bằng id giả trong SavedLibrary
- [x] 1.1 Bỏ import + lời gọi `useQueryCommunityFeedSwr`, `useQueryGroupFeedSwr("saved-library")`, `useQuerySubjectFeedSwr("saved-library", "forYou")`.
- [x] 1.2 Thêm `useQueryBookmarkedPostsSwr` (+ type `SavedPost`) và dựng `Map<postId, SavedPost>` từ `posts`.

## 2. Giải bài viết bằng endpoint bookmark thật
- [x] 2.1 Viết lại nhánh `entityType === "post"` trong `resolve()`: tra `postsById.get(entry.entityId)`; tác giả/tiêu đề/snippet lấy từ `SavedPost`; dòng "nguồn" giữ từ `entry.source` (fallback `savedItems.source.community`); id không có trong map → drop im lặng.
- [x] 2.2 Cập nhật `isJoining` / `joinError` / `retryJoins` sang `resources` + `courses` + `bookmarked posts` (bỏ group/subject/community feed).
- [x] 2.3 Cập nhật deps `useMemo` của `rows` và TSDoc mô tả nguồn dữ liệu mới.

## 3. Verify
- [x] 3.1 `npx tsc --noEmit` exit 0.
- [x] 3.2 `npm run build` (webpack) xanh.
- [x] 3.3 Không còn request nào tới `/groups/saved-library/feed` hay `subjectWorkspace(subjectId: "saved-library")` (grep sạch id giả trong `src`).
- [x] 3.4 Feed nhóm/feed môn thật (`GroupFeed`, `SubjectCommunity`, `SubjectOverview`) vẫn gọi bằng id thật — không regress.
