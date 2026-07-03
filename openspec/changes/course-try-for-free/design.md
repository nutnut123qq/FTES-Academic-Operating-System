# Design — course-try-for-free

## Context
Prior art StarCi (`starci-academy` `LessonReader`): BE cắt teaser server-side, FE chỉ fade +
paywall — KHÔNG che bằng CSS trên full body (client không bao giờ có full body khi chưa mua).
Video: StarCi chưa enforce; FTES BE trả preview manifest nên player tự hết segment ở mốc —
FE chỉ lo UX (chip đếm, popup), không phải chống gian lận.

## Goals / Non-Goals
**Goals:** DOCUMENT reader (markdown + TOC), teaser paywall, video preview UX, PackageGateModal
dùng chung, lock/badge trên outline. Build green, mock SWR khi BE chưa merge.
**Non-Goals:** flow thanh toán thật (thuộc `course-enroll`), editor markdown (thuộc Admin),
đa ngôn ngữ nội dung bài đọc.

## Decisions
- **DocumentReader**: `react-markdown` + `remark-gfm`; heading render kèm id slugify
  (`data-toc-label` text sạch); TOC lấy h2/h3/h4, active = `text-accent`, scroll-spy.
  Bài đọc nằm trong Card "paper" (nền surface), theo layout workspace rail trái đã chốt.
- **Locked state đọc từ response** (`locked === true`), không tự suy từ enrollment —
  đồng bộ FE gate với BE guard. Teaser render như thường + overlay gradient
  `absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent via-surface/70 to-surface pointer-events-none`
  (fade opacity, KHÔNG blur) + wrapper `select-none`. PaywallCard đặt NGAY dưới fade,
  trong cùng card: lock icon + "Đọc tiếp với gói {name}" + giá + CTA primary "Mua gói"
  (mở PackageGateModal) — không frame riêng.
- **Video preview**: stream response `mode === "PREVIEW"` → chip đếm ngược "Xem thử còn mm:ss"
  góc player; `timeupdate ≥ previewSeconds - 0.5` HOẶC player kết thúc (manifest preview hết
  segment) → pause + PackageGateModal + fire `preview-limit` (guard 1 lần/lesson/phiên,
  sessionStorage). Seek bar giới hạn hiển thị theo previewSeconds.
- **PackageGateModal** (1 component, 2 entry): tiêu đề theo ngữ cảnh ("Bạn đã xem hết 15 phút
  học thử" / "Đăng ký để đọc tiếp"), list "unlock được gì" (từ entitlements của package),
  giá `sale_price` (gạch `original_price` khi rẻ hơn), CTA → purchase flow `course-enroll`,
  link "Để sau" dismiss. Màu chủ đạo #3F51B5, login popup-only: chưa đăng nhập → mở login
  popup trước (BE không cấp PREVIEW cho guest).
- **Outline**: `accessLevel === "NONE"` → LockIcon THAY icon type (status icon overrides base),
  row click mở PackageGateModal; `PREVIEW` → badge nhỏ "Học thử", click vào học bình thường.
- Sau khi mua thành công (event từ purchase flow) → mutate lại lesson/content/stream SWR
  (access cache BE đã evict) → mở khoá tại chỗ, không reload.

## Risks / Trade-offs
- BE chưa merge → mock `useLessonContentSwr`/stream mode bằng fixture; flag gỡ mock ghi trong tasks.
- Đếm ngược dựa `timeupdate` có sai số ~0.5s — chấp nhận, manifest preview là chốt chặn thật.
- Teaser quá ngắn (bài ngắn) vẫn `locked:true` → paywall hiện ngay sau vài dòng: đúng chủ đích.
