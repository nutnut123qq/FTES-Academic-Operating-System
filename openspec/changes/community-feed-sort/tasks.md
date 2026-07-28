# Tasks

## 1. Tab feed honor sort
- [x] 1.1 `query-community-feed.ts`: thêm biến `$sort: SortOrder` (nullable, tránh quirk 401)
- [x] 1.2 `useQueryCommunityFeedSwr(tab, sort)`: sort vào SWR key + truyền xuống query
- [x] 1.3 `CommunityFeed` truyền `sort` vào hook; Trending ép Newest + ẩn control

## 2. Sort không còn ép search
- [x] 2.1 `isSearchActive` bỏ chiều `sort !== Newest`
- [x] 2.2 `CommunityFilterBar` nhận `showSortControl` (ẩn ở Trending)

## 3. Tests + Verify
- [x] 3.1 Cập nhật unit test key-factory + `isSearchActive`
- [x] 3.2 `tsc --noEmit` sạch + `next build` (webpack) xanh
- [x] 3.3 `openspec validate community-feed-sort --strict`
