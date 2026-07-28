# Nối đúng popover kết quả tìm kiếm cộng đồng (sort routing)

## Why
Trên trang cộng đồng, chọn sắp xếp **Cũ nhất (Oldest)** khi KHÔNG nhập từ khóa/bộ lọc lại
không có tác dụng: feed vẫn hiển thị theo tab thường (mặc định Mới nhất). Nguyên nhân: query
tab feed `feed(tab, page, campus)` KHÔNG nhận tham số `sort`, nên chỉ có cách route qua
`communitySearch` (nhận `sort`) mới honor được Newest/Oldest. Hàm `isSearchActive` cũ chỉ bật
chế độ search khi có keyword/type/author/group — bỏ sót chiều `sort`.

## What Changes
- `isSearchActive` coi **sort khác mặc định (Oldest)** là một chiều search đang bật → route
  qua `communitySearch` để honor sắp xếp. Newest là mặc định nên để nguyên (không keyword/lọc)
  vẫn giữ tab feed như cũ.
- Khớp với chấm "đã áp bộ lọc" ở header feed (vốn đã sáng khi `sort !== Newest`).
- Bổ sung unit test (gate `isSearchActive`) và integration test luồng search → popover.

## Impact
- Affected spec: `community-search-ui` (MODIFIED requirement)
- Affected code: `useQueryCommunitySearchSwr.ts` (+ tests). Không đổi BE/GraphQL.
