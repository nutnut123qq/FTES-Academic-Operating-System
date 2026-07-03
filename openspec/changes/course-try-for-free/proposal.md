# course-try-for-free — Học thử: document reader + video preview + popup mua gói

## Why
Backend change `course-freemium-preview` (FTES-AOS-Backend) mở access level PREVIEW:
non-purchaser đọc được teaser bài đọc (server đã cắt) và xem đoạn đầu video (mặc định 15p,
mentor chỉnh). FE cần reader cho lesson type DOCUMENT (hiện `course-lesson` chỉ có video
placeholder + docs list) và UX paywall đúng "moment of need" như StarCi: fade phần đuôi
teaser + paywall inline, video chạm mốc → popup mua gói.

## What Changes
- **Document reader**: tab đọc bài render markdown từ `GET /api/v1/lessons/{id}/content`
  (react-markdown + GFM), heading slugify → TOC "Trên trang này" ở rail phải (desktop).
- **Locked document (PREVIEW)**: render teaser + gradient fade đáy (h-72,
  `from-transparent via-surface/70 to-surface`, `pointer-events-none`) + `select-none` +
  **PaywallCard** inline dưới fade (lock icon + tên gói rẻ nhất + giá + CTA "Mua gói").
- **Video preview (PREVIEW)**: player nhận `{mode: "PREVIEW", previewSeconds}` từ stream API;
  chip "Xem thử mm:ss"; chạm mốc → pause + mở **PackageGateModal**; gọi
  `POST /api/v1/lessons/{id}/preview-limit` (1 lần/lesson/phiên).
- **PackageGateModal** (value-first, dùng chung document + video): "Bạn sẽ mở khoá…" +
  danh sách gói (`GET /api/v1/courses/{id}/packages`) + CTA mua (flow của `course-enroll`)
  + "Để sau" (dismiss); dismiss → video đứng ở mốc, document giữ teaser.
- **Outline/tab lock**: lesson `accessLevel === "NONE"` → icon khoá (lock THAY icon type),
  click → PackageGateModal; `PREVIEW` → mở bình thường (badge "Học thử").
- i18n `courseSystem.preview.*` (vi/en).

## Capabilities
### New Capabilities
- `course-try-for-free`: document reader + teaser paywall + video preview limit + package gate modal.
### Modified Capabilities
- `course-lesson`: lesson view thêm nhánh DOCUMENT + trạng thái PREVIEW/NONE.

## Impact
FE only; tiêu thụ API của BE change `course-freemium-preview` (mock SWR khi BE chưa sẵn).
Route lesson hiện có; thêm components `DocumentReader`, `PaywallCard`, `PackageGateModal`,
hook `useLessonContentSwr`, `usePreviewGate`. Build stays green.
