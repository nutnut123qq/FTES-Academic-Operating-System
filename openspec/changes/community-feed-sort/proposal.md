# Bảng tin cộng đồng sắp đúng theo Mới nhất/Cũ nhất (feed honors sort)

## Why
Chọn **Mới nhất** trên bảng tin (tab mặc định For You) nhưng một bài CŨ có nhiều tương tác vẫn
đứng trước bài mới hơn. Nguyên nhân: query tab feed `feed(tab, page, campus)` KHÔNG nhận `sort`,
nên nút Newest/Oldest chỉ có tác dụng ở chế độ SEARCH toàn cục. Bản vá trước
(`community-search-popover-wiring`) "chữa cháy" bằng cách route sort-khác-mặc-định qua
`communitySearch` — nhưng đó là ĐỔI SCOPE (tab → toàn cục), và Newest (mặc định) thì vẫn hiển thị
theo thứ hạng tab (engagement/cá nhân hoá) chứ KHÔNG theo thời gian → sai nhãn "Mới nhất".

## What Changes
- Tab feed hook nhận `sort` và đưa vào SWR key + query `feed(..., sort)` → bảng tin honor
  Newest/Oldest NGAY TRÊN TAB HIỆN TẠI, không cần keyword.
- `isSearchActive` KHÔNG còn coi `sort` là chiều bật search (đảo ngược hack cũ) → đổi sort chỉ
  sắp lại feed tại chỗ, không nhảy sang search toàn cục. Search vẫn honor `sort` khi có keyword.
- Tab **Trending** ẩn nút Newest/Oldest (bản sắc Trending = engagement) — không no-op ngầm.

## Impact
- Affected specs: `community-search-ui` (MODIFIED), `community-feed-ui` (ADDED)
- Affected code: `useQueryCommunityFeedSwr.ts`, `query-community-feed.ts`, `CommunityFeed`,
  `CommunityFilterBar`, `useQueryCommunitySearchSwr.ts` (+ tests)
- Cần BE honor `feed(sort)` (change cùng tên `community-feed-sort` bên backend)
