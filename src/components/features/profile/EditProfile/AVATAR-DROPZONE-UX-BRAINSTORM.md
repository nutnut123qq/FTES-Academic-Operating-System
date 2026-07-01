# UX Brainstorm — dropzone trong modal "Đổi ảnh đại diện"

> Output `/ux-brainstorm`. KHÔNG code. Phạm vi: block `AvatarDropzone` (dùng trong `AvatarUploadModal`).

## Vấn đề
Dropzone hiện = **avatar (logo) bên trái + text bên phải** (layout ngang). Thầy muốn dropzone CHUẨN: **bỏ
avatar/logo**, dùng **icon file** ở giữa, **viền dash bao quanh**, và **dí file vào → trạng thái drag-hover** rõ.
("cứ cái này render 3 cái" = vùng dropzone = 3 thứ xếp DỌC căn giữa: icon · label · hint.)

## Hướng
- **A — Dropzone chuẩn, centered (CHỐT).** Vùng dashed full-width, **căn giữa cột 3 phần**:
  (1) **icon file/ảnh** (phosphor `ImageIcon` hoặc `UploadSimpleIcon`, size lớn ~size-8, `text-muted`),
  (2) **label** ("Kéo thả ảnh vào đây, hoặc bấm để chọn"),
  (3) **hint** ("PNG, JPG, WEBP, GIF · tối đa 5 MB").
  **Drag-hover** (`isDragActive`): viền **solid accent** + `bg-accent/10` + icon/label đổi nhấn accent
  ("Thả ảnh vào đây"). **Bỏ avatar** (avatar đã hiện ở trang ngoài). Cao thoáng (py lớn) cho dễ thả.
- **B — A + live preview.** Sau khi thả → hiện preview ảnh vừa chọn NGAY trong dropzone + nút "Đổi/Xoá"
  trước khi đóng modal. Richer, nhưng modal hiện đóng-ngay-khi-chọn nên chưa cần; cân nhắc sau.
- **C — Giữ avatar nhỏ + dropzone** → loại (thầy yêu cầu bỏ logo).

## CHỐT: A
- Block `AvatarDropzone` redesign: **bỏ prop/hiển thị avatar** (`avatar`/`displayName`/`seed` không cần nữa) →
  vùng dashed centered (icon + label + hint), drag-active nhấn accent. Vì block giờ **không liên quan avatar**
  nữa → **đổi tên `AvatarDropzone` → `ImageDropzone`** (generic, tái dùng cho mọi upload ảnh); props =
  `{ onFile, label, hint?, icon? }`. Modal + EditProfile cập nhật theo (modal bỏ truyền avatar/seed).
- Icon mặc định = phosphor `ImageIcon` (đại diện "ảnh"); cho override qua prop `icon`.
- react-dropzone (đã có) giữ: accept ảnh, maxSize 5MB, multiple=false, onDrop→onFile.
- A11y: vùng có `aria-label`; icon `aria-hidden`; drag state đổi cả màu LẪN chữ (không chỉ màu).

## Cắt / Thêm
- **Cắt:** avatar/logo + layout ngang trong dropzone.
- **Thêm:** icon file ở giữa + drag-hover state rõ (viền solid accent + tint + đổi chữ).
- **Đổi tên:** `AvatarDropzone` → `ImageDropzone` (block generic, hết gắn "avatar").
