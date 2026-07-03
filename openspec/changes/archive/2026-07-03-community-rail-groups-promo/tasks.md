# Tasks — community-rail-groups-promo

## 1. Nav rail

- [x] 1.1 `NavRail.tsx`: xóa nút "New post", import `PencilSimpleIcon` và
      `useCommunityComposerOverlayState`; thêm "Nhóm" lên đầu với `UsersThreeIcon`
      + `Link` tới `/groups`; giữ Reputation / Poll / Moderation.

## 2. ⋯ menu mirror

- [x] 2.1 `CommunityShell/index.tsx`: đổi `MENU_ITEMS` sang `{ key, href }` tuyệt đối;
      bỏ `newPost`, thêm `groups` → `/groups`; cập nhật `onPress` dùng `item.href`.
- [x] 2.2 Bọc `<NavRail />` + `<PromoBanner />` trong `<div className="flex flex-col gap-3">`
      bên trong aside trái.

## 3. Promo banner

- [x] 3.1 `useQueryCommunityPromoSwr.ts`: hook mock mới copy `useQueryPollSwr.ts`,
      export `CommunityPromo` { imageUrl, title, ctaText, linkUrl, sponsorName },
      ghi chú `// ponytail: mock BE` và điểm swap sang `useQueryActiveAdvertisementSwr`.
- [x] 3.2 `PromoBanner.tsx`: render panel ảnh + text theo idiom rail, return null khi
      không có data, phân biệt internal `Link` / external `<a>`.

## 4. i18n

- [x] 4.1 Thêm `communityHub.menu.groups` (vi/en) và `communityHub.promo.sponsored`
      (vi/en); xóa `communityHub.menu.newPost` vì không còn dùng.

## 5. Verify

- [x] 5.1 Parse lại `vi.json` + `en.json` hợp lệ.
- [x] 5.2 `npx tsc --noEmit` sạch.
- [x] 5.3 `npx eslint` sạch trên các file đã chạm.
- [x] 5.4 `npm run build` (webpack) exit 0.
