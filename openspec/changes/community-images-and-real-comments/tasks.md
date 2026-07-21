## 1. Tầng API

- [x] 1.1 Thêm `uploadCommunityMedia(file: File): Promise<MediaUploadResponse>` vào `src/modules/api/rest/community/community.ts` (multipart, part `file`, `Content-Type: null` như `uploadAvatar`)
- [x] 1.2 Thêm type `MediaUploadResponse` vào `src/modules/api/rest/community/types.ts`
- [x] 1.3 `query-community-feed.ts`: selection thêm `media { id mediaType storageKey mimeType sortOrder }` + type `FeedPostMedia`
- [x] 1.4 `query-community-post.ts`: selection thêm `media { ... }` + field trong `CommunityPostNode`
- [x] 1.5 `query-subject-community.ts`: selection thêm `media { ... }` + field trong node post

## 2. Bộ chọn ảnh dùng chung

- [x] 2.1 Tạo `src/components/blocks/feed/PostImagePicker/index.tsx`: nút chọn ảnh + lưới thumbnail, xoá từng ảnh, trạng thái đang tải/lỗi trên từng ảnh
- [x] 2.2 Validate client: ≤4 ảnh, ≤10MB/ảnh, mime `image/png|jpeg|webp|gif` → thông báo lý do, KHÔNG gọi mạng
- [x] 2.3 Upload ngay khi chọn qua `uploadCommunityMedia`; báo ra ngoài `media: MediaInput[]` (storageKey = `secureUrl`) và `isUploading`
- [x] 2.4 Upload lỗi → gỡ ảnh khỏi lưới + toast, giữ nguyên các ảnh khác

## 3. Composer cộng đồng

- [x] 3.1 `CommunityComposerForm`: gắn `PostImagePicker`, gửi `media` trong `createPost`
- [x] 3.2 Chặn submit khi còn ảnh đang tải (`isUploading`)
- [x] 3.3 Reset danh sách ảnh sau khi đăng thành công

## 4. Hiển thị ảnh

- [x] 4.1 Tạo `src/components/blocks/feed/PostMediaGrid/index.tsx`: 1 ảnh → khối rộng; 2–4 ảnh → lưới 2 cột; `object-cover`, bo góc, `loading="lazy"`, `alt` từ i18n; không có ảnh → không render gì
- [x] 4.2 `useQueryCommunityFeedSwr`: map `media` vào `CommunityPost`; `CommunityFeed` render `PostMediaGrid` dưới phần chữ
- [x] 4.3 `useQueryPostDetailSwr` + `CommunityPostDetail`: tương tự cho trang chi tiết
- [x] 4.4 `useQuerySubjectFeedSwr` + hàng post của `SubjectCommunity`: tương tự cho tab Thảo luận

## 5. Tab Thảo luận: đăng bài

- [x] 5.1 Tạo `useMutateCreateSubjectPostSwr`: gọi `createPost({ postType: "DISCUSSION", subjectId, title, content, media })` rồi `mutate(subjectFeedKey(...))`
- [x] 5.2 Thêm composer vào `SubjectCommunity` (tiêu đề + nội dung + `PostImagePicker`), chỉ bật khi `subject.uuid` đã resolve
- [x] 5.3 Lỗi tạo bài → giữ nguyên draft + toast, không đụng feed

## 6. Tab Thảo luận: bình luận thật

- [x] 6.1 Tạo `useMutateCreateSubjectPostCommentSwr`: gate `requireAuth`, optimistic patch vào `subjectPostCommentsKey(...)`, gọi `addComment`, rollback bằng snapshot khi lỗi, revalidate khi thành công
- [x] 6.2 Thay `onSubmit` giả trong `SubjectCommunity` (đang `return true`) bằng hook mới; sửa luôn `currentUser` thiếu trong deps của `useCallback`
- [x] 6.3 Xoá ghi chú "no GraphQL mutation in this scope" đã lỗi thời trong file

## 7. i18n

- [x] 7.1 Khoá mới `communityHub.composer.{images,addImage,imageLimit,imageTooLarge,imageInvalid,imageUploadFailed,imageAlt,removeImage}` (vi + en)
- [x] 7.2 Khoá mới `subjects.community.{compose,titleField,bodyField,submit,createFailed}` (vi + en)

## 8. Verify

- [x] 8.1 `npx tsc --noEmit` sạch
- [x] 8.2 `npm run lint` sạch (vùng đã sửa)
- [x] 8.3 Test đơn vị cho `PostImagePicker` (giới hạn 4 ảnh, chặn quá cỡ/sai định dạng) và cho hook comment subject (rollback khi lỗi)
- [ ] 8.4 `npm run build` xanh — KHÔNG chạy được trên box này (node_modules cài từ máy khác, thiếu native binding @tailwindcss/oxide…); cần chạy ở máy local
