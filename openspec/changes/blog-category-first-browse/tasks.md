# Tasks — blog-category-first-browse

## 1. Bỏ dải chủ đề cứng
- [x] 1.1 Xoá thư mục `src/components/layouts/blog/BlogList/TopicsStrip/`.
- [x] 1.2 Gỡ import + mount `<TopicsStrip />` trong `BlogList/index.tsx`.

## 2. Đẩy danh mục lên đầu
- [x] 2.1 `BlogList/index.tsx`: render `<CategoryFilter>` TRƯỚC `<SearchInput>`;
      bỏ điều kiện `!isSearching` (chỉ còn gate `showFilter`), cập nhật JSDoc khối.

## 3. i18n + verify
- [x] 3.1 Xoá key `blog.topics` khỏi `src/messages/vi.json` + `en.json`.
- [x] 3.2 `npx tsc --noEmit` sạch + eslint file đã sửa.
- [ ] 3.3 `npm run build` — CHƯA chạy được trên box này (`@parcel/watcher` thiếu
      binary linux vì lockfile sinh trên Windows); cần chạy ở máy local của thầy.
