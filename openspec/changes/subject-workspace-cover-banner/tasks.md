# Tasks — subject-workspace-cover-banner

## 1. Header banner
- [x] 1.1 `SubjectWorkspaceShell`: thêm banner full-width `h-32 sm:h-44 object-cover` khi có `imageUrl`
- [x] 1.2 Hàng danh tính (chip viết tắt + tên/meta/progress) chuyển xuống dưới banner, padding `p-6`
- [x] 1.3 `onError` → `setBrokenImageUrl` bỏ banner, fallback chip viết tắt (giữ luật "không hiện glyph vỡ")

## 2. Verify
- [x] 2.1 `tsc --noEmit` EXIT 0
- [x] 2.2 Xác minh live: cả `/subjects/CSD201` lẫn `/subjects/CSD201/workspace` trả `imageUrl`; ảnh Cloudinary HTTP 200
