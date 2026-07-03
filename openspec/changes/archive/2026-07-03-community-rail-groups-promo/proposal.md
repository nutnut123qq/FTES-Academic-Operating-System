# Proposal — community-rail-groups-promo

## Why

Rail điều hướng trái của Community hiện có nút "New post" mở composer overlay. Composer
đã có entry point chính trong feed (nút nổi / inline), nên "New post" ở rail là
duplicate và chiếm vị trí quý. Ngược lại, trang danh sách nhóm (`/groups`) đã tồn tại
nhưng chưa được liên kết từ hub Cộng đồng. Việc thay "New post" bằng "Nhóm" giúp rail
phản ánh đúng cấu trúc navigation của hệ thống. Panel quảng cáo ở dưới nav rail tận
dụng dead space để cross-promote nội dung/mốc học tập, có điểm swap rõ ràng sang ad
hook thật khi BE sẵn sàng.

## What Changes

- **`NavRail.tsx`:** xóa nút "New post" + import `useCommunityComposerOverlayState`
  khỏi file này; thêm dòng "Nhóm" lên đầu với `Link` tới `/groups` + `UsersThreeIcon`.
  Thứ tự cuối: Nhóm → Reputation → Poll → Moderation.
- **`CommunityShell/index.tsx`:** cập nhật `MENU_ITEMS` từ `{ key, segment }` sang
  `{ key, href }` với href tuyệt đối; bỏ `newPost`, thêm `groups` → `/groups`; giữ 3
  route cũ. Cấu trúc aside trái bọc `<NavRail />` và `<PromoBanner />` trong cột có
  `gap-3`.
- **`useQueryCommunityPromoSwr.ts`:** hook mock mới trong `features/community/hooks`,
  copy cấu trúc `useQueryPollSwr.ts`, trả `CommunityPromo` gồm `imageUrl`, `title`,
  `ctaText`, `linkUrl`, `sponsorName`. Ghi chú `// ponytail: mock BE` và điểm swap sang
  `useQueryActiveAdvertisementSwr({ placement: "community-rail" })`.
- **`PromoBanner.tsx`:** block mới trong `features/community/CommunityShell/`, render
  panel ảnh + text theo đúng idiom rail (`rounded-3xl border border-separator bg-surface`),
  ẩn sạch khi `promo == null`, xử lý cả internal `Link` lẫn external `<a>`.
- **i18n:** thêm `communityHub.menu.groups` và `communityHub.promo.sponsored` ở cả
  `vi.json` và `en.json`; xóa `communityHub.menu.newPost` vì không còn nơi nào dùng.

## Capabilities

### Modified Capabilities

- `communityHub`: navigation rail và ⋯ menu mirror phản ánh đúng các đích `/groups`,
  `/community/reputation`, `/community/poll`, `/community/moderation`; thêm promo slot
  dưới nav rail với mock data + điểm swap BE.

## Impact

- FE-only, 5 file source + 2 file i18n. Không đổi BE, không thêm dependency, không ảnh
  hưởng composer overlay ở các vị trí khác.
