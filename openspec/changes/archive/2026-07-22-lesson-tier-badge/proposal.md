# lesson-tier-badge — Badge tier bài học lấy từ packageSlugs thay "Premium" chung

## Why

Trang chi tiết khóa `/vi/courses/{slug}` hiển thị badge "Premium" chung trên MỌI bài không-free
(`isPremium = !free`), không phản ánh gói tối thiểu để mở bài. BE giờ trả `lesson.packageSlugs`
(danh sách slug gói mở khóa bài, sắp xếp thấp→cao — đã verify live: `[free/premium/master]`,
`[basic/premium/master]`, `[premium/master]`... nên `[0]` = tier tối thiểu). Course dạng PACKAGE có
5 gói (free/basic/premium/master/on-tap-thuc-chien) với tên riêng — cần badge chỉ đúng gói tối thiểu
(vd "BASIC"/"PREMIUM") thay vì "Premium" cho tất cả.

## What Changes

- Thread `packageSlugs` qua contract: raw `LessonView.packageSlugs?: string[]` +
  domain `CourseLesson.packageSlugs: string[]` (mapper `?? []`, fail-safe cho LEGACY course).
- `CourseDetail` render badge từ `lesson.packageSlugs[0]`:
  - `[0]` có + `!== "free"` → badge nhãn gói (từ `PackageView.name` khớp slug, lift
    `useQueryCoursePackagesSwr(course.rawId, {enabled: isPackage})`; fallback map tĩnh 5 slug →
    cuối cùng title-case slug).
  - `packageSlugs` RỖNG (LEGACY) + `isLocked` → giữ badge "Premium" cũ (`t("detail.premium")`).
  - tier `free` hoặc (rỗng + không locked) → KHÔNG badge.
- **KHÔNG** đổi lock/navigation (vẫn theo `isLocked`), **KHÔNG** đổi BE, **KHÔNG** thêm i18n
  (nhãn tier từ data gói; fallback dùng `detail.premium` sẵn có).

## Capabilities

### New Capabilities
- `lesson-tier-badge`: syllabus SHALL hiển thị badge tier theo `packageSlugs[0]` (nhãn = tên gói),
  thay "Premium" generic; rỗng+locked giữ "Premium"; tier free không badge.

### Modified Capabilities
<!-- none -->

## Impact

- FE only. `modules/api/rest/course/types.ts` (LessonView), `components/features/course/hooks/useQueryCourseDetailSwr.ts`
  (CourseLesson + mapper), `components/features/course/CourseDetail/index.tsx` (consts label + lift packages hook + badge render).
- `tsc --noEmit` + `npm run build` (webpack) xanh; E2E verify: combo PRF192 (PACKAGE) badge 27 PREMIUM/10 BASIC/3 free-no-badge; WED201c (LEGACY) locked → "Premium".
- `useQueryCoursePackagesSwr` dùng chung SWR key với PackageEnrollCard → deduped, không fetch trùng.
