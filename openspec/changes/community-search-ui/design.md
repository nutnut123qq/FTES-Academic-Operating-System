# Design
- Search mode GATED: SWR key null khi chưa có keyword/filter → tab feed giữ nguyên, idle không tốn fetch.
- Debounce 300ms keyword để không refetch mỗi phím.
- communitySearch args nullable → pass thẳng biến (không cần inline như feed.tab).
- Tái dùng FEED_SELECTION + toCommunityPost (export) → card mapping y hệt feed.
