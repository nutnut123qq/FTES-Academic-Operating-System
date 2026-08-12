# group-post-comments-graphql — Bình luận bài trong feed nhóm ký bằng uuid (đọc REST → đọc GraphQL)

## Why
Bình luận trên **bài viết trong feed nhóm** đang hiện tên người bình luận là một **uuid thô**, không
avatar, và link hồ sơ `/u/<uuid>` chỉ có thể 404 (hovercard cũng 404).

Nguyên nhân là **đường ĐỌC**, không phải chỗ render: feed nhóm đọc bình luận qua REST
`GET /community/posts/{postId}/comments`, mà record BE trả về (`CommentResponse`) **chỉ có
`authorId`** — không có author card. Mapper FE vì thế đổ `dto.authorId` vào **cả ô tên lẫn
username**:

- `src/components/features/group/hooks/groupComments.ts:20-21` — `author: dto.authorId`,
  `authorUsername: dto.authorId`.

Đường GraphQL `post(id)` **đã trả sẵn** author card đầy đủ cho cả comment lẫn reply
(`comments { author { id username displayName avatarUrl staffRole } replies { … } }` —
`src/modules/api/graphql/queries/query-community-post.ts:31-38`), và **bề mặt cộng đồng đã dùng
đúng đường này** từ trước (`src/components/features/community/CommunityFeed/index.tsx:210`). Feed
nhóm là bề mặt **cuối cùng** còn đọc bình luận qua REST community.

Đây là cùng một họ lỗi đã sửa ở tab **Thảo luận** của nhóm — mapper thread/comment ở đó nay đọc
author card và có test chốt (`src/components/features/group/hooks/groupAuthorCard.test.ts:59-92`).
Feed nhóm là chỗ còn sót.

## What Changes
- **ĐỌC**: `GroupFeed` chuyển sang hook dùng chung `useQueryPostCommentsSwr(post.id, hasOpened)`
  (GraphQL `post(id)`, cache `["post-detail", postId]`) thay cho `useQueryGroupPostCommentsSwr`
  (REST). Tên/username/avatar/staffRole lấy từ author card; thiếu card → chuỗi rỗng, **không bao
  giờ là uuid**.
- **GHI**: **giữ nguyên** REST `POST /community/posts/{postId}/comments`, nhưng đi qua hook dùng
  chung `useMutateCreatePostCommentSwr` — hook này optimistic-append vào **đúng cache mới**
  (`["post-detail", postId]`), rollback khi ghi hỏng, và revalidate cache đó sau khi ghi thành
  công. Hook cũ `useComposeGroupPostComment` revalidate cache `["group-post-comments", …]` — cache
  đó sau thay đổi này không còn ai đọc.
- **Lỗi**: truyền `error` xuống `PostCommentThread` (feed nhóm trước chỉ truyền `hasError`, nuốt
  mất nguyên nhân) để phân biệt hết hạn phiên / bài riêng tư / bài đã xoá, đúng như CommunityFeed.
- Xoá 2 file thành mồ côi: `group/hooks/groupComments.ts` và
  `group/hooks/useQueryGroupPostCommentsSwr.ts` (đã grep toàn repo: consumer duy nhất là
  `GroupFeed/index.tsx`).
- Thêm test pin mapper GraphQL: tên lấy từ card (không phải uuid), reply cũng có card +
  `staffRole`, thiếu card → chuỗi rỗng.

## Capabilities
### Modified Capabilities
- `group-live-surfaces`: đường ĐỌC bình luận group post chuyển REST → GraphQL `post(id)`; đường
  GHI giữ REST nhưng revalidate cache post-detail.

## Impact
- Affected specs: `group-live-surfaces` (MODIFIED)
- Affected code: `src/components/features/group/GroupFeed/index.tsx` (đọc + ghi + `error`),
  `src/components/features/community/hooks/useQueryPostDetailSwr.ts` (export mapper cho test),
  xoá `src/components/features/group/hooks/groupComments.ts` +
  `src/components/features/group/hooks/useQueryGroupPostCommentsSwr.ts`,
  test mới `src/components/features/community/hooks/useQueryPostDetailSwr.test.ts`
- FE-only. **Không** đụng BE, **không** đụng `PostCommentThread` (component dùng chung với cộng
  đồng), **không** thêm key i18n.
- Còn lại (ngoài phạm vi): số đếm bình luận trên **card feed nhóm** không được +1 lạc quan sau khi
  gửi — hook dùng chung chỉ patch các cache feed cộng đồng. Trước thay đổi này cũng không có, nên
  không phải hồi quy.
