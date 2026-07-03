# Design — community-rail-groups-promo

## Quyết định

1. **Xóa "New post" khỏi rail:** composer overlay vẫn được feed trigger chỗ khác, nên
   nút này ở rail là redundant.
2. **Thêm "Nhóm" lên đầu rail:** `/groups` là route đã có sẵn, đặt ở đầu vì đây là
   đích di chuyển chính giữa community hub và group hub.
3. **MENU_ITEMS dùng href tuyệt đối:** các entry cũ `reputation/poll/moderation` ở dưới
   `/community`, còn `groups` ở `/groups`. Dùng `{ key, href }` giúp ⋯ menu không cần
   logic đặc biệt và tránh nhầm `/community/groups`.
4. **Promo banner mock + swap-point:** hiện tại BE chưa có placement cho community rail,
   nên dùng hook mock deterministic theo mẫu `useQueryPollSwr.ts`. Khi có BE, swap sang
   `useQueryActiveAdvertisementSwr({ placement: "community-rail" })` ở
   `src/hooks/swr/api/graphql/queries/useQueryActiveAdvertisementSwr.ts`.
5. **Promo UI:** panel cùng idiom với NavRail (`rounded-3xl border border-separator
   bg-surface`), ảnh `aspect-video` `object-cover`, text `p-3`, toàn panel là link.
   Sponsor hiển thị nhãn "Được tài trợ"/"Sponsored". Không hiển thị khung trống khi
   `promo == null`.

## Kỹ thuật

- **Màu sắc:** chỉ dùng semantic token Tailwind (`bg-surface`, `border-separator`,
  `text-foreground`, `text-muted`, `text-accent`), tự đúng cả dark/light.
- **Icon Phosphor:** luôn `aria-hidden focusable="false"` + `size-5` (trừ icon nhỏ
  trong promo dùng `size-4`).
- **Điều hướng:** internal dùng `Link` từ `@/i18n/navigation`; external URL dùng
  `<a target="_blank" rel="noopener noreferrer">`.
- **Vị trí file:** data-hook ở `features/community/hooks/`, presentational+data block
  ở `features/community/CommunityShell/` — đúng quy ước nhà.
- **i18n:** mọi chuỗi UI qua `useTranslations("communityHub")`, thêm key ở cả
  `vi.json` và `en.json`.
