# learn-preview-player-gate — Gate xem thử video YouTube: đúng previewSeconds, tự bật modal, overlay khoá

## Why

Bug thật user báo trên UI: bài "học thử" (PREVIEW) dạng video YouTube **cho xem HẾT video**,
và trải nghiệm try-for-free chưa đúng kỳ vọng "xem 1 ít rồi bật modal để người dùng charge".
Điều tra code (đã xác minh):

1. **PREVIEW không có player**: BE giấu `videoRef` khi locked (PREVIEW/NONE) →
   `useQueryLearnLessonSwr` tính `hasVideo = videoStatus === "READY" && isVideoRef`
   (useQueryLearnLessonSwr.ts:201) = false, và `LessonVideoBlock` `if (!videoRef) return null`
   (LessonVideoBlock.tsx:68) → bài PREVIEW YouTube không render gì để xem thử.
2. **Gate one-shot, bypass được**: `LessonYouTubePlayer` dùng `gateFiredRef` — lần đầu chạm
   mốc thì pause + mở modal, nhưng sau đó `fireGate` thành no-op (LessonYouTubePlayer.tsx:117-127).
   User đóng PackageGateModal, bấm play lại trên iframe → interval gọi `fireGate` (không pause
   nữa) → **video chạy tới hết**. Nhánh clamp seek trong interval (:176-178) là dead code
   (không bao giờ tới được sau `fireGate(); return`).
3. **Không có overlay khoá**: đóng modal xong player vẫn tương tác bình thường — không có lớp
   "Hết phần xem thử" che video + nút mở lại modal.
4. Các bài "học thử" kiểu legacy được cấp FULL (free/`free_lesson_ids`) nhận ref đầy đủ +
   `previewSeconds=0` → phát trọn — đúng chủ đích với FULL, nhưng khi BE chuyển các bài này
   sang PREVIEW thì FE phải gate chắc.

BE change đối ứng `freemium-youtube-preview-gate` (FTES-AOS-Backend) mở rộng
`GET /lessons/{id}/stream`: provider `YOUTUBE` → trả `videoRef` + `previewSeconds` +
`enforceClientGate=true` (PREVIEW), `url=null`. FE change này tiêu thụ contract đó và vá gate.

## What Changes

- **Mount player cho PREVIEW**: `hasVideo`/`LessonVideoBlock` không phụ thuộc `videoRef`
  catalog nữa — bài VIDEO `accessLevel === "PREVIEW"` lấy ref từ stream response
  (`stream.videoRef`), catalog ref vẫn dùng cho free/FULL như cũ.
- **Gate cứng trong `LessonYouTubePlayer`** (YouTube IFrame API, đã có sẵn — vá lỗ hổng):
  - Chạm `previewSeconds` → pause + **TỰ ĐỘNG mở PackageGateModal** (giữ hành vi hiện có).
  - Gate là **trạng thái bền** (`gated`), không phải sự kiện một lần: sau khi gated, MỌI lần
    player quay lại PLAYING → pause + seekTo(limit) ngay lập tức; fix dead-code clamp.
  - Seek quá `previewSeconds` (kể cả trước khi gate) → kéo về mốc.
- **Overlay khoá sau khi đóng modal**: khi `gated` và modal đóng → overlay che player (mờ
  video, chặn pointer tới iframe), thông điệp "Hết phần xem thử" + CTA mở lại PackageGateModal.
  Copy/CTA theo luật premium-unlock = **enroll khoá** (không "VIP").
- **Report preview-limit hợp nhất**: đường YouTube dùng chung `usePreviewGate` (đếm ngược,
  guard 1 lần/phiên, `POST /lessons/{id}/preview-limit`) như đường HLS — hiện YouTube tự quản
  và KHÔNG report.
- **Áp mọi chỗ render video lesson**: `LessonVideoBlock` là điểm mount duy nhất trong learn
  shell (LessonReader/index.tsx:291) — xác minh không còn đường render YouTube lesson nào khác
  (`VideoRenderer/Youtube` chỉ dùng ở AdminMpegDashTest); guard này ghi thành invariant trong
  spec để chỗ render video lesson tương lai phải đi qua block đã gate.
- **Document lesson KHÔNG đụng** — teaser đã cắt server-side (DocumentReader giữ nguyên).
- **Sau khi mua** (`onPurchased` → mutate) → stream `mode=FULL` → overlay gỡ, xem hết.

## Capabilities

### New Capabilities
- `learn-preview-player-gate`: gate client-side cho video lesson PREVIEW (YouTube + HLS UX),
  overlay khoá, auto-modal, hợp nhất preview-limit report.

## Impact

- Code: `LessonVideoBlock.tsx`, `LessonYouTubePlayer.tsx`, `usePreviewGate.ts`,
  `useLessonStreamSwr.ts` + `modules/api/rest/course/types.ts` (field stream mới),
  `useQueryLearnLessonSwr.ts` (hasVideo), i18n `courseSystem.preview.*` (vi/en — sửa luôn typo
  "thờ igian" ở `vi.json` key `courseSystem.preview.gate.titleVideo`).
- Phụ thuộc BE: change `freemium-youtube-preview-gate` (FTES-AOS-Backend). Khi BE chưa deploy:
  stream response chưa có `videoRef` → PREVIEW YouTube vẫn không render player (trạng thái
  hiện tại, không tệ hơn); gate cứng + overlay vẫn có hiệu lực cho mọi đường có ref.
- Không đổi: PackageGateModal, DocumentReader, ContentMap (badge "Học thử" giữ nguyên).
