# Tasks

## 1. Compact Threads-style header
- [x] 1.1 Thay `ComposerTrigger` bằng `CommunityFeedHeader` (nhận state search/sort/postType) trong
      `CommunityFeed/index.tsx`, render 1 hàng: avatar · "Có gì mới?" · 🔍 · Đăng.
- [x] 1.2 Ô "Có gì mới?" dùng avatar THẬT của người dùng qua `UserAvatar` (Redux `user.user`:
      username/avatar/email), rơi về avatar sinh/chữ cái đầu cho khách.
- [x] 1.3 Bỏ `<CommunityFilterBar>` luôn-hiện khỏi luồng chính; giữ đường kẻ mảnh dưới header
      (qua `divide-y divide-separator` của khối cha).

## 2. Search/filter/sort → popover kính lúp
- [x] 2.1 Thêm nút icon 🔍 (`MagnifyingGlassIcon`, `isIconOnly`, `aria-label`) cùng hàng với Đăng.
- [x] 2.2 Bọc trong HeroUI `Popover` (`placement="bottom end"`), `Popover.Content` chứa
      `CommunityFilterBar` nối vào ĐÚNG state/handler search cũ (query/sort/postType).
- [x] 2.3 Chấm chỉ báo trên icon khi có từ khoá / loại bài / sort khác mặc định; `aria-label` đổi
      sang `search.openActive`.
- [x] 2.4 Bố cục lại `CommunityFilterBar` thành panel dọc; control loại bài (5 segment) cuộn ngang
      (`w-max` + `overflow-x-auto`) để không tràn popover trên mobile.

## 3. Mọi tab render post card đầy đủ
- [x] 3.1 `community/trending/page.tsx` → `<CommunityFeed tab="trending" />` (post card đầy đủ qua
      hook feed đã map `FeedTab.Trending`).
- [x] 3.2 Xoá `CommunityTrending/index.tsx` + `hooks/useQueryTrendingSwr.ts` (mã chết).

## 4. i18n + verify
- [x] 4.1 Thêm `communityHub.search.open` + `search.openActive` vào `en.json` + `vi.json` (mirror).
- [x] 4.2 `npx tsc --noEmit` sạch (0).
- [x] 4.3 `npm run build` (webpack) xanh.
- [x] 4.4 Cập nhật mock test `CommunityFeed/index.test.tsx` (Popover/UserAvatar/MagnifyingGlassIcon);
      `vitest run` xanh.
