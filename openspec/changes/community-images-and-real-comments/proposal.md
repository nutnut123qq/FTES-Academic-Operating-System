## Why

Hai lỗ hổng khiến cộng đồng chưa dùng được:

1. **Bình luận ở tab "Thảo luận" của Không gian học không lưu.**
   `SubjectCommunity.onSubmit` chỉ chèn comment vào cache SWR rồi `return true` — không gọi API
   nào. Người dùng gõ xong thấy comment hiện ra, F5 là mất. (Trang `/community` thì đã gọi REST thật.)
2. **Không đăng được ảnh ở đâu cả.** `CreatePostRequest.media` đã có trong type FE và BE đã nhận,
   nhưng không màn hình nào gửi `media`, và cũng chưa có lời gọi upload ảnh nào cho community.

Ngoài ra tab "Thảo luận" **không có form đăng bài** — chỉ đọc.

Backend vừa bổ sung (change `community-media-upload`): `POST /api/v1/community/media` (gate
`community.post.create`, ≤4 ảnh/post, 10MB/ảnh), `Post.media` trên GraphQL, và media trong feed REST.

## What Changes

- **Lời gọi upload ảnh**: `uploadCommunityMedia(file)` → `POST /community/media` (multipart, part `file`).
- **Bộ chọn ảnh dùng chung** cho composer: chọn tối đa 4 ảnh, xem trước, xoá từng ảnh, chặn quá cỡ
  và sai định dạng ngay tại client, hiện trạng thái đang tải.
- **Composer cộng đồng** (`/community/new` + modal) gửi kèm `media[]` là các `secureUrl` vừa upload.
- **Feed và trang chi tiết hiển thị ảnh**: query GraphQL chọn thêm `media`, card render lưới ảnh.
- **Tab "Thảo luận" môn học có composer riêng**: đăng bài kèm ảnh vào đúng môn (`subjectId` là UUID
  của môn, không phải mã môn trên URL).
- **Bình luận ở tab "Thảo luận" gọi API thật** (`POST /community/posts/{id}/comments`) với optimistic
  append + rollback khi lỗi, thay cho `return true` giả hiện tại.

## Capabilities

### New Capabilities
- `community-post-images`: chọn/tải/hiển thị ảnh đính kèm bài đăng cộng đồng trên FE.

### Modified Capabilities
- `subject-community`: tab Thảo luận có đường ghi thật (đăng bài + bình luận), không còn optimistic-only.

## Impact

- **Mới**: `src/modules/api/rest/community/community.ts` (hàm upload), component chọn ảnh dùng chung,
  hook mutate đăng bài cho subject, hook mutate comment cho subject.
- **Sửa**: `CommunityComposerForm`, `CommunityFeed`, `CommunityPostDetail`, `SubjectCommunity`,
  `useQueryCommunityFeedSwr`, `useQueryPostDetailSwr`, `useQuerySubjectFeedSwr`,
  `query-community-feed.ts`, `query-community-post.ts`, `query-subject-community.ts`.
- **i18n**: khoá mới trong `communityHub.composer.*` và `subjects.community.*` (vi + en).
- **Phụ thuộc BE**: cần bản BE có `POST /community/media` và `Post.media` (đã deploy apitest).
