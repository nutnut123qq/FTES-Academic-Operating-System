# design/community.md — trang Cộng đồng (hub + feed + detail)

## Archetype & layout (2026-07-03 — change `community-threads-redesign`)

**Archetype: Threads single-column.** Cột đọc đơn `max-w-[620px] mx-auto` (đúng content-width
572–620px của Threads), KHÔNG rail phụ trong làn đọc. Cấu trúc:

1. **Sticky header mỏng** (`sticky top-16 z-10 bg-background/85 backdrop-blur border-b
   border-separator`): identity row (Avatar sm + tên semibold + `{count, number} thành viên`
   ẩn `<sm` + Dropdown ⋯ [Đăng bài / Bảng uy tín / Bình chọn / Kiểm duyệt]) + `ExtendedTabs`
   underline (Dành cho bạn / Đang theo dõi / Cơ sở / Xu hướng). **Cover banner bỏ hẳn** —
   `coverUrl` giữ trong model cho trang giới thiệu sau này.
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

**Backend business:** chưa có BE — toàn bộ mock SWR (`useQueryCommunityIdentitySwr`,
`useQueryCommunityFeedSwr`, `useQueryPostDetailSwr` + react/comment mutations optimistic,
transport error = local success). Swap point: giữ nguyên shape hook.
