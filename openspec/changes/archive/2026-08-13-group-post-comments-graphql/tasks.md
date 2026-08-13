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
- [x] 6.1 `npx vitest run` — 857/857 (gồm 5 ca mới của mapper)
- [x] 6.2 `npx tsc --noEmit` exit 0 + `npm run build` (turbopack) xanh
- [x] 6.3 `openspec validate group-post-comments-graphql --strict` xanh

## 7. Nghiệm thu trên môi trường deploy (2026-08-13)
Soi thật trên `ftes-academic-operating-system.vercel.app`, nhóm `ac0c1e44-…` (PUBLIC) →
tab Bảng tin → bài `7c48ef05-…` (5 bình luận), đọc thẳng DOM:
- [x] 7.1 Tên tác giả là tên thật ở CẢ 5 bình luận — không ô nào là uuid (trước bản vá cả 5 đều là uuid)
- [x] 7.2 Avatar hiện; tài khoản không có ảnh rơi về ô chữ cái đầu ("AD" cho `admin_test`)
- [x] 7.3 Huy hiệu "Quản trị viên" ở 3 bình luận của ADMIN; KHÔNG có ở người thường và ở "Người dùng ẩn"
      — đúng cả nhánh dương lẫn nhánh âm
- [x] 7.4 Link hồ sơ ra `/u/<username>` thật (`khoana71`, `haitthcs`, `admin_test`). Đúng MỘT link ra
      `/u/<uuid>` và đó là ca ngoại lệ đã lường trước: tài khoản không có profile row → username cố ý
      tụt về author id cho cổng owner-gate `isMine`
- [ ] 7.5 CHƯA nghiệm thu: gửi bình luận mới có hiện ngay không. Đây là đường GHI (vẫn REST), không
      phải đường ĐỌC vừa đổi; không thử vì nhóm dùng để soi là của người khác, không ghi vào.

Bẫy môi trường ghi lại cho lần sau: nút HeroUI dùng `onPress` của react-aria nên click tổng hợp KHÔNG
ăn trong Browser pane — phải bắn `pointerdown`/`pointerup` mới bung được thread. Và `navigate()` của
pane xoá localStorage (mất token) → điều hướng trong app bằng pushState, đừng gọi lại navigate.
