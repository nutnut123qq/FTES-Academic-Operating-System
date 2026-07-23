# Tasks — learn-preview-player-gate

> **Chế độ gấp** (bug thật user báo trên UI): implement → test & fix ngay trong vòng này;
> phần đánh giá sâu/round 2 ghi vào backlog cuối file, KHÔNG chặn ship.

## 1. Contract & mount cho PREVIEW
- [x] 1.1 `modules/api/rest/course/types.ts`: `StreamViewResponse` thêm `provider?`,
      `videoRef?`, `enforceClientGate?` (optional — an toàn khi BE cũ)
- [x] 1.2 `useQueryLearnLessonSwr.ts`: `hasVideo` bao thêm nhánh
      `contentType === "VIDEO" && accessLevel === "PREVIEW"` (videoStatus READY)
- [x] 1.3 `LessonVideoBlock.tsx`: `effectiveRef = videoRef ?? stream?.videoRef`; bỏ early
      return khi chờ stream (skeleton aspect-video); stream về không ref → null như cũ

## 2. Gate bền + auto-modal (LessonYouTubePlayer)
- [x] 2.1 Nâng state `gated` lên `LessonVideoBlock` (openGate = setGated(true) +
      setGateOpen(true)); reset theo lessonId; effect `mode === "FULL"` → gỡ gated
- [x] 2.2 `LessonYouTubePlayer`: fireGate LUÔN pause (không one-shot); sau gated mọi
      PLAYING → pause + seekTo(limit); fix dead-code clamp seek (clamp chạy trước nhánh fire)
- [x] 2.3 Hợp nhất `usePreviewGate` cho đường YouTube (đếm ngược + report preview-limit
      1 lần/phiên) — HLS refactor nhận props từ block, hành vi giữ nguyên
- [x] 2.4 Fallback iframe trần khi IFrame API fail: mode PREVIEW → thẻ lỗi + CTA enroll
      (KHÔNG iframe không gate); FULL giữ fallback cũ

## 3. Overlay khoá sau khi đóng modal
- [x] 3.1 `PreviewLockOverlay` trong `LessonVideoBlock` (absolute inset-0, bg-surface/85 +
      backdrop-blur, chặn pointer): icon khoá + "Hết phần xem thử" + giá gói rẻ nhất (nếu có)
      + Button primary mở lại PackageGateModal — copy theo luật premium-unlock=enroll
- [x] 3.2 Điều kiện render `gated && !gateOpen`; onPurchased → mutate → overlay gỡ
- [x] 3.3 i18n `courseSystem.preview.overlay.{title,body,cta}` (vi/en) + sửa typo
      "thờ igian" → "thời gian" ở `courseSystem.preview.gate.titleVideo` (vi.json)

## 4. Test & fix (chạy ngay sau implement)
> 4.1–4.3 CHỜ SMOKE SERVER: cần BE `freemium-youtube-preview-gate` deploy lên apitest
> (stream trả `videoRef` cho PREVIEW) + acc chưa-mua/đã-mua. Logic đã verify bằng code
> (đọc code path gate bền + overlay + fallback). 4.4 (tsc/build) chạy ngay.
- [ ] 4.1 E2E: acc chưa mua mở bài PREVIEW video YouTube → xem đúng previewSeconds → pause +
      modal tự mở; đóng modal → overlay che, play/click không phát tiếp, CTA mở lại modal;
      seek quá mốc bị kéo về
- [ ] 4.2 E2E: acc đã mua (FULL) → xem hết, không chip/gate/overlay
- [ ] 4.3 Regression: DOCUMENT PREVIEW teaser + paywall như cũ; HLS PREVIEW như cũ
- [x] 4.4 `tsc --noEmit` sạch + `npm run build` (webpack) xanh; fail thì fix trong vòng này

## Backlog (đánh giá ghi lại, không chặn)
- [ ] B.1 Ẩn/khống chế related videos & watermark click-out của YouTube embed ở PREVIEW
      (playerVars bổ sung) — polish, không chặn
- [ ] B.2 Đánh giá vòng 2 theo quality loop (unit+E2E → đánh giá → fix ×2) sau khi BE
      `freemium-youtube-preview-gate` deploy lên apitest
- [ ] B.3 Nếu BE thêm `videos.visibility` (unlisted): nhánh PREVIEW không ref → teaser
      thumbnail + CTA

## Nghiệm thu E2E 2026-07-23 (spec e2e/learn-preview-player-gate.spec.ts, 4/4 scenario chạy được đều xanh)
- Kịch bản lõi (đếm previewSeconds/pause/seek-clamp) KHÔNG chạy được trên apitest: BE change preview-youtube-ref-gate (c08425c, 2026-07-22) CỐ Ý trả videoRef:null cho mọi PREVIEW → client-gate thành dead-path môi trường thật. Hành vi thay thế verify OK: không rò iframe, paywall+modal đúng; FULL YT + FULL HLS không gate; DOCUMENT PREVIEW regression OK.
- Acc FULL trên khoa-test YT: BLOCKED-DATA.
- Đề nghị: đánh dấu tasks 4.1/4.2 superseded bởi preview-youtube-ref-gate rồi đóng sổ, hoặc giữ chờ BE bật lại ref PREVIEW.
