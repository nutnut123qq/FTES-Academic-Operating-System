# fe-image-text-pages — Nạp ảnh đề để số hoá + trang chữ hiển thị như tờ giấy có dấu FTES

## Why

BE nay số hoá được ảnh trang đề thành chữ (`subject-fe-image-exams`), nhưng không có nút nào gọi
tới. Và trang chữ đang render trên nền theo theme — cạnh những trang scan trong cùng một album, hai
loại trang trông như ở hai thế giới khác nhau.

## What Changes

- **Nút "Nạp ảnh đề → số hoá thành chữ"** trong panel quản lý album, TÁCH BẠCH với nút "thêm ảnh".
  Hai nút làm hai việc ngược nhau với cùng một file: một cái giữ scan làm ảnh, cái kia vứt scan và
  giữ chữ. Một công tắc gộp chung sẽ để người dùng huỷ mất bản scan bằng một cú bấm nhầm.
- **Trang chữ = tờ giấy trắng có dấu FTES**: nền trắng, watermark "FTES" lặp chéo bằng SVG data-URI.
- **Ghim theme sáng cho tờ giấy** (`data-theme="light"`): `MarkdownContent` tự gắn `text-foreground`,
  nên ở dark mode trang đề sẽ là **chữ trắng trên giấy trắng**.

## Capabilities

### Modified Capabilities
- `subject-practice`: nạp ảnh để số hoá, và trang chữ hiển thị như một tờ đề in.

## Impact
- Cần BE nhánh `feat/fe-image-text-exams` + ai-service `feat/exam-image-extract`.
- **Watermark trên trang chữ là LỚP PHỦ CSS — branding, không phải bảo vệ.** Gỡ được bằng devtools
  và chữ vẫn copy sạch. Đốt dấu vào pixel thì phải render trang thành ảnh, tức vứt bỏ đúng thứ
  (tìm kiếm được, copy được, bot đọc được) mà cả tính năng này sinh ra để có.
