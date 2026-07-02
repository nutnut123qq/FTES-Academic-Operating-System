## 1. Data model (mock)

- [x] 1.1 Mở rộng interface `Course` trong `useQueryCoursesSwr.ts` với `description?`, `learnOutcomes?: string[]`, `updatedAt?: string` (JSDoc ghi giả định BE) + seed dữ liệu cho 10 course mock

## 2. Hover preview component

- [x] 2.1 Tạo `features/course/browse/CourseHoverPreview/index.tsx` (theo starci-fe-cannon-apply): wrapper bọc children, hover open/close với delay (~300ms mở / ~100ms đóng, clear timer on unmount), panel absolute cạnh card, flip trái/phải theo viewport lúc mở, CSS gate desktop-only `(hover:hover) and (pointer:fine)`
- [x] 2.2 Nội dung panel: title, badge + level chip, dòng "Cập nhật <tháng/năm>", meta (giờ · level · bài học), description, tối đa 3 learnOutcomes với checkmark, Button primary "Đăng ký khóa học" (→ course detail) + `SaveButton`; mọi field thiếu chỉ ẩn row của nó
- [x] 2.3 Bọc `CatalogCourseCard` bằng `CourseHoverPreview` tại các chỗ render (CategoryShelf, CourseCatalog grid, CategoryPage) — hoặc export card đã bọc từ `browse/index.ts`
- [x] 2.4 Verify panel không bị `CategoryShelf` (overflow-x-auto) clip; nếu clip → chuyển portal `document.body` + `position: fixed` theo rect card (đi thẳng portal + fixed: shelf track `overflow-x-auto` chắc chắn clip absolute panel)

## 3. i18n

- [x] 3.1 Thêm keys `courseSystem.browse.preview.*` (updated line, CTA enroll — bỏ heading outcomes để khớp reference Udemy: checkmark list không cần heading) cho cả vi + en

## 4. Verify

- [x] 4.1 `npx tsc --noEmit` sạch + `npm run build` (webpack) xanh — build chạy trong worktree cô lập (`.next` lock của tree chính bị `next start` session khác giữ)
- [x] 4.2 Verify runtime trên `next start` từ worktree (headless preview): panel mở sau delay 300ms với đủ nội dung (title/badge/level/updated/meta/description/3 outcomes/CTA/Save), card→panel giữ mở, leave đóng, mở lại được, panel portal ở body (không bị shelf clip, không lồng trong `<a>`), flip-side math chạy đúng (env viewport 0×0 → chọn trái đúng công thức); CSS gate desktop-only là static class, mobile emulation không khả dụng trong env này
