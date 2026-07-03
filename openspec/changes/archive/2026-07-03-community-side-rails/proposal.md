# Proposal — community-side-rails

## Why

Trên desktop, cột feed 620px (change `community-threads-redesign`) để trống hai bên,
trong khi Trending / Bảng uy tín / Bình chọn / Kiểm duyệt bị chôn sau menu ⋯ và các
route rời. Lấp hai rail bằng chính các tính năng đó: điều hướng nhanh bên trái,
khám phá bên phải — không thêm data mới, tái dùng 3 hook mock có sẵn.

## What Changes

- **CommunityShell**: từ `xl` trở lên chuyển sang grid 3 cột
  `[240px · 620px · 280px]`; hai `<aside>` sticky, ẩn dưới `xl` (giữ nguyên trải
  nghiệm hiện tại + menu ⋯ làm lối vào).
- **Rail trái (nav)**: các hàng lối tắt — Đăng bài (mở modal composer), Bảng uy tín,
  Bình chọn, Kiểm duyệt.
- **Rail phải (khám phá)**: 3 panel — Xu hướng (top N, `useQueryTrendingSwr`),
  Bảng uy tín (top N, `useQueryContributorsSwr`), Bình chọn nhanh (`useQueryPollSwr`,
  vote tại chỗ như trang poll); mỗi panel có "Xem tất cả" về trang đầy đủ.

## Capabilities

### New Capabilities

- `community-side-rails`: hai rail desktop của trang community (nav + discovery).

## Impact

- FE-only; không hook mới, không đổi BE contract, không đổi feed/header/routes.
- i18n `communityHub.rail.*` (vi + en).
