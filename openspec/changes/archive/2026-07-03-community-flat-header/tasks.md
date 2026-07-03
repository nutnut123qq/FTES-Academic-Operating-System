# Tasks — community-flat-header

## 1. Shell

- [x] 1.1 `CommunityShell`: bỏ block identity (avatar/tên/members) + skeleton + hook
      `useQueryCommunityIdentitySwr`; header = 1 hàng `justify-between` [ExtendedTabs |
      ⋯ menu `xl:hidden`]; class header bỏ `bg-background/85` + `border-b`, còn
      `sticky top-16 z-10 bg-background/70 backdrop-blur px-4 pt-3`.
- [x] 1.2 Xoá file `hooks/useQueryCommunityIdentitySwr.ts`.
- [x] 1.3 Xoá i18n `communityHub.identity.*` + `communityHub.members` (vi + en).

## 2. Verify

- [x] 2.1 `tsc --noEmit` + eslint sạch.
- [x] 2.2 `npm run build` (webpack) xanh.
- [x] 2.3 Preview: header không còn identity, không viền/nền card; tabs + ⋯ đúng;
      ⋯ ẩn ở xl.
