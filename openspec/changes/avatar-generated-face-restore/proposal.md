# avatar-generated-face-restore — bật lại avatar mặc định sinh theo seed, kèm nguyên văn bài học của lần gỡ

> **Change hồi tố.** Code đã ship trong đợt 2 (2026-08-15); tài liệu viết SAU theo diff thật.

## Why

Mặt sinh theo seed (DiceBear) đã bị **gỡ có chủ ý** ở `31b11dd` (2026-08-11), vì nó che một lớp bug
thật: mặt sinh ra hiển thị cho MỌI user thiếu ảnh, nên một mapper đánh rơi `avatarUrl` trông y hệt
"user này không có ảnh". Đúng chuyện đó đã xảy ra —
`toCommunityPost` / `toPostDetail` / `toReply` / `toSubjectPost` đọc `displayName` + `username` rồi
vứt `avatarUrl` dù document GraphQL đã select sẵn, và bug nấp sau những gương mặt dễ thương suốt
nhiều tuần.

**Chủ dự án chốt bật lại.** Lý do gỡ vẫn đúng và không phải chuyện thẩm mỹ, nên change này bật lại
KÈM cảnh báo nguyên văn tình huống ngay tại chỗ, để lần sau không phải điều tra lại từ đầu.

## What Changes

- **`src/utils/avatar.ts`** — 2 hàm thuần:
  - `dicebearAvatarUrl(seed)` trả `https://api.dicebear.com/9.x/thumbs/svg?seed=<encoded>`; **trim
    seed, seed rỗng/whitespace → `null`, KHÔNG sinh URL**. Cố ý khác bản StarCI (bản đó luôn trả URL
    và biến seed rỗng thành `"anonymous"`): nếu sinh URL cho `""` thì mọi user không seed sẽ dùng
    CHUNG một gương mặt và đọc ra như cùng một người.
  - `resolveAvatarSrc(avatar, seed)` — **ảnh thật (đã trim) THẮNG**, không có thì mặt sinh theo seed,
    không có cả hai thì `null`.
  - Viết theo phong cách FTES (docblock `@param`/`@returns`, `null` thay vì chuỗi rỗng).
- **`components/reuseable/UserAvatar/index.tsx`** — nối lại chuỗi fallback: ảnh thật → mặt DiceBear
  seed `seed ?? username` → ô chữ cái đầu → glyph người. Prop `seed` bỏ `@deprecated`, mô tả lại là
  seed tất định. Chuỗi vẫn tự chạy tiếp khi ảnh **LỖI TẢI** (Radix chỉ mount `<img>` sau khi decode)
  nên DiceBear chết mạng cũng chỉ rơi về ô chữ cái. **Không cần sửa call site nào** — các nơi đang
  truyền `seed` (UserLink, GroupMembers, CourseDetail, WeeklyChallengeCard, BlogEngagement…) hoạt
  động lại ngay.
- **Docblock component** ghi rõ đây là chốt của chủ dự án, KÈM cảnh báo bẫy cũ nguyên văn tình huống
  và chỉ dẫn debug: **thấy mặt sinh ra thì đi soi mapper của surface đó TRƯỚC**, vì ảnh thật luôn
  thắng trong `resolveAvatarSrc` — mặt sinh ra nghĩa là url chưa bao giờ tới nơi.
- **`next.config.ts`** — thêm `{ protocol: "https", hostname: "api.dicebear.com" }` vào
  `images.remotePatterns`.
- **`src/utils/avatar.test.ts`** — 7 test: cùng seed ra cùng URL (kể cả có khoảng trắng thừa), seed
  khác ra URL khác, không seed → `null`, encode được tên có dấu/khoảng trắng, và ảnh thật thắng mặt sinh.

## Impact

- Affected specs: `user-avatar-fallback` (ADDED)
- Affected code: `src/utils/avatar.ts` (+ test), `components/reuseable/UserAvatar/index.tsx`,
  `next.config.ts`
- Không thêm chuỗi hiển thị → không đụng `messages/{en,vi}.json`. Không đụng BE.

## Hệ quả kèm theo (ghi để không bất ngờ — KHÔNG sửa trong change này)

1. **BẪY CŨ CÒN SỐNG Ở 1 ĐƯỜNG.**
   `components/features/subject/hooks/useQuerySubjectPostCommentsSwr.ts` (~dòng 50-57): mapper
   `toReply` map `author` / `authorUsername` / `authorStaffRole` nhưng **KHÔNG map `authorAvatar`**,
   trong khi `query-subject-community.ts` (COMMUNITY_SELECTION) ĐÃ select `avatarUrl` ở cả 3 tầng
   post/comment/reply, và consumer `PostCommentThread/index.tsx:235` truyền `comment.authorAvatar`
   xuống `UserLink`. Hệ quả sau change này: **bình luận trong feed MÔN HỌC của người CÓ ảnh thật sẽ
   hiện mặt DiceBear** — đúng lớp bug mà 31b11dd đã vá cho 3 đường feed kia. Vá đúng là thêm
   `authorAvatar: reply.author.avatarUrl ?? null` (1 dòng).
2. Cùng mapper đó (~dòng 53) còn hạ cấp `authorUsername` về `reply.author.id` khi thiếu username →
   `UserLink` dựng href `/u/<uuid>` chết (lớp "LINK CHẾT" mà 31b11dd đã dọn ở community/subject feed
   nhưng sót chỗ này).
3. `features/subject/SubjectFeAlbum/index.tsx:193-195` có comment khẳng định "avatar rơi về ô trung
   tính chứ không bịa mặt" — comment này **nay SAI** vì seed mặc định là username (ở đây là
   `current.uploadedBy`, một uuid) nên album sẽ sinh mặt. Là hệ quả trực tiếp của chốt bật lại toàn
   app, không phải lỗi; chủ file đó nên cập nhật comment.
4. `features/group/GroupIdentityFields/index.tsx:59` truyền `seed = tên nhóm` → **NHÓM** chưa có ảnh
   giờ cũng có mặt sinh theo tên (trước là ô chữ cái). Nếu chủ dự án chỉ muốn bật cho NGƯỜI, chỗ này
   phải bỏ seed.
5. `api.dicebear.com` trong `remotePatterns` hiện **CHƯA được dùng thật**: HeroUI Avatar render bằng
   `<img>` thuần của Radix, không qua next/image optimizer; 5 file dùng `next/image` trong repo đều là
   ảnh khoá học/giỏ hàng. Vẫn thêm (kèm comment) để sau này ai bọc avatar bằng `next/image` không ăn
   400 — muốn tối giản tuyệt đối thì xoá dòng đó được, hôm nay không ảnh hưởng gì.
