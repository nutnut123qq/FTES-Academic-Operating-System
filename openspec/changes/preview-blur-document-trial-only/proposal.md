# preview-blur-document-trial-only — Che mờ teaser chỉ cho DOCUMENT học thử + badge outline + ảnh khoá trong modal + nút phóng to góc phải dưới

## Why
Đợt `course-try-for-free` để phần **che mờ + teaser paywall** (fade gradient đáy +
`select-none` + footer "Bạn đang xem thử / Đăng ký gói") render theo cờ `isLocked` chung.
Hậu quả: một bài **VIDEO** học thử (đã có riêng chip "Xem thử mm:ss" + lock overlay của
player) vẫn bị dựng thêm `#lesson-article` mờ + teaser dưới video — thừa, sai ngữ cảnh.
Thầy chốt luật: *"Cái phần che mờ nếu type là video thì k hiện, bài không được free cũng
k hiện, chỉ hiện ở loại document có mở cho học thử thôi"*. Kèm 3 tinh chỉnh cùng chủ đề
preview/premium: badge Học thử/Premium trên hàng bài của outline, ảnh khoá trong modal
"hết preview", và dời nút phóng to video xuống góc phải dưới cho cả 2 player.

## What Changes
- **Cổng che mờ theo DOCUMENT + học thử**: dẫn xuất một boolean duy nhất
  `showDocumentPreviewTeaser = isTrialPreview && contentType === "DOCUMENT"` (với
  `isTrialPreview = isLocked && accessLevel === "PREVIEW"`) và gate cả 3 thứ (fade gradient,
  footer teaser "xem thử", `select-none`) sau nó — ở cả `LessonReader` (nhánh legacy
  video/mixed) lẫn `DocumentReader`. Bài VIDEO không bao giờ mờ article; bài khoá-cứng
  (accessLevel NONE) giữ paywall cứng riêng (`lockedTitle`), không dùng blur teaser.
- **Badge access ở outline** (đã có sẵn, ghi thành spec): hàng bài trong content-map hiện
  chip "Học thử" (accent) khi `accessLevel === "PREVIEW"`, chip "Premium" + khoá khi
  `isLocked` (NONE), còn lại hiện thời lượng đọc; người đã sở hữu (full access) không thấy
  badge nào.
- **Ảnh khoá vào PackageGateModal**: modal (gồm popup "hết preview" của video) nhận
  `courseCoverUrl` và render ảnh bìa khoá (`CoverImage` 16:9, alt = tên khoá) cạnh tiêu đề;
  thiếu ảnh → về layout lock-icon cũ. Luồng ảnh: `course.imageHeader` → `LearnLessonView`/
  `LearnCourseHeader.coverUrl` → LessonReader/DocumentReader/LessonVideoBlock/ContentMap.
- **Nút phóng to video → góc phải dưới**: `LessonFullscreenButton` (dùng chung YouTube +
  self-hosted) đổi `left-3 top-3` → `bottom-3 right-3` (top-right đã là chip đếm ngược).

## Capabilities
### New Capabilities
- `preview-blur-document-trial-only`: giới hạn blur teaser theo DOCUMENT-học-thử + badge
  outline + ảnh bìa trong modal khoá + vị trí nút phóng to.

## Impact
FE-only, cùng nhánh `fix/preview-blur-document-only`. Sửa: `LessonReader`, `DocumentReader`,
`LessonVideoBlock`, `LessonFullscreenButton`, `PackageGateModal`, `ContentMap`, hook
`useQueryLearnLessonSwr` (thêm field `courseCoverUrl`). Tái dùng block `CoverImage` +
i18n có sẵn (`learn.content.previewBadge` / `learn.content.premium`), không đẻ key trùng.
tsc + webpack build xanh; thêm test chứng minh VIDEO-học-thử không mờ, khoá-cứng vẫn có
paywall. Không đụng hành vi player preview (chip/clamp) hay trải nghiệm đọc đã sở hữu.
