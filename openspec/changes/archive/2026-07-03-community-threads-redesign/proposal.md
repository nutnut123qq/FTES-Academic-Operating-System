# Proposal — community-threads-redesign

## Why

Trang community hiện tại chán từ UX đến UI: banner cover 4:1 nặng nề chiếm nửa màn đầu,
tabs là hàng pill `Button` (vi phạm luật nhà "không pill-button row"), mỗi post là một
hộp border rời rạc, các trang Uy tín / Bình chọn / Kiểm duyệt / Đăng bài không có lối
vào nhìn thấy được. Redesign theo tinh túy Threads (nghiên cứu token thật từ threads.com
2026-07-03): cột đọc đơn ~620px, hairline divider thay card, hàng action đơn sắc ẩn số 0,
composer inline mở modal, threadline nối avatar xuống bình luận.

## What Changes

- **CommunityShell**: bỏ cover banner + avatar đè mép; thay bằng header mỏng sticky
  (avatar sm + tên + số thành viên · tabs gạch chân `ExtendedTabs` · menu ⋯ dẫn tới
  Uy tín / Bình chọn / Kiểm duyệt). Cột nội dung cap ~`max-w-[620px]`.
- **CommunityFeed**: bỏ hộp border per-post; feed = 1 cột chia hairline (`divide-y
  divide-separator`). Post row = grid `[48px,1fr]` (avatar cột trái, nội dung phải),
  tên semibold + thời gian tương đối muted cùng hàng, body 15px/1.4, hàng action
  đơn sắc (đếm số ẩn khi 0, tim đỏ danger khi liked). Threadline nối avatar xuống
  vùng bình luận inline khi mở.
- **Composer trigger**: hàng "Có gì mới?" (avatar + ghost prompt + nút Đăng) trên đầu
  feed, mở modal composer (overlay store + ModalContainer); modal tái dùng nội dung
  CommunityComposer. Route `/community/new` giữ nguyên làm fallback.
- **CommunityPostDetail**: cùng anatomy grid; bình luận nối threadline từ avatar post.
- **PostEngagementBar**: thêm chế độ ẩn count khi 0 (zero-suppression) — opt-in prop,
  các surface khác không đổi.

## Capabilities

### Modified Capabilities

- `community-identity`: identity hub chuyển từ cover banner 4:1 sang compact header row
  sticky (avatar + tên + members). Cover URL vẫn trong data model, không render ở shell.
- `post-engagement`: engagement bar hỗ trợ zero-count suppression (community surfaces).

### New Capabilities

- `community-feed-threads`: post anatomy kiểu Threads (grid cột avatar, hairline
  divider, threadline, composer trigger + modal).

## Impact

- FE-only, mock data giữ nguyên các hook SWR hiện có. Không đổi contract BE.
- Routes không đổi; `/community/new` giữ. Trending/Reputation/Poll/Moderation giữ trang,
  thêm lối vào từ menu ⋯.
- i18n `communityHub.*` thêm keys (vi + en): whatsNew, members, more menu.
