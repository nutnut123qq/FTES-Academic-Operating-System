# Design — community-threads-redesign

## Context

Nghiên cứu Threads (token `--barcelona-*` đọc trực tiếp từ threads.com + teardown
Ahmad Shadeed): cột nội dung 572–620px; post = CSS Grid `48px minmax(0,1fr)` với avatar
36px; hairline #2D2D2D thay card; hàng action đơn sắc, count ẩn khi 0, đỏ #FF3040 chỉ
xuất hiện khi liked; composer = inline trigger "What's new?" mở modal; threadline nối
avatar post xuống replies. Nhà đã có: `PostEngagementBar`, `PostCommentThread`,
`ExtendedTabs`, overlay store (zustand) + `ModalContainer`, token OKLCH semantic.

## Goals / Non-Goals

**Goals**: cột đọc đơn tĩnh lặng; identity gọn; mọi trang community có lối vào; giữ
nguyên hook/data mock; light + dark đều đẹp bằng semantic token (không hardcode hex
Threads).

**Non-Goals**: không đổi BE contract; không làm Following/Campus feed thật; không đổi
ambient background (thuộc appearance settings toàn app); không redesign các trang
Trending/Reputation/Poll/Moderation (chỉ thêm lối vào).

## Decisions

1. **Map Threads → token nhà, không chép hex.** Nền = `bg-background`, hairline =
   `border-separator`/`divide-separator`, chữ phụ = `text-muted`, tim liked =
   `text-danger` (luật nhà: categorical → success/warning/danger/accent), threadline =
   `bg-separator`. Accent teal chỉ cho tab active + focus (một khoảnh khắc màu, đúng
   tinh thần "one accent moment").
2. **Tabs = `ExtendedTabs` (underline)**, thay hàng pill `Button` — sửa luôn vi phạm
   luật "Small 1-of-few selectors = Tabs, NEVER pill buttons". Threads web dùng
   dropdown tên feed, nhưng 4 scope của FTES cần discoverability → underline tabs là
   giao điểm đúng giữa Threads và luật nhà (`decision/tabs.md`).
3. **Header sticky mỏng** (`sticky top-0 z-10 bg-background/85 backdrop-blur`):
   avatar `size-6` + tên + members (ẩn members trên mobile) + tabs + Dropdown ⋯
   (Đăng bài / Bảng uy tín / Bình chọn / Kiểm duyệt). Cover banner bỏ khỏi shell;
   `CommunityIdentity.coverUrl` giữ trong type (BE sau này dùng cho trang about).
4. **Post row = block mới `ThreadsPostRow`** (`blocks/feed/ThreadsPostRow`, props-only):
   grid `grid-cols-[48px_minmax(0,1fr)]`, avatar 36px render qua slot/prop, children =
   engagement bar + comment thread từ feature. Feature `CommunityFeed` giữ data/hooks.
   Threadline = absolute `w-0.5 bg-separator` trong cột avatar, chỉ render khi
   comments mở (feed) hoặc luôn (detail có replies).
5. **Composer modal qua overlay store** đúng cannon (named `useCommunityComposerOverlayState`,
   đăng ký `OverlayKey`, mount trong `ModalContainer`). Nội dung form tách thành
   `CommunityComposerForm` để cả modal lẫn trang `/community/new` dùng chung.
6. **Zero-suppression opt-in** trên `PostEngagementBar` (`hideZeroCounts?: boolean`) —
   default false để các surface khác (subject, groups, articles) không đổi hành vi.
7. **Row click = navigate, action = stopPropagation** giữ nguyên pattern hiện tại
   (link là title + vùng body, KHÔNG bọc cả row trong `<Link>` nữa — tránh nested
   interactive; vùng press = title/body/khoảng trống, dùng `Link` phủ title + snippet).

## Risks / Trade-offs

- Bỏ cover banner = mất "khoảnh khắc thương hiệu" hub → chấp nhận, identity vẫn hiện
  (avatar + tên + members); cover có thể quay lại ở trang giới thiệu riêng.
- Sticky header + backdrop-blur trên nền có AmbientBackground: blur tốn GPU nhẹ —
  chấp nhận (Threads cũng blur 85% alpha); nếu lag thì hạ còn bg đặc.
- `PostComment.replies` đệ quy nhưng UI chỉ render 1 cấp — giữ nguyên, không đổi type.
