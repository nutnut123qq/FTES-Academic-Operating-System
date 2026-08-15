# Tasks

## 1. Hàm thuần
- [x] 1.1 `dicebearAvatarUrl(seed)` — trim, seed rỗng → `null` (không dùng "anonymous" như StarCI)
- [x] 1.2 `resolveAvatarSrc(avatar, seed)` — ảnh thật thắng, rồi mặt sinh, rồi `null`

## 2. Component
- [x] 2.1 `UserAvatar` nối lại chuỗi: ảnh thật → DiceBear(`seed ?? username`) → chữ cái đầu → glyph
- [x] 2.2 Prop `seed` bỏ `@deprecated`, mô tả lại là seed tất định
- [x] 2.3 Docblock: chốt của chủ dự án + cảnh báo bẫy cũ nguyên văn + chỉ dẫn debug (soi mapper trước)

## 3. Cấu hình
- [x] 3.1 `next.config.ts`: `api.dicebear.com` vào `images.remotePatterns` (kèm comment vì sao hôm nay chưa dùng)

## 4. Test
- [x] 4.1 `avatar.test.ts` — 7 test (tất định, trim, seed khác, không seed → null, encode dấu, ảnh thật thắng)
- [x] 4.2 `npx tsc --noEmit` sạch
- [ ] 4.3 Xem thật trên trình duyệt — CHƯA làm (cấm dựng dev server trong phiên này)

## 5. Ghi nhận, KHÔNG sửa (ngoài phạm vi)
- [ ] 5.1 `useQuerySubjectPostCommentsSwr.toReply` thiếu `authorAvatar` → bình luận môn học hiện mặt sinh dù có ảnh thật
- [ ] 5.2 Cùng mapper: `authorUsername` hạ cấp về uuid → `/u/<uuid>` link chết
- [ ] 5.3 Comment sai trong `SubjectFeAlbum/index.tsx:193-195`
- [ ] 5.4 `GroupIdentityFields` truyền seed = tên nhóm → nhóm cũng có mặt sinh
