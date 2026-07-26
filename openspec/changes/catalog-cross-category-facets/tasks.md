# Tasks — catalog-cross-category-facets

## 1. Model facet
- [x] 1.1 `useQueryCoursesSwr.ts`: thêm `CourseLevelFacet`, `CourseRatingFacet`,
      `RATING_FACET_THRESHOLDS` + helper `filterCoursesByFacets` (JSDoc đầy đủ).

## 2. Facet bar
- [x] 2.1 `FacetSortBar`: props tuỳ chọn `level`/`onLevelChange`,
      `minRating`/`onMinRatingChange`; render 2 `SegmentedControl` (chỉ khi có handler),
      sort đẩy phải bằng `ml-auto` để `/courses` không đổi bố cục.

## 3. Trang danh mục
- [x] 3.1 `CategoryPage`: `useQueryCourseCategoriesSwr` + `CategoryChipBar` dưới header,
      chọn chip → `router.push` sang `/courses` hoặc `/courses/category/<slug>`.
- [x] 3.2 `CategoryPage`: state `level` + `minRating`, truyền xuống `FacetSortBar`,
      áp `filterCoursesByFacets` trước `sortCourses`.

## 4. i18n + verify
- [x] 4.1 Thêm `courseSystem.browse.filters.*` vào `vi.json` + `en.json`.
- [x] 4.2 `npx tsc --noEmit` sạch + eslint file đã sửa.
- [ ] 4.3 `npm run build` — CHƯA chạy được trên box này (`@parcel/watcher` thiếu
      binary linux vì lockfile sinh trên Windows); cần chạy ở máy local của thầy.
