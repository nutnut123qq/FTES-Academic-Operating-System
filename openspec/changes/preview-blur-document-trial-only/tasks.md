# Tasks — preview-blur-document-trial-only

## 1. Gate blur teaser to DOCUMENT + free-trial
- [x] 1.1 `LessonReader`: dẫn xuất `isTrialPreview = isLocked && isPreview` + `showDocumentPreviewTeaser = isTrialPreview && contentType === "DOCUMENT"` + `showLegacyPaywall = showDocumentPreviewTeaser || (isLocked && !isPreview)`
- [x] 1.2 `LessonReader` (nhánh legacy): gate `select-none`, fade gradient, footer teaser sau các boolean trên (video/mixed không còn mờ; khoá-cứng vẫn có paywall)
- [x] 1.3 `DocumentReader`: nhận prop `contentType`, dẫn xuất cùng boolean, gate `select-none` + fade gradient theo `showDocumentPreviewTeaser`; PaywallCard giữ theo `locked` (khoá-cứng as-is)
- [x] 1.4 Truyền `contentType={lesson.contentType}` từ LessonReader → DocumentReader

## 2. Badge access ở outline (đã có — ghi spec + xác nhận)
- [x] 2.1 Xác nhận `ContentMap` render chip `content.previewBadge` (accent) khi PREVIEW, chip `content.premium` + LockSimpleIcon khi `isLocked`, else thời lượng; full-access → không badge
- [x] 2.2 Xác nhận i18n `learn.content.previewBadge` + `learn.content.premium` có đủ ở en.json + vi.json (tái dùng, không đẻ key trùng)

## 3. Ảnh bìa khoá vào PackageGateModal
- [x] 3.1 `useQueryLearnLessonSwr`: thêm field `courseCoverUrl` (`detail.course.imageHeader`) vào `LearnLessonView` + `buildLessonView`
- [x] 3.2 `PackageGateModal`: prop `courseCoverUrl?`; header render `CoverImage` (16:9, alt = tên khoá) khi có ảnh, else lock-icon fallback
- [x] 3.3 Truyền `courseCoverUrl` từ LessonReader (modal của nó + DocumentReader + LessonVideoBlock) và ContentMap (`course.header.coverUrl`)

## 4. Nút phóng to video → góc phải dưới
- [x] 4.1 `LessonFullscreenButton` (dùng chung YouTube + self-hosted): `left-3 top-3` → `bottom-3 right-3`, giữ z-index/style + hành vi toggle

## 5. Verify
- [x] 5.1 `npx tsc --noEmit` sạch (exit 0)
- [x] 5.2 `npm run build` (webpack) compiled successfully
- [x] 5.3 Test: VIDEO-học-thử không mờ/không teaser; khoá-cứng vẫn có `lockedTitle`; DOCUMENT non-DOCUMENT type → không fade
