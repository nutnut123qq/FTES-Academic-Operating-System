# subject-workspace-cover-banner — Ảnh bìa môn hiển thị dạng banner trên header workspace

## Why
Admin đặt "Ảnh bìa môn" (CONTRACT A `imageUrl`, vd Cloudinary) kỳ vọng hiện như **ảnh bìa**
trên header workspace `/subjects/{code}`. Nhưng FE chỉ render nó thành **avatar 44×44px** cạnh
tên môn — người dùng không thấy như một cái bìa ("trang workspace không có ảnh"). Data + ảnh đều
OK (cả `GET /subjects/{code}` lẫn `/workspace` đều trả `imageUrl`; ảnh Cloudinary 200), chỉ là
kích thước render quá nhỏ so với ý nghĩa "ảnh bìa".

## What Changes
- `SubjectWorkspaceShell` header: khi có `subject.imageUrl`, render một **banner full-width**
  (`h-32 sm:h-44`, `object-cover`) ở đầu content region — chính là ảnh bìa. Hàng danh tính (chip
  chữ viết tắt mã môn + tên + tín chỉ/độ khó + thanh tiến độ) nằm ngay dưới banner.
- Ảnh vỡ (`onError`) → bỏ banner, hàng danh tính vẫn hiển thị chip chữ viết tắt (fallback cũ giữ nguyên).
- Không còn dùng ảnh bìa làm avatar 44px; chip danh tính giờ luôn là chữ viết tắt mã môn.

## Capabilities
### Modified Capabilities
- `subject-workspace`: header workspace hiển thị ảnh bìa môn dạng banner (thay vì avatar nhỏ).

## Impact
FE-only, không đổi API/data (imageUrl đã có sẵn hai đường đọc). Sửa 1 file
`SubjectWorkspaceShell/index.tsx`. tsc sạch.
