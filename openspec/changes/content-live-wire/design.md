# Design — content-live-wire

Bối cảnh: Next.js 16 App Router, `[locale]` (vi mặc định), REST qua `restRequest`
(`modules/api/rest/client`), SWR, block `AsyncContent` cho loading/error/empty. Envelope
BE `{code,message,data}` được unwrap sẵn. Tuân skill nhà `starci-fe-cannon-apply`.

## A. featured-slider-live

### Contract & type
`modules/api/rest/admin/types.ts` — mở rộng:
```ts
export interface AdminBannerView {
  id: string; title: string; subtitle?: string; imageUrl: string;
  linkUrl?: string; ctaText?: string; theme?: string;
  placement: string; sortOrder: number
}
```
`getAdminPublicBanners(placement)` giữ nguyên (`GET /admin-content/banners`, public).

### Adapter & UI
`useQueryFeaturedCoursesSwr.ts`:
- `toFeaturedFromBanner(b)` map thêm: `pitch ← b.subtitle`, `href ← b.linkUrl`,
  `ctaLabel ← b.ctaText`, `theme ← b.theme`, `coverUrl ← b.imageUrl`, `title ← b.title`.
- Đổi thứ tự ưu tiên: `realBanners` (kể cả rỗng sau khi settled) là nguồn chính; **mock chỉ
  dùng khi `bannersError`** (không phải khi rỗng) — rỗng thì slider tự ẩn/skeleton→empty.
- `FeaturedSlide`: render `theme` làm `style={{ background: theme }}` (chỉ nhận chuỗi
  gradient/màu; không nội suy HTML), `ctaLabel` fallback i18n `courseSystem.slider.cta`,
  `pitch` dưới `title`. Card degrade nếu thiếu field (đúng pattern hiện có).
- `useCarousel` giữ nguyên (autoplay 5s, pause hover/focus/hidden, reduced-motion, ARIA).

### (Tuỳ chọn) slider trang chủ
Thêm section dùng lại `FeaturedSlider` với `placement="home"` trên Home; hoặc để dành. Nếu
làm: hook `useQueryFeaturedCoursesSwr("home")` tham số hoá placement.

## B. course-category-live

### Contract & type
`modules/api/rest/course/course.ts` — thêm:
```ts
export interface CourseCategoryDto { id: string; name: string; slug: string; description?: string; courseCount: number }
export const getCourseCategories = (nonEmpty = true) =>
  restRequest<CourseCategoryDto[]>({ method:"GET", url:"/courses/categories",
    authenticated:false, params:{ nonEmpty } })
```
`getCourses` đã nhận `categoryId` — không đổi.

### Hook & filter
`useQueryCourseCategoriesSwr.ts`:
- Gọi `getCourseCategories()`; map DTO → view `CourseCategory {id, slug, name, description,
  accent}` (`accent` sinh cục bộ theo slug — thuần trình bày). Giữ chip "All" (client thêm đầu list).
- `name/description` per-locale: nếu BE trả string đã theo locale → dùng thẳng; nếu trả 1
  ngôn ngữ → hiển thị nguyên (không dịch client). Ghi rõ trong code comment.

`useQueryCoursesSwr.ts` / `CourseCatalog`:
- Chuyển filter danh mục sang **server-side**: khi chọn chip/trang category, resolve
  `slug→categoryId` từ list categories rồi `getCourses({ categoryId, q, level, size })`.
  SWR key gồm `categoryId/q/level` để cache đúng. Search & sort có thể giữ client-side giai
  đoạn đầu, chuyển `q` sang server sau (endpoint đã hỗ trợ).

### Trang category
`courses/category/[slug]/page.tsx`:
- `generateStaticParams`: fetch `getCourseCategories()` build-time (hoặc `dynamicParams=true`
  + `revalidate`), sinh slug thật; slug lạ → `notFound()`.
- `generateMetadata`: title/description theo category (SEO).

## C. blog-live

### Dùng REST client `rest/blog` (đã có)
- `getBlogPosts({ categorySlug?, page, size })` → `GET /api/v1/blog/posts` (public).
- `searchBlogPosts({ q, page, size })` → `GET /api/v1/blog/posts/search`.
- `getBlogPostBySlug(slug)` → `GET /api/v1/blog/posts/{slug}` (tăng view server-side, dedupe).
- `getBlogCategories()` → `GET /api/v1/blog/categories`.

### UI
`components/layouts/blog/`:
- `BlogList`: SWR list theo `categorySlug`/`page`; chip category từ `getBlogCategories`;
  ô search gọi `searchBlogPosts`; `AsyncContent` skeleton mirror grid; phân trang
  (`hasNext` từ `PostPage`). **Xoá `mock.ts`.**
- `BlogPost` (`/blog/[slug]`): server component fetch `getBlogPostBySlug`; render
  `content` (markdown) qua renderer an toàn — **thêm `react-markdown` + `rehype-sanitize`**
  (hoặc `marked` + `DOMPurify`) vì hiện repo chưa có lib markdown; `generateMetadata` từ
  bài viết (title, thumbnail → og:image). Slug không tồn tại → `notFound()`.
- Comments/reactions (authenticated) tuỳ chọn giai đoạn 2 (endpoint `BlogEngagementController`
  đã có; hook `rest-fetch-blog` đã có) — không bắt buộc cho change này.

### i18n
Nhãn UI (nút "Đọc tiếp", "Danh mục", "Tìm kiếm", "Không có bài viết") thêm vào
`messages/vi.json` + `messages/en.json` namespace `blog.*`, `courseSystem.slider.*`,
`courseSystem.catalog.*`. Nội dung bài viết/category name lấy từ BE.

## Ghi chú chung
- Mọi fetch public dùng `authenticated:false`.
- Giữ nguyên quyết định "no carousel dependency".
- Trước khi các endpoint BE lên apitest: các hook giữ nhánh fallback mock có cờ để bật/tắt,
  gỡ mock khi verify E2E xanh.
