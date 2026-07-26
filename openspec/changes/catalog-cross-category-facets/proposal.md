# Trang danh mục khoá học: chuyển danh mục tại chỗ + lọc sao & cấp độ

## Why

`/courses/category/[slug]` (vd `software-engineering`) hiện là ngõ cụt: header +
ô tìm kiếm + sort, hết. Người dùng đang xem 1 danh mục **không có đường sang danh
mục khác** (phải quay lại `/courses`), và không lọc được theo **số sao** hay
**cấp độ** — hai facet cơ bản của mọi catalog khoá học (Coursera/Udemy).

Dữ liệu cho cả hai facet đã có sẵn trong model card `Course`: `rating` (từ
`avgStar`) và `level` (từ `mapCourseLevel`) — không cần backend làm gì thêm.

## What Changes

- **`FacetSortBar`** nhận thêm 2 facet **tuỳ chọn** (chỉ render khi caller truyền
  handler, nên `/courses` giữ nguyên giao diện cũ):
  - `level` / `onLevelChange` — `SegmentedControl`: Tất cả · Cơ bản · Trung cấp · Nâng cao.
  - `minRating` / `onMinRatingChange` — `SegmentedControl`: Tất cả · 4.5★+ · 4★+ · 3.5★+.
  Sort vẫn nằm cuối hàng (đẩy phải bằng `ml-auto`).
- **`useQueryCoursesSwr`**: thêm type facet (`CourseLevelFacet`, `CourseRatingFacet`)
  + helper thuần `filterCoursesByFacets(courses, { level, minRating })`. Khoá chưa
  có `rating` bị loại khi facet sao đang bật (không đoán bừa 0 sao).
- **`CategoryPage`**: mount `CategoryChipBar` ngay dưới header — chip "Tất cả" →
  `/courses`, chip danh mục khác → `/courses/category/<slug>` (điều hướng thật qua
  `useRouter` của `@/i18n/navigation`, giữ locale). Danh mục lấy từ
  `useQueryCourseCategoriesSwr`; chip bar chỉ hiện khi đã có danh mục. Trang giữ
  state `level` + `minRating` và lọc client-side chồng lên tìm kiếm + sort sẵn có.
- **i18n**: `courseSystem.browse.filters.*` (`levelLabel`, `ratingLabel`, `all`,
  `ratingAtLeast`) cho vi + en.

## Impact

- Affected specs: course browse (facet bar + trang danh mục).
- Affected code: `src/components/features/course/browse/FacetSortBar/index.tsx`,
  `src/components/features/course/hooks/useQueryCoursesSwr.ts`,
  `src/components/features/course/CategoryPage/index.tsx`,
  `src/messages/{vi,en}.json`.
- Không đụng backend: `GET /courses?categoryId=` + `GET /courses/categories` đã đủ;
  lọc sao/cấp độ chạy trên list đã tải (size 100 mỗi danh mục).
