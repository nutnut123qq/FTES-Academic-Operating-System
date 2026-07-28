# Tasks

## 1. Sort routing
- [x] 1.1 `isSearchActive` tính thêm `criteria.sort !== CommunitySearchSort.Newest`
- [x] 1.2 Ghi chú lý do (tab feed không nhận `sort`, phải route qua `communitySearch`)

## 2. Tests
- [x] 2.1 Unit test gate `isSearchActive` cho trường hợp sort Oldest (không keyword)
- [x] 2.2 Integration test luồng search → popover (`searchWiring.integration.test.tsx`)

## 3. Verify
- [x] 3.1 `next build` xanh (Compiled + TypeScript + Generating static pages)
- [x] 3.2 `openspec validate community-search-popover-wiring --strict`
