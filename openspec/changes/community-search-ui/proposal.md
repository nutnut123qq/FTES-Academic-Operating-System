## Why

Trang community chỉ có 4 tab feed (For You/Following/Campus/Trending), không có ô tìm kiếm / sort / lọc.
Người dùng cần tìm bài "liên quan" theo từ khoá + sort theo thời gian + lọc theo loại bài.

## What Changes

- `CommunityFilterBar` (clone FacetSortBar): `SearchInput` keyword + `SegmentedControl` sort (Mới/Cũ nhất)
  + `SegmentedControl` lọc loại bài. Trên `CommunityFeed`.
- Raw runner `query-community-search.ts` (GraphQL `communitySearch`, mọi arg nullable) + hook
  `useQueryCommunitySearchSwr` (GATED: chỉ fetch khi có keyword/filter; debounce 300ms).
- `CommunityFeed`: gõ keyword/filter → chế độ search TOÀN CỤC (tất cả bài published) thay tab feed; xoá →
  về tab feed. i18n vi+en.

## Capabilities

### New Capabilities

- `community-search-ui`: tìm bài published theo keyword + sort thời gian + lọc loại bài trên trang community.

## Impact

- `components/features/community/{CommunityFilterBar,CommunityFeed,hooks/useQueryCommunitySearchSwr}`,
  `modules/api/graphql/queries/query-community-search.ts`, `messages/{vi,en}.json`. Cần BE
  `communitySearch` (repo FTES-AOS-Backend). Defer: author-picker (cần user-search typeahead) + group filter.
