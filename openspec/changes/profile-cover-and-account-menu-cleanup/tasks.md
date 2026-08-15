# Tasks

## 1. Bỏ ảnh bìa hồ sơ
- [x] 1.1 `ProfileShell`: gỡ khối bìa + placeholder gradient, avatar đứng đầu sidebar
- [x] 1.2 `ProfileShell`: skeleton đổi theo (bỏ khối bìa, chỉ còn `Skeleton.Avatar`)
- [x] 1.3 `ProfilePublic` (`/u/[username]`): gỡ `<img src={profile.coverUrl}>`
- [x] 1.4 Gỡ `coverUrl` khỏi `Profile` + `toShellProfile` và `PublicProfile` + `toPublicProfile`

## 2. Thứ tự dòng meta trong sidebar
- [x] 2.1 Campus (MapPin) lên trên, "tham gia từ" (Calendar) xuống dưới; cả hai vẫn có điều kiện

## 3. Dropdown tài khoản
- [x] 3.1 Gỡ hàng "Khóa học của tôi" + import `GraduationCapIcon`
- [x] 3.2 Section chỉ render khi `isLecturer` (không để lại section rỗng)
- [x] 3.3 Docblock ghi rõ vì sao bỏ và vì sao `/courses/me` không mồ côi

## 4. Test / verify
- [x] 4.1 `e2e/lecturer-teaching-nav-link.spec.ts` đổi mốc neo sang "Bảng điều khiển"
- [x] 4.2 `npx tsc --noEmit` sạch ở các file đụng tới
- [ ] 4.3 Chạy lại e2e Playwright trên apitest — CHƯA chạy (xem "Verify" trong báo cáo)
