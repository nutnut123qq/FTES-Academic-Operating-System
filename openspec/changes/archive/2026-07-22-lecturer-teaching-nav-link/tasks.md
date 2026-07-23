# Tasks — lecturer-teaching-nav-link

## 1. Link + gate
- [x] 1.1 `resources/path/index.ts`: thêm builder `course().teaching()` → `/courses/teaching` (mirror `mine()`).
- [x] 1.2 `AccountMenuAuthed`: `const isLecturer = useHasPermission("ai.teacher.use")`; render `Dropdown.Item` "Khoá tôi dạy" (icon `ChalkboardTeacher`) dưới "Khóa học của tôi" chỉ khi `isLecturer`.
- [x] 1.3 i18n `nav.teaching` (vi + en).

## 2. Verify
- [x] 2.1 `tsc --noEmit` sạch.
- [x] 2.2 `npm run build` (webpack) xanh. (2026-07-23: build + tsc exit 0; kèm E2E `e2e/lecturer-teaching-nav-link.spec.ts` 2/2 — instructor.test thấy "Khoá tôi dạy" → /courses/teaching, student không thấy.)
- [x] 2.3 E2E FE local: instructor.test (có `ai.teacher.use`) thấy "Khoá tôi dạy" trong account menu; student.test (không có) KHÔNG thấy (vẫn thấy "Khóa học của tôi").
