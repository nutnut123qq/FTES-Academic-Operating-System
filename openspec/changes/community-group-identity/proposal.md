## Why

§6/§7 — các cộng đồng và group hiện **không có nhận diện hình ảnh**: group card và
group header chỉ render vòng tròn chữ cái đầu (`bg-accent/10`), CommunityShell chỉ có
title chữ. Yêu cầu của thầy: *"các cộng đồng, group cho phép có ảnh nền, đại diện"* —
group/cộng đồng phải mang **avatar (ảnh đại diện)** + **cover (ảnh nền/banner)** để có
bản sắc riêng, dễ nhận ra trong list và trong trang chi tiết, ngang chuẩn các nền tảng
cộng đồng (Facebook Groups, Discord, Reddit).

## What Changes

- **Model + mock:** thêm `avatarUrl: string | null` + `coverUrl: string | null` vào
  `Group` (`useQueryGroupsSwr`) và `GroupHeader` (`useQueryGroupSwr`); mock data có cả
  group CÓ ảnh lẫn group KHÔNG ảnh (để 2 nhánh fallback đều sống trên UI).
- **GroupsList:** mỗi group card hiện avatar của group (ảnh khi có, fallback initials
  giữ style `bg-accent/10` hiện tại khi null).
- **GroupDetailShell:** header nâng cấp thành **cover banner** (tỉ lệ cố định,
  fallback gradient accent khi null) + **avatar chồng mép** (overlap) lên banner,
  name/type/members giữ nguyên bên cạnh; skeleton mirror đúng layout mới.
- **GroupCreate + GroupManagement (tab quản lý):** thêm field upload avatar (nút tròn
  camera — block `AvatarUploadButton`) + upload cover (block `ImageDropzone`), validate
  loại file (PNG/JPEG/WebP/GIF) + kích thước (≤5 MB), preview tại chỗ qua
  `URL.createObjectURL`. Upload là **mock FE** theo pattern presign-url sẵn có của
  profile avatar (generate → PUT → verify) — chưa gọi BE thật, ghi giả định contract.
- **CommunityShell:** thêm identity header — cover banner + avatar cộng đồng + title
  (mock hook `useQueryCommunityIdentitySwr`), fallback gradient khi chưa có ảnh.
- **i18n:** key mới `groupsHub.identity.*` + `communityHub.identity.*` (vi/en) cho
  label upload, hint validate, lỗi, alt text.
- **A11y:** mọi ảnh identity có `alt` từ tên group/cộng đồng; cover thuần trang trí
  đánh dấu phù hợp; nút upload icon-only có `aria-label`.

Không có **BREAKING** — field mới nullable, UI cũ (initials) là nhánh fallback.

## Capabilities

### New Capabilities
- `group-identity`: avatar + cover cho Group — model/mock, hiển thị ở list card +
  detail header (kèm fallback, skeleton, responsive), form upload ở create/manage.
- `community-identity`: identity header (cover + avatar) cho Community hub shell,
  kèm fallback và skeleton.

### Modified Capabilities
- (none — `openspec/specs/` chưa có spec group/community nào; các thay đổi trên là
  capability mới, không sửa requirement đã chốt)

## Impact

- **FE only** (theo ranh giới CLAUDE.md): sửa
  `src/components/features/group/hooks/useQueryGroupsSwr.ts`,
  `hooks/useQueryGroupSwr.ts`, `GroupsList/`, `GroupDetailShell/`, `GroupCreate/`,
  `GroupManagement/`, `src/components/features/community/CommunityShell/`; thêm hook
  mock `useQueryCommunityIdentitySwr`; i18n `src/messages/{vi,en}.json`.
- **Tái dùng block nhà, không chế mới:** `UserAvatar` (reuseable),
  `AvatarUploadButton`, `ImageDropzone`, `AvatarGroup` (blocks/identity), `CoverImage`
  (blocks/media), `SkeletonAvatar`/`SkeletonCard` (blocks/skeleton), HeroUI
  `Avatar`/`Skeleton`/`Chip`/`Typography`.
- **Giả định BE (mock, chưa bịa API):** khi BE lands sẽ có presign flow cho group
  avatar/cover tương tự `GenerateAvatarPresignUrl`/`VerifyAvatarPresignUrl` của profile
  (minio, `buildMinioUrl`). FE để sẵn swap-point trong hook; hiện tại upload chỉ
  preview local + log.
- Build phải xanh: `npm run build` (webpack) + `tsc --noEmit`.
