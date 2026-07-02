## 1. Model + mock (group)

- [x] 1.1 `useQueryGroupsSwr.ts`: thêm `avatarUrl: string | null` + `coverUrl: string | null` vào `Group`; mock 5 group phủ đủ nhánh (≥1 đủ cả 2 ảnh, ≥1 chỉ avatar, ≥1 null cả 2; URL picsum deterministic theo id)
- [x] 1.2 `useQueryGroupSwr.ts`: thêm 2 field vào `GroupHeader` + mock header có ảnh; giữ comment `ponytail: mock BE`

## 2. Hiển thị group

- [x] 2.1 `GroupsList`: thêm avatar `size-10` đầu hàng tên mỗi card — HeroUI Avatar (img khi có `avatarUrl`, fallback initials `bg-accent/10 text-accent`); alt = `groupsHub.identity.avatarAlt`; img error → fallback
- [x] 2.2 `GroupDetailShell`: dựng identity header theo design D4 — cover `aspect-[2/1] sm:aspect-[3/1]` (`object-cover`, `rounded-large` trên, gradient `from-accent/20 to-accent/5` khi null / onError) + avatar `size-16 sm:size-20 ring-4 ring-background` overlap `-mt-8 sm:-mt-10`; name/chip/members + tab nav giữ nguyên
- [x] 2.3 Kiểm tra responsive: không tràn ngang ở <sm, overlap thẳng hàng cả 2 breakpoint

## 3. Upload (mock FE)

- [x] 3.1 Viết helper validate ảnh dùng chung (type ∈ png/jpeg/webp/gif, ≤5 MB) trả lỗi i18n key — đặt trong feature group (không chế block mới)
- [x] 3.2 `GroupCreate`: thêm avatar picker (`AvatarUploadButton` + input file ẩn) và cover picker (`ImageDropzone`); preview `URL.createObjectURL` + revoke khi đổi/unmount; nút bỏ ảnh; lỗi inline `identity.invalidType`/`identity.tooLarge`; submit vẫn no-op + comment swap-point presign (generate → PUT → verify — GIẢ ĐỊNH BE, chưa gọi mutation nào)
- [x] 3.3 `GroupManagement`: thêm section "Nhận diện nhóm" — 2 picker như 3.2, pre-seed từ `avatarUrl`/`coverUrl` hiện tại của group; save no-op + swap-point; KHÔNG gọi mutation avatar của profile

## 4. Community identity

- [x] 4.1 Hook mới `hooks/useQueryCommunityIdentitySwr.ts` (feature community): `{ name, avatarUrl, coverUrl, members }` mock, SWR key `["community-identity"]`, shape `{ identity, isLoading, error }`
- [x] 4.2 `CommunityShell`: thay title trần bằng identity header — cover `aspect-[4/1] sm:aspect-[5/1]` (gradient fallback + onError) + avatar `size-12` (initials fallback) + title; tab scopes + children giữ nguyên, KHÔNG banner per-scope

## 5. Skeleton

- [x] 5.1 `GroupDetailShell`: skeleton mirror header mới khi `isLoading || !group` (khối cover đúng ratio + `SkeletonAvatar` overlap + 2 dòng text) — bỏ initials "?" lúc loading; tab nav ngoài skeleton
- [x] 5.2 `GroupsList`: skeleton grid card (avatar tròn + dòng text) khi `isLoading`
- [x] 5.3 `CommunityShell`: skeleton header (cover ratio + avatar + title-line) khi identity loading; tabs vẫn render và bấm được

## 6. i18n + a11y

- [x] 6.1 Thêm `groupsHub.identity.*` (avatarLabel, coverLabel, avatarHint, coverHint, invalidType, tooLarge, avatarAlt, coverAlt, remove, uploadCta) vào `src/messages/vi.json` + `en.json`
- [x] 6.2 Thêm `communityHub.identity.{coverAlt,avatarAlt}` (template `{name}`) vào cả 2 file messages
- [x] 6.3 Rà a11y: mọi img identity có alt chứa tên; nút upload icon-only có `aria-label`; gradient fallback là div trang trí (không alt); không còn chuỗi hard-code

## 7. Verify

- [x] 7.1 `npx tsc --noEmit` sạch
- [x] 7.2 `npm run build` (webpack) xanh — build: batch-verified by orchestrator
- [x] 7.3 Soi nhanh dev: /groups (card avatar + fallback), /groups/g1 (cover + overlap + skeleton), /groups/new (2 picker + validate), /community (identity header) — cả vi lẫn en — soi tĩnh theo mock branches; dev run theo batch orchestrator
