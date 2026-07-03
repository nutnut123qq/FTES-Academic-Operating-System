# design/community.md — trang Cộng đồng (hub + feed + detail)

## Archetype & layout (2026-07-03 — change `community-threads-redesign`)

**Archetype: Threads single-column.** Cột đọc đơn `max-w-[620px] mx-auto` (đúng content-width
572–620px của Threads), KHÔNG rail phụ trong làn đọc. Cấu trúc:

1. **Header phẳng CHÌM vào trang** (`sticky top-16 z-10 bg-background/70 backdrop-blur`,
   KHÔNG viền dưới, KHÔNG nền card — đính chính `community-flat-header` 2026-07-03): thầy
   chốt trang này là **feed xã hội CHUNG** (mini social network kiểu Threads), **KHÔNG phải
   một cộng đồng cụ thể** → **bỏ HẲN identity** (avatar + tên "Cộng đồng FTES" + members) +
   xoá hook `useQueryCommunityIdentitySwr` + i18n `identity.*`/`members`. Header giờ chỉ còn
   1 hàng `justify-between`: `ExtendedTabs` underline (Dành cho bạn / Đang theo dõi / Cơ sở /
   Xu hướng) bên trái + Dropdown ⋯ bên phải `xl:hidden` (desktop dùng NavRail, ẩn ⋯ cho khỏi
   trùng). Blur nhẹ `/70` giữ để post cuộn dưới không lòi qua tabs; bỏ viền = hết cạnh "card"
   → tabs chìm vào trang. `capability community-identity` retire.
2. **Composer trigger** đầu feed: avatar + prompt "Có gì mới?" (plain button, `cursor-text`) +
   Button Đăng bài → mở modal `communityComposer` (overlay store + ModalContainer), form dùng
   chung với `/community/new` (`CommunityComposerForm`).
3. **Feed body = MỘT panel bo góc** (`rounded-3xl border border-separator bg-surface
   overflow-hidden`, đúng column-panel của Threads — thầy đính chính 2026-07-03 với
   screenshot Threads thật: body phải là 1 khối panel, không phải rows trần trên nền):
   composer trigger + mọi post row nằm TRONG panel, chia `divide-y divide-separator`,
   row `px-4 py-3` + hover wash `hover:bg-default/40`; link CHỈ phủ title+snippet (không
   bọc cả row — tránh nested interactive); engagement bar `hideZeroCounts`. **Text bài =
   chữ CHÍNH (foreground)**, title là dòng đầu weight medium, snippet KHÔNG muted —
   Threads đọc post như 1 khối text, không phải "tiêu đề + mô tả mờ" kiểu danh sách.
4. **Detail** cùng anatomy + threadline xuống vùng comments.

**Map Threads → token nhà (không chép hex):** nền `bg-background` · hairline
`border/divide-separator` · chữ phụ `text-muted` · tim liked `text-danger` · threadline
`bg-separator` · accent teal CHỈ ở tab active + focus ("one accent moment").

**Why:** trang cũ (cover 4:1 + pill-button tabs + hộp border per-post) nặng chrome, các trang
reputation/poll/moderation/new không có lối vào. Threads essence = calm column, monochrome,
suppress zero, composer modal. Tabs giữ underline (không dropdown như Threads web) vì 4 scope
cần discoverability + đúng luật nhà "1-of-few = Tabs, NEVER pill buttons".

## Side rails (2026-07-03 — change `community-side-rails`)

Thầy: *"2 bên trống đang thiếu"* → từ `xl` (1280px) shell thành grid
`[240px_minmax(0,620px)_280px] justify-center gap-6`, hai aside `sticky top-20`,
`hidden` dưới `xl` (menu ⋯ vẫn là lối vào). **Rail trái = NavRail** (lối tắt: Đăng bài
mở overlay composer + 3 Link Uy tín/Bình chọn/Kiểm duyệt, hàng icon+label). **Rail
phải = DiscoveryRail** — 3 panel cùng idiom `rounded-3xl border-separator bg-surface`
như feed panel, TÁI DÙNG nguyên 3 hook mock (trending top 4 → link post · contributors
top 3 · poll vote-tại-chỗ hiện % như trang poll) + "Xem tất cả" accent caret. Nguyên
tắc: rail = pure composition trên data có sẵn, KHÔNG hook/data mới; không lặp scope
tabs ở rail (đã ở header).

**Backend business:** chưa có BE — toàn bộ mock SWR (`useQueryCommunityIdentitySwr`,
`useQueryCommunityFeedSwr`, `useQueryPostDetailSwr` + react/comment mutations optimistic,
transport error = local success). Swap point: giữ nguyên shape hook.
