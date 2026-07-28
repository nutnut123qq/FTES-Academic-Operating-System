# gopy-website-wave2 — nhóm góp ý UI còn lại (8 hạng mục FE + ảnh BE)

## Why
Tiếp `gopy-website-confirmed-bugs-wave1` (4 lỗi chặn người học). Wave 2 xử nhóm còn lại của file
"Góp ý website" (2026-07-26) — phần không phải lỗi chặn nhưng đúng và rẻ để sửa.

## What Changes
- **Nút AI nổi** (`ContentAiFab`): icon lấp lánh → linh vật cáo (`/mascot/plain/greeting.webp`, asset
  đã có sẵn); nút đổi nền sáng + ring accent để cáo tông hồng-cam không chìm vào nền hồng đặc.
  Icon 20px cạnh tiêu đề popover GIỮ sparkle (cỡ đó ảnh thành vệt màu).
- **Khung video** (`LessonVideoBlock`, `LessonHlsPlayer`): bỏ lớp `Card`/`CardContent` bọc player —
  player đã tự có khung đen `rounded-2xl`, hai khung lồng nhau gây "chồng chất". Giữ `relative` cho
  Chip học-thử + `PreviewLockOverlay` neo đúng chỗ.
- **`LessonReader`**: header thêm nút "Bài trước" (chỉ khi có `prevId`, đi bằng `router.push` của
  next-intl — KHÔNG `<a>` thuần); tường phí legacy liệt kê TÊN các gói mở được bài, rẻ-trước, thay
  chuỗi "Nội dung premium" cứng.
- **Chia sẻ** (`PostEngagementBar`): thêm Facebook · X · Zalo dạng web-intent (không SDK). Zalo dùng
  `sp.zalo.me/plugins/share` — `zalo.me/share/link` trả 302 về trang không tồn tại (đo 2026-07-28).
  Chỉ ghi nhận lượt share khi `window.open` mở được thật (popup bị chặn thì không tính).
- **`PaymentModal`**: vòng xoay → đếm ngược 5 phút. Hết giờ VẪN poll đơn (5 phút là số của FE, BE
  chưa trả `expiresAt`) → tiền vào muộn vẫn lật sang success, tránh người học trả hai lần.
- **`CourseHoverPreview`**: thêm CTA "Thêm vào giỏ" cạnh nút đăng ký (không nhồi nút vào card nhỏ).
- **`Footer`**: khối pháp nhân (tên · MST · ngày thành lập · ngành nghề) + cụm link pháp lý.
- **i18n**: 14 key mới (vi+en) + sửa `tagline` sai thành "Khơi mở tiềm năng - Dẫn đầu công nghệ".
- **BE (repo FTES-AOS-Backend)**: URL ảnh delivery kèm `q_auto,f_auto` (Cloudinary tự trả webp/avif)
  + vá `parseDeliveryUrl` sót ca URL không mang version.

## Out of scope
- Địa chỉ · email · điện thoại công ty: CHƯA render vì chưa có dữ liệu thật (không bịa lên footer).
- Ảnh đã lưu trong DB không hưởng `f_auto` — cần backfill hoặc áp ở tầng render, chờ chốt.
- Icon 3D roadmap, slider mentor, ảnh workspace môn, màu phân biệt gói, flashcard do instructor
  soạn: cần chốt thiết kế/contract, không nằm trong wave này.
