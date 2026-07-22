# content-live-wire — Nối slider · danh mục khoá học · blog sang backend thật

## Why

Ba khối nội dung storefront đã dựng xong UI nhưng **đang chạy mock** vì backend chưa sẵn
dữ liệu/endpoint. Sau khi backend hoàn thiện (`banner-slider-enrichment`,
`course-category-public-api`, và blog đã có sẵn `vn.ftes.aos.blog`), FE cần **thay điểm
mock (`BE-SWAP POINT`) bằng dữ liệu thật**:

- **Slider khoá học** (`FeaturedSlider`): đã gọi `GET /admin-content/banners?placement=courses`
  nhưng fallback `FEATURED_ROWS` vì DB rỗng; và slide chưa nhận `subtitle/ctaText/theme`.
- **Danh mục khoá học** (`CategoryChipBar`/`CategoryShelf`/trang `/courses/category/[slug]`):
  taxonomy mock 1 category "all" trong `browse/categories.ts`; filter đang client-side.
- **Blog** (`/blog`, `/blog/[slug]`): render từ `mock.ts`, chưa gọi REST blog thật.

## What Changes

- **Slider**: mở rộng `AdminBannerView` + adapter `toFeaturedFromBanner` mang `subtitle`,
  `ctaText`, `theme`; slide render pitch/CTA/gradient từ banner thật; giữ mock chỉ như
  fallback cuối khi API lỗi (không phải mặc định). Tuỳ chọn: thêm slider `placement="home"`.
- **Danh mục**: `useQueryCourseCategoriesSwr` gọi `GET /courses/categories` thật; giữ shape
  `CourseCategory {id, slug, name, description}` (BE trả string đã theo locale hoặc FE map);
  chuyển **filter sang server-side** — chọn chip/trang category → `getCourses({categoryId})`
  (map `slug→categoryId` từ list danh mục); `generateStaticParams` của
  `/courses/category/[slug]` sinh từ slug thật (ISR/revalidate).
- **Blog**: `BlogList`/`BlogPost` đọc `getBlogPosts`/`getBlogPostBySlug`/`getBlogCategories`
  (REST client `rest/blog` đã có từ change `rest-fetch-blog`); phân trang + lọc theo
  `categorySlug` + search; SSR `generateMetadata` cho SEO bài viết; bỏ `mock.ts`.
- Thêm i18n key (vi + en) cho nhãn UI mới; nội dung domain (category name, banner title,
  blog title) theo dữ liệu BE.

## Capabilities

### New Capabilities
- `featured-slider-live`: slider khoá học chạy banner thật, giàu subtitle/CTA/theme.
- `course-category-live`: taxonomy khoá học thật + filter server-side.
- `blog-live`: trang blog + chi tiết chạy REST blog thật (list/search/detail/category).

### Modified Capabilities
- Không đổi contract capability cũ; thay nguồn dữ liệu tại các `BE-SWAP POINT` đã đánh dấu.

## Impact

- **Files**: `components/features/course/hooks/useQueryFeaturedCoursesSwr.ts`,
  `.../useQueryCourseCategoriesSwr.ts`, `.../useQueryCoursesSwr.ts`,
  `CourseCatalog/FeaturedSlider/*`, `browse/categories.ts`,
  `courses/category/[slug]/*`, `components/layouts/blog/{BlogList,BlogPost}` (bỏ `mock.ts`),
  `modules/api/rest/admin/types.ts` (`AdminBannerView` +3 field), `modules/api/rest/course/`
  (thêm `getCourseCategories`), `messages/{vi,en}.json`.
- **Không thêm dependency**; carousel vẫn tự viết (`useCarousel`).
- **Phụ thuộc backend**: banner có `subtitle/ctaText/theme` + đã migrate; `GET
  /courses/categories` live; blog endpoints live. Trước khi BE sẵn, giữ fallback mock.
