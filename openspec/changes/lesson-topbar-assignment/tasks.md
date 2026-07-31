# Tasks — lesson-topbar-assignment

## 1. Nút assignment
- [x] 1.1 Gate `useGetLessonAssignmentsSwr(contentId).data.length > 0` (dùng chung key với block)
- [x] 1.2 Nút "Làm bài tập" (ClipboardTextIcon, size sm/secondary, icon-only <sm) cạnh challenge/material
- [x] 1.3 `revealAssignments`: setView("content") + scrollIntoView `#lesson-assignments`
- [x] 1.4 `LessonAssignmentBlock` thêm `id="lesson-assignments"`
- [x] 1.5 i18n `reader.assignmentButton` (vi+en)

## 2. Verify
- [x] 2.1 vitest LessonReader 51/51 (2 test mới: hiện khi có assignment / ẩn khi không)
- [x] 2.2 Type-check qua Vercel build
