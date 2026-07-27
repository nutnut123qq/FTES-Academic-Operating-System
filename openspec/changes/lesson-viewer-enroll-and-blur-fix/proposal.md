# lesson-viewer-enroll-and-blur-fix — Bài VIDEO khoá hiện lại thẻ "Đăng ký khóa" + che mờ preview DOCUMENT ngắn không lòi lên header

## Why
Hai lỗi regression từ đợt chỉnh preview-gating (`preview-blur-document-trial-only`):

1. **Bài VIDEO khoá KHÔNG còn hiện thẻ "Đăng ký khóa".** Thầy: *"Mấy cái video sao lại
   không hiển thị cái enroll khóa mà hiển thị gì vậy?"* — trong `LessonReader`, cờ
   `showLegacyPaywall = showDocumentPreviewTeaser || (isLocked && !isPreview)`. Với một bài
   VIDEO **học thử** (`isLocked` true, `isPreview` true): `showDocumentPreviewTeaser` là false
   (chỉ DOCUMENT) và `isLocked && !isPreview` là false → `showLegacyPaywall` = FALSE → khối
   paywall enroll không bao giờ render. Người học xem video preview xong không có đường đăng ký.

2. **Preview DOCUMENT ngắn: lớp che fade lòi LÊN header.** Thầy: *"Đối với cái document mà
   ngắn thì cái phần che nó bị lòi lên trên rất xấu nhé"* — lớp fade
   `absolute inset-x-0 bottom-0 h-72` (288px cố định) neo `bottom-0`; khi thân bài ngắn hơn
   288px, gradient tràn LÊN trên đỉnh container, phủ mờ lên tiêu đề/mô tả bài.

## What Changes
- **Thẻ enroll cho MỌI bài non-DOCUMENT khoá (video/mixed), dù preview hay khoá-cứng**: đổi
  dẫn xuất thành `showLegacyPaywall = isLocked && (contentType !== "DOCUMENT" || !isPreview)`.
  Một bài video/mixed bị khoá (preview HOẶC khoá-cứng) luôn hiện thẻ "Đăng ký khóa"
  (`LockSimpleIcon` + `reader.previewTitle`/`reader.lockedTitle` + nút gọi `setGateOpen(true)`).
  KHÔNG đụng `showDocumentPreviewTeaser` (vẫn DOCUMENT-only, nên video không dính blur article).
- **Lớp fade preview không bao giờ vượt khỏi hộp bài**: đổi `absolute inset-x-0 bottom-0 h-72`
  → `absolute inset-0`, gradient trong suốt nửa TRÊN
  (`from-transparent from-50% via-surface/60 to-surface`) để chữ đọc được. Vì overlay giờ đúng
  bằng kích thước container bài, nó KHÔNG THỂ tràn lên trên header dù thân bài ngắn tới đâu. Áp
  ở CẢ `DocumentReader` LẪN `LessonReader` (mọi chỗ có đúng div fade này). Giữ nguyên điều kiện
  gate (`showDocumentPreviewTeaser && hasTeaserBody`).

## Capabilities
### New Capabilities
- `lesson-viewer-enroll-and-blur-fix`: bài VIDEO khoá hiện lại thẻ đăng ký; lớp che preview
  DOCUMENT được chứa trọn trong hộp bài, không lòi lên header.

## Impact
FE-only, nhánh `fix/lesson-viewer-enroll-and-blur`. Sửa: `LessonReader/index.tsx`,
`DocumentReader/index.tsx`. Không đụng player preview (chip/clamp), không đụng
`showDocumentPreviewTeaser` (blur article vẫn DOCUMENT-only). `npx tsc --noEmit` sạch (exit 0);
`npm run build` (webpack) xanh; test đơn vị LessonReader/DocumentReader xanh (cập nhật kỳ vọng
của test preview-gating để phản ánh: bài VIDEO khoá GIỜ có thẻ enroll).
