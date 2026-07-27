# Tasks — lesson-viewer-enroll-and-blur-fix

## 1. Bài VIDEO khoá hiện lại thẻ "Đăng ký khóa" (BUG 1)
- [x] 1.1 `LessonReader`: đổi `showLegacyPaywall = showDocumentPreviewTeaser || (isLocked && !isPreview)` → `showLegacyPaywall = isLocked && (contentType !== "DOCUMENT" || !isPreview)`
- [x] 1.2 Xác nhận thẻ enroll (`LockSimpleIcon` + `reader.previewTitle`/`reader.lockedTitle` + nút `reader.enrollCta` gọi `setGateOpen(true)`) render cho bài VIDEO preview khoá; KHÔNG đụng `showDocumentPreviewTeaser` (video không dính blur article); giữ `LessonVideoBlock` như cũ

## 2. Lớp che preview DOCUMENT ngắn không lòi lên header (BUG 2)
- [x] 2.1 `LessonReader`: div fade `absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent via-surface/70 to-surface` → `absolute inset-0 bg-gradient-to-b from-transparent from-50% via-surface/60 to-surface`
- [x] 2.2 `DocumentReader`: cùng div fade → `absolute inset-0 bg-gradient-to-b from-transparent from-50% via-surface/60 to-surface`
- [x] 2.3 Giữ nguyên điều kiện gate `showDocumentPreviewTeaser && hasTeaserBody` ở cả hai file

## 3. Verify
- [x] 3.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 3.2 `npm run build` (webpack) compiled successfully (exit 0)
- [x] 3.3 `npx vitest run src/components/features/learn/LessonReader src/components/features/learn/DocumentReader` xanh; cập nhật kỳ vọng test preview-gating (bài VIDEO khoá GIỜ hiện thẻ enroll)
