# Proposal — community-flat-header

## Why

Trang community không phải một cộng đồng cụ thể mà là feed xã hội CHUNG (mini
social network kiểu Threads). Hàng identity (avatar + "Cộng đồng FTES" + số thành
viên) làm nó đọc như một Group Page — sai bản chất. Đồng thời dải header có nền +
viền dưới đọc như một "card/thanh" nổi trên trang; cần cho nó chìm vào trang để mượt.

## What Changes

- **Bỏ hẳn hàng identity** khỏi `CommunityShell` (avatar, tên, member count) và
  toàn bộ hook/mock/i18n identity — trang chỉ còn dải tab scope (For you / Following
  / Campus / Trending) + menu ⋯ cho các lối tắt (dưới `xl`; desktop đã có rail).
- **Dải tab chìm vào trang**: bỏ nền dạng card + viền dưới của header (giữ sticky +
  backdrop blur nhẹ để chữ khi cuộn vẫn đọc được), không còn cạnh "card".
- Xoá `useQueryCommunityIdentitySwr` (mồ côi) + i18n `communityHub.{identity.*,members}`.

## Capabilities

### Modified Capabilities

- `community-feed-threads`: header của shell = dải tab phẳng chìm vào trang, không
  identity (đảm bảo "không avatar/tên/members" nằm trong requirement flat-header).

### Removed Capabilities

- `community-identity`: RETIRE hẳn — feed xã hội chung không có identity hub. Spec
  `openspec/specs/community-identity/spec.md` bị xoá (không phải delta rỗng — tool
  cấm spec 0 requirement). Không consumer nào khác tham chiếu.

## Impact

- FE-only, không đổi BE contract. Feed panel + 2 rail giữ nguyên. Routes không đổi.
- Xoá 1 hook mock + vài i18n key dead. `aria-label` tablist vẫn dùng
  `communityHub.title`.
