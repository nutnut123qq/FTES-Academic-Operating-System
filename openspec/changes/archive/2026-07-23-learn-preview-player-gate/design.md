# Design — learn-preview-player-gate

## 1. Context (điều tra đã xác minh trong code)

- `LessonReader/index.tsx:290-302` — điểm mount DUY NHẤT của `LessonVideoBlock`
  (gate `lesson.hasVideo`). `VideoRenderer/Youtube` reusable chỉ dùng ở
  `AdminMpegDashTest` — không có đường render video lesson thứ hai.
- `useQueryLearnLessonSwr.ts:166-168, 201` — `ref = current?.videoRef` (từ curriculum);
  `hasVideo = videoStatus === "READY" && isVideoRef`. PREVIEW: BE trả `videoRef=null` →
  `hasVideo=false` → block không mount → **không có gì để xem thử**.
- `LessonVideoBlock.tsx:56-95` — gọi `useLessonStreamSwr(lessonId)` lấy
  `{mode, previewSeconds, cheapestPackage}`; `if (!videoRef) return null` (:68);
  chọn player YouTube (regex id) vs HLS (`video_*`); đã có chip đếm ngược + PackageGateModal.
- `LessonYouTubePlayer.tsx` — YouTube IFrame API đã wire: poll 1s, `fireGate()` pause + mở
  modal. **Lỗ hổng**: `gateFiredRef` làm `fireGate` no-op sau lần đầu (:117-127) → user đóng
  modal, play lại → interval gọi `fireGate` không-pause → xem tới hết. Clamp
  `current > limit → seekTo` trong interval (:176-178) là dead code (chỉ tới được khi
  `current < limit - 0.5` VÀ `current > limit` — mâu thuẫn).
- `LessonHlsPlayer.tsx:61-100` — dùng `usePreviewGate` (đếm ngược + hard-pause qua `isGated`
  effect + report limit 1 lần/phiên). Manifest server đã cắt nên HLS an toàn tầng dưới.
- `usePreviewGate.ts` — state `isGated` + `onTimeUpdate/onEnded` + `reportOnce`
  (`POST /lessons/{id}/preview-limit`, sessionStorage guard). YouTube path hiện KHÔNG dùng
  hook này → không report, không có state gated dùng được cho overlay.
- BE đối ứng (`freemium-youtube-preview-gate`): stream response thêm
  `provider ("YOUTUBE"|"HLS")`, `videoRef` (URL YouTube khi PREVIEW/FULL + provider YOUTUBE),
  `enforceClientGate`.

## 2. Quyết định

### 2.1 Nguồn ref cho player — catalog trước, stream bổ khuyết
`LessonVideoBlock` nhận thêm ref từ stream:

```ts
const effectiveRef = videoRef ?? stream?.videoRef ?? null
```

- Free/FULL: `videoRef` catalog như cũ (stream YouTube FULL cũng trả ref — trùng, vô hại).
- PREVIEW YouTube: catalog null → dùng `stream.videoRef`.
- Đang chờ stream (`!videoRef && !stream`): render skeleton aspect-video (không return null
  sớm — tránh layout nhảy); stream về mà vẫn không có ref → return null như cũ.
- `useQueryLearnLessonSwr.ts:201`: `hasVideo = videoStatus === "READY" && (isVideoRef ||
  (contentType === "VIDEO" && accessLevel === "PREVIEW"))` — để reader mount block cho bài
  PREVIEW dù curriculum không ship ref.
- `modules/api/rest/course/types.ts`: `StreamViewResponse` thêm
  `provider?: string`, `videoRef?: string | null`, `enforceClientGate?: boolean` (optional —
  chạy được với BE cũ).

### 2.2 Gate bền (persistent), không phải sự kiện một lần
Chuyển "đã chạm mốc" thành **state `gated`** nâng lên `LessonVideoBlock` (single source):

- `LessonVideoBlock` giữ `const [gated, setGated] = useState(false)`;
  `openGate = () => { setGated(true); setGateOpen(true) }` — chạm mốc = tự bật modal (yêu cầu
  đã chốt: "xem 1 ít rồi bật modal để người dùng charge").
- `LessonYouTubePlayer` nhận prop `gated: boolean`:
  - Trong interval + `onStateChange(PLAYING)`: nếu `gatedRef.current` → `pauseVideo()` +
    `seekTo(limit)` NGAY (mọi lần, không one-shot). Sửa `fireGate` để luôn pause trước khi
    check ref-guard mở modal (pause idempotent; chỉ modal là 1 lần cho tới khi user tự mở lại).
  - Clamp seek: check `current > limit → seekTo(limit, true)` chạy TRƯỚC nhánh fire (sửa
    dead code) và cả trong `onReady`.
  - Mốc fire giữ `current >= limit - 0.5` (sai số poll 1s — chấp nhận, đồng bộ HLS).
- Hợp nhất report: `LessonVideoBlock` gọi `usePreviewGate(lessonId, mode, previewSeconds,
  openGate)` và truyền `onTimeUpdate` xuống player YouTube (player gọi mỗi tick với
  currentTime) → đếm ngược + `reportOnce` + `isGated` dùng chung cho cả 2 player; HLS giữ
  nguyên wiring hiện có (dời hook lên block, HLS nhận props thay vì tự gọi — refactor nhỏ,
  hành vi giữ nguyên).

### 2.3 Overlay khoá sau khi đóng modal
Render trong `LessonVideoBlock` (trên player, trong `CardContent relative`):

```
{gated && !gateOpen ? <PreviewLockOverlay onReopen={() => setGateOpen(true)} .../> : null}
```

- Overlay: `absolute inset-0 z-20 flex flex-col items-center justify-center gap-3
  rounded-2xl bg-surface/85 backdrop-blur-sm` — mờ video + **chặn pointer tới iframe**
  (overlay không `pointer-events-none`), YouTube phía dưới không click được nữa.
- Nội dung: `LockSimpleIcon` + Typography "Hết phần xem thử" (i18n
  `courseSystem.preview.overlay.title`) + phụ đề giá gói rẻ nhất nếu có + Button primary
  "Đăng ký khoá học" (i18n `overlay.cta`) mở lại PackageGateModal. Copy/CTA theo luật
  premium-unlock = enroll (KHÔNG "VIP", icon khoá/đăng ký).
- Đóng modal → overlay hiện (vì `gated=true, gateOpen=false`); mở lại modal → overlay nhường
  (modal che). `gated` KHÔNG reset khi đóng modal; chỉ reset khi lesson đổi
  (`key={lessonId}`/effect theo lessonId) hoặc mua thành công.
- Mua thành công: `onPurchased` → mutate lesson + stream SWR → `mode="FULL"` →
  effect `if (mode === "FULL") setGated(false)` → overlay gỡ, xem hết không gate.

### 2.4 Phạm vi áp dụng — invariant một điểm mount
- Learn shell (`LessonReader`) là nơi duy nhất render video lesson → sửa tại
  `LessonVideoBlock` là phủ toàn bộ. Spec ghi invariant: mọi UI render video lesson PHẢI đi
  qua `LessonVideoBlock` (đã gate) — chống đường render mới lách gate trong tương lai.
- Document lesson: teaser đã cắt server-side (`DocumentReader`) — KHÔNG đụng.
- Course detail "Học thử miễn phí" CTA điều hướng vào learn shell — không render player
  riêng, không cần sửa.

## 3. Risks / Trade-offs

- **Client-gate là gate UX, không phải bảo mật**: với video YouTube public, user kỹ thuật vẫn
  lấy được id (BE đã ghi nhận trade-off trong `freemium-youtube-preview-gate` design §3). FE
  không cần cố "chống hack" — chặn dispatch bình thường (play lại, seek, đóng modal) là đủ.
- Poll 1s → xem lố tối đa ~1s trước khi pause — chấp nhận (đồng bộ sai số HLS 0.5s).
- iframe API fail → fallback hiện tại là iframe embed thường (LessonYouTubePlayer.tsx:204-213)
  KHÔNG gate được. Sửa fallback: ở mode PREVIEW không render iframe trần — hiện thẻ lỗi +
  CTA enroll (mất preview còn hơn lộ full video); FULL giữ fallback iframe.
- BE chưa deploy field mới → `stream.videoRef` undefined → PREVIEW YouTube không có player
  (không tệ hơn hiện trạng); typed optional nên không vỡ build.

## 4. Test mapping (chế độ gấp: implement → test & fix)

- Unit (jest/RTL nếu có harness; tối thiểu logic hook): `usePreviewGate` giữ hành vi
  (gate 1 lần mở modal, report 1 lần/phiên); helper resolve `effectiveRef`.
- E2E (Playwright, acc test 4 role — dùng acc chưa mua + acc đã mua trên apitest):
  1. User chưa mua mở bài PREVIEW video YouTube → player render, chip đếm ngược, xem đúng
     `previewSeconds` → tự pause + PackageGateModal mở; đóng modal → overlay "Hết phần xem
     thử" che video, click video không phát tiếp, nút CTA mở lại modal; seek quá mốc bị kéo về.
  2. User đã mua (FULL) mở cùng bài → không chip, không gate, xem hết video.
  3. Bài DOCUMENT PREVIEW → teaser + paywall như cũ (regression, không đụng).
- `tsc --noEmit` sạch + `npm run build` (webpack) xanh.
