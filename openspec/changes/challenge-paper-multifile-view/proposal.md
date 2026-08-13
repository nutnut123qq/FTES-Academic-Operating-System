# challenge-paper-multifile-view — Học viên xem đề PE nhiều file

## Why

Backend nay cho một đề mang **nhiều file có thứ tự**, mỗi file kèm **vai trò** do server suy từ MIME:
ảnh/PDF = **xem tại chỗ**, zip/word/excel = **tải về** (BE change `challenge-paper-multifile`).
FE hiện chỉ đọc **đúng một** file (`paperUrl`/`paperMime`) qua `ChallengePaper` + `paperKind`, nên:

- Đề nhiều trang bị nén thành 1 ZIP ⇒ thí sinh phải **tải về + giải nén** mới đọc được đề.
- **Template lẫn trong cùng archive** với đề, không tách được cái nào để đọc, cái nào để điền.

## What Changes

- `ChallengeView` đọc thêm `paperFiles[]` (id/url/mime/filename/sizeBytes/role/sortOrder).
- Trang đề render **theo thứ tự tác giả đặt**: file **xem-được** (ảnh/PDF) hiện **inline** nối tiếp
  nhau; file **tải-về** gom xuống khu **"Tệp đính kèm"** với tên + dung lượng + nút tải.
- **Tương thích ngược tuyệt đối**: `paperFiles` rỗng/absent ⇒ giữ nguyên hành vi một-file hiện tại
  (`paperUrl`/`paperMime`) — bản deploy cũ không vỡ.
- Tái dùng `paperKind` cho từng file (ảnh/PDF/archive/không-xem-được) thay vì viết lại luật phân loại.

## Capabilities

### New Capabilities
- `challenge-paper-multifile-view`: hiển thị bộ đề nhiều file, tách phần đọc và phần tải.

## Impact
`modules/api/rest/challenges/types.ts` (+`ChallengePaperFileView`, `paperFiles`),
`ChallengeView/ChallengePaper.tsx` (+ component danh sách), `paperKind.ts` (dùng lại, không đổi luật),
i18n vi+en. Phụ thuộc BE change `challenge-paper-multifile`.
