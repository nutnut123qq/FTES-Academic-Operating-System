# Tasks — lesson-tier-badge

## 1. Thread packageSlugs qua contract
- [x] 1.1 `modules/api/rest/course/types.ts`: `LessonView.packageSlugs?: string[]`.
- [x] 1.2 `useQueryCourseDetailSwr`: `CourseLesson.packageSlugs: string[]` + mapper `packageSlugs: lesson.packageSlugs ?? []`.

## 2. Badge tier trong CourseDetail
- [x] 2.1 Consts module: `TIER_LABEL_FALLBACK` (5 slug) + `titleCaseSlug`.
- [x] 2.2 Lift `useQueryCoursePackagesSwr(course.rawId, {enabled: isPackage})` → `packageNameBySlug` (Map slug→name) + `resolveTierLabel`.
- [x] 2.3 Badge render: `packageSlugs[0]` (`!== "free"`) → `resolveTierLabel`; rỗng + `isLocked` → `t("detail.premium")`; else null.

## 3. Verify
- [x] 3.1 `tsc --noEmit` sạch.
- [ ] 3.2 `npm run build` (webpack) xanh.
- [x] 3.3 E2E local: combo PRF192 (PACKAGE) → 27 PREMIUM / 10 BASIC / 3 free-no-badge (khớp phân bố packageSlugs[0]); free-tier bài không badge.
- [x] 3.4 E2E local: WED201c (LEGACY, packageSlugs rỗng) locked lessons → badge "Premium" (30) giữ nguyên; section header không badge.
