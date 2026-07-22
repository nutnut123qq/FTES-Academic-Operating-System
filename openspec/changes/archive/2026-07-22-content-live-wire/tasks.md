# Tasks — content-live-wire

## 1. Featured slider live
- [x] 1.1 `modules/api/rest/admin/types.ts`: `AdminBannerView` +`subtitle?`, `ctaText?`, `theme?`.
- [x] 1.2 `useQueryFeaturedCoursesSwr.ts`: `toFeaturedFromBanner` map subtitle/ctaText/theme/linkUrl; đổi ưu tiên realBanners, mock chỉ khi lỗi.
- [x] 1.3 `FeaturedSlide`: render `theme` làm background, `ctaLabel` (fallback i18n `courseSystem.slider.cta`), `pitch` từ subtitle; degrade khi thiếu.
- [x] 1.4 (Tuỳ chọn) slider `placement="home"` trên Home landing. — BỎ QUA (optional, chốt bỏ khi đóng sổ 2026-07-23).

## 2. Course category live
- [x] 2.1 `modules/api/rest/course/course.ts`: `getCourseCategories(nonEmpty)` + type `CourseCategoryDto`; export qua `index.ts`.
- [x] 2.2 `useQueryCourseCategoriesSwr.ts`: gọi API thật, map → `CourseCategory`, chip "All" giữ ở `CategoryChipBar`; bỏ mock `browse/categories.ts` (giữ helper accent `accentForSlug`).
- [x] 2.3 `CourseCatalog` + `useQueryCoursesSwr.ts`: filter server-side qua `getCourses({categoryId})` (resolve slug→id); SWR key theo categoryId.
- [x] 2.4 `courses/category/[slug]/page.tsx`: `generateMetadata` + `notFound()` từ category thật (resolve qua `getCourseCategories`). LƯU Ý: giữ `dynamic="force-dynamic"`, KHÔNG `generateStaticParams` — prerender tĩnh từng gây prod 500 (next-intl `headers()` → DYNAMIC_SERVER_USAGE) + tránh network lúc build.

## 3. Blog live
- [x] 3.1 Markdown an toàn: TÁI DÙNG `react-markdown` sẵn có qua `MarkdownContent` (không render raw HTML → an toàn). KHÔNG thêm dep mới (`rehype-sanitize` thừa vì đã an toàn).
- [x] 3.2 `BlogList`: `useSWRInfinite` `getBlogPosts`/`searchBlogPosts` + chip từ `getBlogCategories` + phân trang `hasNext`; `AsyncContent` skeleton + `SearchInput`.
- [x] 3.3 `BlogPost` `/blog/[slug]`: fetch `getBlogPostBySlug`, render `contentMd` an toàn, `generateMetadata` + JSON-LD; not-found khi slug lạ (BE 404).
- [x] 3.4 Xoá `components/layouts/blog/mock.ts` và mọi import.

## 4. i18n
- [x] 4.1 Thêm key `blog.{searchPlaceholder,views,relatedFallbackTitle}` + `courseSystem.slider.cta` vào `messages/vi.json` + `messages/en.json`.

## 5. Verify
- [x] 5.1 `npm run build` (webpack) + `tsc --noEmit` sạch.
- [x] 5.2 E2E thủ công trên apitest. (2026-07-23 Playwright `e2e/content-live-wire.spec.ts` 3/3, FE local nối apitest: banner seed CÓ thật (`/admin-content/banners?placement=courses` → 4 banner) render hero carousel; `/courses/categories` 200 → đủ chip tab; blog detail markdown render sạch.)
- [x] 5.3 `openspec validate content-live-wire`.
