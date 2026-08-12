# Tasks — group-post-comments-graphql

## 1. Đường ĐỌC sang GraphQL
- [x] 1.1 `GroupFeed/index.tsx`: thay `useQueryGroupPostCommentsSwr` bằng
      `useQueryPostCommentsSwr(post.id, hasOpened)`, destructure `const { post: detail, … }` để
      không shadow prop `post` của card
- [x] 1.2 `PostCommentThread` đọc `detail?.comments ?? []` (`isLoading && !detail`,
      `hasError` theo `detail`)

## 2. Nguyên nhân lỗi không bị nuốt
- [x] 2.1 Truyền `error` xuống `PostCommentThread` (bằng prop-set của `CommunityFeed`)

## 3. Đường GHI giữ REST, revalidate cache mới
- [x] 3.1 Dùng hook dùng chung `useMutateCreatePostCommentSwr` (vẫn
      `POST /community/posts/{postId}/comments`) → optimistic + revalidate `["post-detail", postId]`
- [x] 3.2 Bỏ `useComposeGroupPostComment` khỏi feed nhóm

## 4. Dọn mồ côi
- [x] 4.1 Grep toàn repo (kể cả test) xác nhận không còn consumer
- [x] 4.2 Xoá `group/hooks/groupComments.ts` + `group/hooks/useQueryGroupPostCommentsSwr.ts`

## 5. Test
- [x] 5.1 Test mapper trên hình dạng GraphQL thật: tên từ card ≠ uuid, reply có card + `staffRole`,
      thiếu card → chuỗi rỗng

## 6. Verify (người gọi chạy)
- [ ] 6.1 `npx vitest run src/components/features/community/hooks/useQueryPostDetailSwr.test.ts`
- [ ] 6.2 `npx tsc --noEmit` sạch + `npm run build` xanh
- [ ] 6.3 `openspec validate group-post-comments-graphql --strict`
