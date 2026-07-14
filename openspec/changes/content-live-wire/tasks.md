# Tasks — content-live-wire

## 1. Featured slider live
- [ ] 1.1 `modules/api/rest/admin/types.ts`: `AdminBannerView` +`subtitle?`, `ctaText?`, `theme?`.
- [ ] 1.2 `useQueryFeaturedCoursesSwr.ts`: `toFeaturedFromBanner` map subtitle/ctaText/theme/linkUrl; đổi ưu tiên realBanners, mock chỉ khi lỗi.
- [ ] 1.3 `FeaturedSlide`: render `theme` làm background, `ctaLabel` (fallback i18n), `pitch` từ subtitle; degrade khi thiếu.
- [ ] 1.4 (Tuỳ chọn) slider `placement="home"` trên Home landing.

## 2. Course category live
- [ ] 2.1 `modules/api/rest/course/course.ts`: `getCourseCategories(nonEmpty)` + type `CourseCategoryDto`; export qua `index.ts`.
- [ ] 2.2 `useQueryCourseCategoriesSwr.ts`: gọi API thật, map → `CourseCategory`, thêm chip "All"; bỏ mock `browse/categories.ts` (giữ helper accent).
- [ ] 2.3 `CourseCatalog` + `useQueryCoursesSwr.ts`: filter server-side qua `getCourses({categoryId})` (resolve slug→id); SWR key theo categoryId/q/level.
- [ ] 2.4 `courses/category/[slug]/page.tsx`: `generateStaticParams`/`generateMetadata` từ category thật; slug lạ → `notFound()`.

## 3. Blog live
- [ ] 3.1 Thêm dependency markdown an toàn (`react-markdown` + `rehype-sanitize` hoặc `marked`+`DOMPurify`).
- [ ] 3.2 `BlogList`: SWR `getBlogPosts`/`searchBlogPosts` + chip từ `getBlogCategories` + phân trang `hasNext`; `AsyncContent` skeleton.
- [ ] 3.3 `BlogPost` `/blog/[slug]`: fetch `getBlogPostBySlug`, render markdown an toàn, `generateMetadata`; `notFound()` khi thiếu.
- [ ] 3.4 Xoá `components/layouts/blog/mock.ts` và mọi import.

## 4. i18n
- [ ] 4.1 Thêm key `blog.*`, `courseSystem.slider.*`, `courseSystem.catalog.*` vào `messages/vi.json` + `messages/en.json`.

## 5. Verify
- [ ] 5.1 `npm run build` (webpack) + `tsc --noEmit` sạch.
- [ ] 5.2 E2E thủ công trên apitest: slider hiện 9 banner thật (không mock); chip danh mục lọc đúng khoá; `/blog` + 1 bài chi tiết render từ BE; đổi locale vi/en OK.
- [ ] 5.3 `openspec validate content-live-wire`.
