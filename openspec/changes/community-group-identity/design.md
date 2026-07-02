## Context

Group UI (§7) và Community shell (§6) đang là skeleton on-canon, mock BE
("ponytail"):

- `GroupsList` — card grid tay (Link + border), KHÔNG avatar; chỉ name + chip type +
  description + members.
- `GroupDetailShell` — header là vòng tròn initials `size-12 rounded-large
  bg-accent/10 text-accent` + name + chip + members; dưới là tab nav. KHÔNG cover.
- `GroupCreate` — form name + native select type + textarea; submit no-op.
- `GroupManagement` — join requests / rules / pinned; chưa có mục sửa nhận diện.
- `CommunityShell` — chỉ `Typography h4` title + tab scopes (For You / Following /
  Campus / Trending). Scope là route segment, KHÔNG phải entity.
- Types: `Group { id, name, type, members, description }` trong
  `useQueryGroupsSwr.ts`; `GroupHeader { id, name, type, members }` trong
  `useQueryGroupSwr.ts`. Mock inline trong từng hook.

Hạ tầng ảnh ĐÃ CÓ trong repo (không cần chế):

- Display: `reuseable/UserAvatar` (fallback chain url → dicebear seed → initials,
  HeroUI Avatar), `blocks/media/CoverImage` (16:9, `object-cover`, lazy),
  `blocks/identity/AvatarGroup`.
- Upload UI: `blocks/identity/AvatarUploadButton` (nút tròn hover-dim + camera icon,
  UI-only — feature tự lo flow), `blocks/identity/ImageDropzone` (drag-drop,
  PNG/JPEG/WebP/GIF ≤5 MB, `onFile`).
- Upload flow (prior art profile avatar): `useMutateGenerateAvatarPresignUrlSwr`
  (`{ contentType } → { url, key }`) → PUT lên minio → `useMutateVerifyAvatarPresignUrlSwr`
  (`{ key } → { uploaded, url }`); public URL build bằng `buildMinioUrl`
  (`src/modules/api/minio/build.ts`).
- Skeleton: `blocks/skeleton/Skeleton/{Avatar,Card,ListRow,Typography}` + HeroUI
  `Skeleton`.

Ràng buộc: FE-only, mock BE; build webpack + tsc phải xanh; code mới theo canon
(`starci-fe-cannon-apply`); skeleton mirror layout thật (decision/skeleton.md).

## Goals / Non-Goals

**Goals:**
- Group mang `avatarUrl` + `coverUrl` (nullable) từ model → mock → UI list/detail.
- Detail header có cover banner + avatar chồng mép, đẹp cả khi group KHÔNG có ảnh.
- Create/manage có field chọn avatar + cover, validate loại/kích thước, preview local.
- Community hub có identity header (cover + avatar) cùng ngôn ngữ hình ảnh với group.
- Fallback initials/gradient nhất quán, skeleton mirror, i18n vi/en, a11y alt.

**Non-Goals:**
- KHÔNG upload thật lên BE (chưa có contract group presign — chỉ mock + swap-point).
- KHÔNG crop/zoom editor ảnh (v2); KHÔNG reposition cover kiểu Facebook.
- KHÔNG per-scope banner riêng cho từng tab community (chỉ 1 identity header cấp hub).
- KHÔNG đổi avatar THÀNH VIÊN trong GroupFeed/GroupMembers (đó là user identity,
  ngoài scope change này).

## Decisions

### D1 — Field name: `avatarUrl` + `coverUrl`, nullable, trên CẢ `Group` lẫn `GroupHeader`
`string | null` (không optional `?`) để mock buộc phải khai báo tường minh 2 nhánh
có/không ảnh — UI fallback được test bằng chính mock. Đặt trên cả 2 interface vì list
cần avatar, detail cần cả hai. Alternative bỏ qua: interface `GroupIdentity` chung —
quá sớm khi mới 2 field.

### D2 — Hiển thị avatar: tái dùng `UserAvatar`-style fallback nhưng GIỮ initials hiện tại
Group card + detail dùng HeroUI `Avatar` (`AvatarImage` khi có `avatarUrl`,
`AvatarFallback` = chữ cái đầu tên với style `bg-accent/10 text-accent` như hiện
trạng). KHÔNG dùng dicebear seed cho group (seed avatar là ngôn ngữ của USER identity;
group fallback = initials cho phân biệt). Card grid: avatar `size-10` bên trái hàng
tên. Detail: avatar `size-16 sm:size-20` viền `ring-4 ring-background` chồng mép cover.

### D3 — Cover banner: khối tay `aspect-[3/1]` (KHÔNG dùng `CoverImage` 16:9)
`CoverImage` bake 16:9 — đúng cho thumbnail media, SAI cho banner header (quá cao,
đẩy nội dung xuống). Banner group/community = `aspect-[3/1]` desktop, mobile cho phép
cao hơn chút (`aspect-[2/1] sm:aspect-[3/1]`), `object-cover`, bo `rounded-large`
phần trên, `overflow-hidden`. Khi `coverUrl` null → gradient fallback
`bg-gradient-to-r from-accent/20 to-accent/5` (không ảnh vỡ, không xám chết).
Alternative bỏ qua: sửa `CoverImage` nhận prop ratio — đụng block đang dùng nơi khác,
để change riêng nếu cần.

### D4 — Header detail: cover + avatar overlap bằng negative margin
Cấu trúc `GroupDetailShell`:

```
<div cover aspect-[2/1] sm:aspect-[3/1]>          ← ảnh hoặc gradient
<div className="-mt-8 px-4 sm:-mt-10 sm:px-6">    ← hàng identity kéo chồm lên
    <Avatar size-16/20 ring-4 ring-background/>
    <name + chip type + membersCount>              ← giữ markup hiện tại
</div>
<tab nav>                                          ← giữ nguyên
```

Overlap bằng `-mt-*` + `ring-background` (giả viền nền) — pattern chuẩn, không
absolute-positioning phức tạp. Tab nav và children giữ nguyên 100%.

### D5 — Upload: form state local, flow mock theo presign pattern, swap-point rõ
`GroupCreate` (và mục "Nhận diện nhóm" mới trong `GroupManagement`) giữ
`avatarFile: File | null` + `coverFile: File | null` trong state; preview qua
`URL.createObjectURL` (revoke khi đổi/unmount). Validate TRƯỚC khi nhận file: type ∈
{png,jpeg,webp,gif}, size ≤ 5 MB — sai thì báo lỗi inline i18n, KHÔNG nhận file.
`ImageDropzone` đã bake validate này cho cover; avatar dùng `AvatarUploadButton` +
`<input type="file" accept="image/*" hidden>` với cùng bộ validate. Submit vẫn no-op
(log), kèm comment `// ponytail: swap → generate<Group>PresignUrl → PUT → verify`
theo đúng prior art profile avatar. KHÔNG gọi mutation avatar của PROFILE cho group
(sai scope key — bịa API là vi phạm ranh giới).

### D6 — Community identity: hook mock `useQueryCommunityIdentitySwr` cấp hub
Community scope là route segment (không entity) → identity gắn ở CẤP HUB:
`useQueryCommunityIdentitySwr()` trả `{ name, avatarUrl, coverUrl, members }` mock
(SWR-shaped như các hook cộng đồng khác, key `["community-identity"]`).
`CommunityShell` render cover `aspect-[4/1] sm:aspect-[5/1]` (thấp hơn group — shell
chứa feed, đừng ăn viewport) + avatar `size-12` + title thay cho `Typography h4`
trần. Tab nav giữ nguyên. Alternative bỏ qua: per-scope banner — mỗi tab 1 ảnh là
noise, không có entity thật đứng sau.

### D7 — Skeleton mirror layout mới
- `GroupDetailShell` loading (`isLoading || !group`): HeroUI `Skeleton` khối cover
  đúng `aspect-[2/1] sm:aspect-[3/1]` + `SkeletonAvatar` (size khớp) chồng mép
  + 2 dòng `SkeletonTypography` — KHÔNG spinner, KHÔNG hiện initials "?" như hiện tại.
- `GroupsList` loading: grid `SkeletonCard` có hàng avatar tròn + 2 dòng text.
- `CommunityShell`: cover skeleton `aspect-[4/1] sm:aspect-[5/1]` + avatar + title.
- Chrome tĩnh (tab nav) KHÔNG nằm trong skeleton (đúng decision/skeleton.md).

### D8 — i18n + a11y
Key mới (vi/en, đủ cả hai file):
- `groupsHub.identity.{avatarLabel,coverLabel,avatarHint,coverHint,invalidType,tooLarge,avatarAlt,coverAlt,remove,uploadCta}`
- `communityHub.identity.{coverAlt,avatarAlt}`
`avatarAlt` dạng `"Ảnh đại diện của {name}"` / `"{name} avatar"`. Cover mang ảnh nội
dung → `alt` = `coverAlt` có {name}; gradient fallback là div trang trí (không img,
không alt). Nút upload icon-only bắt buộc `aria-label`.

## Risks / Trade-offs

- [Mock URL ảnh ngoài (unsplash/picsum) chết mạng → card trống] → dùng
  `https://picsum.photos/seed/<id>/...` deterministic + HeroUI Avatar tự rơi về
  fallback khi img error; cover onError → ẩn img, lộ gradient.
- [BE contract group presign có thể khác profile (thêm groupId, bucket key khác)] →
  không hard-code mutation nào; chỉ để swap-point comment + types local. Ghi rõ giả
  định trong tasks.
- [`next/image` cần whitelist remote domain trong next.config] → dùng `<img>` thường
  (như `CoverImage`/`UserAvatar` hiện tại) — nhất quán repo, khỏi đụng config.
- [Negative margin overlap lệch trên mobile] → scale bậc thang `-mt-8/size-16` (mobile)
  → `-mt-10/size-20` (sm+), test cả 2 breakpoint trong scenario responsive.
- [ObjectURL leak khi user đổi ảnh nhiều lần] → revoke URL cũ trong setter + cleanup
  effect.

## Migration Plan

FE-only, thuần additive: field nullable + nhánh fallback = hành vi cũ. Rollback =
revert commit (1 change = 1 commit). Khi BE lands: thay mock trong 2 query hook +
nối presign flow tại swap-point, spec không đổi.

## Open Questions

- BE có tách bucket/key riêng cho group assets hay dùng chung bucket avatar? (chờ
  contract — không chặn FE mock).
- GroupManagement "Nhận diện nhóm" có cần quyền owner/admin gate không? (hiện mock
  chưa có role của viewer; để mở, gate khi RBAC group lands).
