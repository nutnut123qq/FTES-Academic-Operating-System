# Tasks — community-side-rails

## 1. Shell + rails

- [x] 1.1 `CommunityShell`: grid 3 cột từ `xl` (`[240px_minmax(0,620px)_280px]`,
      justify-center, gap-6); 2 aside `hidden xl:block sticky top-20 self-start`.
- [x] 1.2 `CommunityShell/NavRail.tsx`: panel lối tắt (Đăng bài → overlay composer;
      Bảng uy tín / Bình chọn / Kiểm duyệt → Link) icon + label.
- [x] 1.3 `CommunityShell/DiscoveryRail.tsx`: 3 panel (Trending top 4 · Uy tín top 3 ·
      Poll vote tại chỗ) tái dùng hook có sẵn + link Xem tất cả.
- [x] 1.4 i18n `communityHub.rail.{trending,reputation,poll,seeAll}` (vi + en).

## 2. Verify

- [x] 2.1 `tsc --noEmit` + eslint sạch.
- [x] 2.2 `npm run build` (webpack) xanh.
- [x] 2.3 Preview: rail hiện ở ≥1280, ẩn dưới 1280; vote poll tại chỗ hiện %.
