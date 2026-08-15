# profile-cover-and-account-menu-cleanup — bỏ ảnh bìa hồ sơ, đảo campus/joined, bỏ "Khóa học của tôi" khỏi menu tài khoản

> **Change hồi tố.** Code đã ship trong đợt duyệt giao diện 2026-08-15; tài liệu này viết SAU
> để `openspec/` không nợ change cho một thay đổi đã nằm trong working tree. Nội dung dưới đây
> đọc từ diff thật, không phải kế hoạch.

## Why

Ba chỗ trong khối hồ sơ / điều hướng cá nhân bị chủ dự án bắt lỗi khi duyệt giao diện:

1. **Ảnh bìa hồ sơ không có nội dung để mang.** `coverUrl` chưa bao giờ có đường tải lên trong app;
   thực tế 100% hồ sơ trả `null`, nên cả `/profile` lẫn `/u/[username]` luôn hiển thị đúng một dải
   gradient placeholder cao 8rem đẩy avatar xuống. Một khối chiếm chỗ nhưng không bao giờ chứa gì.
2. **Sidebar hồ sơ xếp campus DƯỚI "tham gia từ".** Campus (FPT HCM/Hà Nội…) là danh tính, ngày
   tham gia là siêu dữ liệu — đọc ngược thứ tự quan trọng.
3. **"Khóa học của tôi" trong dropdown tài khoản là CỬA THỨ HAI của dòng ngay trên nó.** Hàng đầu
   dropdown là "Bảng điều khiển" → tab Khoá học của dashboard render TOÀN BỘ enrollment qua đúng
   adapter `useQueryMyCoursesSwr` (`GET /courses/me/enrollments`), kèm tiến độ và nút học tiếp.
   Hàng "Khóa học của tôi" chỉ dẫn tới `/courses/me` — cùng dữ liệu, ít ngữ cảnh hơn.

## What Changes

- **GỠ ảnh bìa** khỏi `ProfileShell` (hồ sơ của mình) và `ProfilePublic` (`/u/[username]`): bỏ luôn
  cả nhánh placeholder gradient, avatar không còn đè mép dưới bìa mà đứng đầu sidebar. Skeleton
  đổi theo (không còn khối bìa 8rem).
- **GỠ `coverUrl`** khỏi 2 view-model đọc hồ sơ (`Profile` trong `useQueryProfileSwr`,
  `PublicProfile` trong `useQueryPublicProfileSwr`) — field không còn ai đọc thì không giữ trong
  contract FE. **Không đụng BE**: `SelfProfile.coverUrl` vẫn tồn tại phía API.
- **Đảo thứ tự 2 dòng meta** trong sidebar: campus (MapPin) lên TRÊN, "tham gia từ" (Calendar)
  xuống dưới. Cả hai vẫn là điều kiện — thiếu dữ liệu thì không render dòng.
- **GỠ hàng "Khóa học của tôi"** khỏi `AccountMenuAuthed`. Section "học tập" nay chỉ còn
  "Khoá tôi dạy" và CẢ SECTION biến mất với người không phải giảng viên (section rỗng chỉ đẻ thêm
  một đường kẻ). `/courses/me` KHÔNG bị mồ côi: home landing ("Xem tất cả") và CTA
  `LESSON_COMPLETE` của quest board vẫn trỏ vào.
- **Sửa e2e `lecturer-teaching-nav-link.spec.ts`**: mốc neo "menu đã resolve" đổi từ hàng
  "Khóa học của tôi" (không còn) sang "Bảng điều khiển".

## Impact

- Affected specs: `profile-identity-hero` (REMOVED cover + ADDED thứ tự meta),
  `profile-visual-identity` (MODIFIED), `account-menu-gamification` (ADDED)
- Affected code: `ProfileShell/index.tsx`, `ProfilePublic/index.tsx`, `useQueryProfileSwr.ts`,
  `useQueryPublicProfileSwr.ts`, `AccountMenuAuthed/index.tsx`, `e2e/lecturer-teaching-nav-link.spec.ts`
- Không đụng BE, không migration, không thêm chuỗi i18n (`profile.hero.coverAlt` thành khoá thừa,
  cố ý giữ lại trong messages để không đụng file dịch trong phạm vi này).
