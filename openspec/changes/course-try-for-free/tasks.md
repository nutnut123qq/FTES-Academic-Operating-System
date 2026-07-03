# Tasks — course-try-for-free

## 1. Document reader
- [ ] 1.1 Hook `useLessonContentSwr(lessonId)` (GET /api/v1/lessons/{id}/content; mock fixture khi BE chưa sẵn — gỡ mock khi BE merge)
- [ ] 1.2 `DocumentReader`: react-markdown + remark-gfm trong Card paper; heading id slugify + `data-toc-label`
- [ ] 1.3 TOC "Trên trang này" (h2/h3/h4, scroll-spy, active text-accent) ở rail phải desktop, ẩn mobile
- [ ] 1.4 Nhánh render theo `lesson.type` trong lesson view: VIDEO giữ player, DOCUMENT → DocumentReader

## 2. Teaser paywall (document)
- [ ] 2.1 `locked === true` → wrapper `select-none` + overlay gradient fade đáy (h-72, from-transparent via-surface/70 to-surface, pointer-events-none)
- [ ] 2.2 `PaywallCard` inline dưới fade (lock icon + gói rẻ nhất từ `teaser.cheapestPackage` + giá + CTA "Mua gói" mở PackageGateModal)

## 3. Video preview
- [ ] 3.1 Đọc `{mode, previewSeconds, cheapestPackage}` từ stream response; chip đếm ngược "Xem thử còn mm:ss" trên player
- [ ] 3.2 Chạm mốc (timeupdate/ended) → pause + mở PackageGateModal + `POST /lessons/{id}/preview-limit` (guard 1 lần/lesson/phiên, sessionStorage)
- [ ] 3.3 Giới hạn seek bar hiển thị theo previewSeconds ở mode PREVIEW

## 4. PackageGateModal + outline lock
- [ ] 4.1 `PackageGateModal` dùng chung (context title, unlock list từ entitlements, giá sale/original, CTA → purchase flow course-enroll, "Để sau" dismiss); chưa đăng nhập → mở login popup trước
- [ ] 4.2 Outline: `accessLevel === "NONE"` → LockIcon thay icon type + click mở modal; `PREVIEW` → badge "Học thử"
- [ ] 4.3 Sau purchase thành công → mutate lesson/content/stream SWR (mở khoá tại chỗ)

## 5. i18n & verify
- [ ] 5.1 i18n `courseSystem.preview.*` (vi/en): chip, paywall, modal, badge
- [ ] 5.2 tsc + eslint + build xanh; test luồng PREVIEW bằng mock (locked doc, video chạm mốc, modal, dismiss)
