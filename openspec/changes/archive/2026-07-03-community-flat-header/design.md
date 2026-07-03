# Design — community-flat-header

## Context

Sau `community-threads-redesign` + `community-side-rails`, shell có: header sticky
(identity row + tabs + ⋯) `bg-background/85 backdrop-blur border-b`, feed panel bo
góc, 2 rail desktop. Thầy: đây là feed xã hội CHUNG (Threads), không phải 1 cộng
đồng → bỏ identity; và header đọc như card → cho chìm vào trang.

## Goals / Non-Goals

**Goals**: header tối giản = chỉ dải tab (chìm vào trang) + ⋯ (dưới xl); bỏ sạch
identity concept.

**Non-Goals**: không đụng feed panel, 2 rail, routes, các trang con. Không thêm
data.

## Decisions

1. **Bỏ identity hoàn toàn**: xoá block avatar/tên/members + skeleton của nó + hook
   `useQueryCommunityIdentitySwr` (mồ côi, không ai khác import) + i18n
   `communityHub.identity.*` và `communityHub.members`. Capability `community-identity`
   retire (feed chung không có identity hub).
2. **Header "chìm vào trang"**: bỏ `bg-background/85` + `border-b border-separator`;
   giữ `sticky top-16` + `backdrop-blur` với nền rất nhẹ `bg-background/70` (KHÔNG
   viền). Lý do giữ blur nhẹ: nền có AmbientBackground (mưa) + feed cuộn dưới header
   — trong suốt hoàn toàn sẽ để post lòi qua dải tab. `bg-background/70 backdrop-blur`
   = cùng màu trang nên không đọc như card (không cạnh/viền), vẫn legible khi cuộn.
   ponytail: một dòng đổi class, bỏ viền là đủ "hết card".
3. **Layout header mới**: một hàng `flex items-center justify-between` — `ExtendedTabs`
   bên trái, ⋯ menu bên phải `xl:hidden` (desktop đã có NavRail nên ẩn để khỏi trùng).
4. **Giữ `aria-label` tablist = `communityHub.title`** ("Cộng đồng") cho screen reader
   dù không hiện chữ.

## Risks / Trade-offs

- Retire `community-identity`: nếu sau này cần "trang giới thiệu cộng đồng" thì dựng
  lại — chấp nhận (YAGNI, đang là feed chung).
- Header trong suốt/blur nhẹ trên ambient: nếu vẫn thấy lòi khi cuộn thì tăng nền
  lên `/85` — một số nhỏ, dễ chỉnh.
