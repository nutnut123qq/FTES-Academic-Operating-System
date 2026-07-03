# design/community.md — trang Cộng đồng (hub + feed + detail)

## Archetype & layout (2026-07-03 — change `community-threads-redesign`)

**Archetype: Threads single-column.** Cột đọc đơn `max-w-[620px] mx-auto` (đúng content-width
572–620px của Threads), KHÔNG rail phụ trong làn đọc. Cấu trúc:

1. **Header phẳng CHÌM vào trang** (`sticky top-16 z-10 bg-background` ĐẶC, KHÔNG blur,
   KHÔNG viền dưới, KHÔNG nền card — đính chính `community-flat-header` 2026-07-03; fix
   sượng: bỏ `/70`+`backdrop-blur` vì cho mưa ambient lòi qua, dùng nền đặc trùng màu trang
   như app navbar): thầy
   chốt trang này là **feed xã hội CHUNG** (mini social network kiểu Threads), **KHÔNG phải
   một cộng đồng cụ thể** → **bỏ HẲN identity** (avatar + tên "Cộng đồng FTES" + members) +
   xoá hook `useQueryCommunityIdentitySwr` + i18n `identity.*`/`members`. Header giờ chỉ còn
   1 hàng `justify-between`: `ExtendedTabs` underline (Dành cho bạn / Đang theo dõi / Cơ sở /
   Xu hướng) CANH GIỮA (`justify-center`, ⋯ `absolute inset-y-0 right-4` nên không đẩy lệch
   tabs) + Dropdown ⋯ `xl:hidden` (desktop dùng NavRail). Header `bg-background` ĐẶC (bỏ
   `/70`+blur — xem decision/tabs.md), KHÔNG viền → chìm khít màu trang.
   `capability community-identity` retire.
2. **Composer trigger** đầu feed: avatar + prompt "Có gì mới?" (plain button, `cursor-text`) +
   Button Đăng bài → mở modal `communityComposer` (overlay store + ModalContainer), form dùng
   chung với `/community/new` (`CommunityComposerForm`).
3. **Feed body = PHẲNG trên nền trang** (chỉ `flex flex-col divide-y divide-separator`,
   KHÔNG `bg-surface`/viền/bo góc — ĐÍNH CHÍNH 2026-07-03 lần 2): thầy chốt cuối cùng
   *"bỏ phần màu của card để chìm vào nền trang"*. **★ Gốc:** panel `bg-surface` ở LIGHT
   mode = trắng tinh `lab(99.99)` trên nền `bg-background` off-white `lab(96.5)` → nổi thành
   "card trắng vô duyên", bo góc 36px lòi dưới tabs (dark mode tương phản nhẹ nên bản panel
   trước lọt). Bỏ hẳn card → composer trigger + post rows nằm phẳng trên trang, chỉ hairline
   `divide-separator` ngăn. **Nguyên tắc: `bg-surface` vs `bg-background` chênh MẠNH ở light
   mode — feed đọc-liền-mạch nên nằm TRỰC TIẾP trên `bg-background`, hairline phân post, KHÔNG
   bọc `bg-surface` (để dành surface cho rail/card đứng riêng).** Row `px-4 py-3` + hover
   `hover:bg-default/40`; link CHỈ phủ title+snippet; engagement bar `hideZeroCounts`. **Text
   bài = foreground** (title dòng đầu weight medium, snippet KHÔNG muted).
4. **Detail** cùng anatomy + threadline xuống vùng comments.

**Map Threads → token nhà (không chép hex):** nền `bg-background` · hairline
`border/divide-separator` · chữ phụ `text-muted` · tim liked `text-danger` · threadline
`bg-separator` · accent teal CHỈ ở tab active + focus ("one accent moment").

**Why:** trang cũ (cover 4:1 + pill-button tabs + hộp border per-post) nặng chrome, các trang
reputation/poll/moderation/new không có lối vào. Threads essence = calm column, monochrome,
suppress zero, composer modal. Tabs giữ underline (không dropdown như Threads web) vì 4 scope
cần discoverability + đúng luật nhà "1-of-few = Tabs, NEVER pill buttons".

## Side rails (2026-07-03 — change `community-side-rails`)

Thầy: *"2 bên trống đang thiếu"* → từ `xl` (1280px) shell thành grid 3 cột, hai aside
`sticky top-20`,
`hidden` dưới `xl` (menu ⋯ vẫn là lối vào). **Rail trái = NavRail** (lối tắt: Đăng bài
mở overlay composer + 3 Link Uy tín/Bình chọn/Kiểm duyệt, hàng icon+label). **Rail
phải = DiscoveryRail** — 3 panel cùng idiom `rounded-3xl border-separator bg-surface`
như feed panel, TÁI DÙNG nguyên 3 hook mock (trending top 4 → link post · contributors
top 3 · poll vote-tại-chỗ hiện % như trang poll) + "Xem tất cả" accent caret. Nguyên
tắc: rail = pure composition trên data có sẵn, KHÔNG hook/data mới; không lặp scope
tabs ở rail (đã ở header).

**★ Canh giữa feed (fix "lệch trái dữ quá" 2026-07-03):** grid cột dùng
`[minmax(0,1fr)_minmax(0,620px)_minmax(0,1fr)]` (hai cột rìa `1fr` ĐỐI XỨNG, cap
`max-w-[1280px] mx-auto`) → feed 620px luôn nằm ĐÚNG TÂM grid → feed vào chính giữa page
ở mọi độ rộng (đo offset -7px = nửa scrollbar, ở 1024/1440/1920). **Nguyên tắc: muốn cột
giữa page-centered với 2 rail, ĐỪNG dùng cột rail width CỐ ĐỊNH LỆCH nhau** (`240px…280px`
→ feed lệch tâm + `max-w-1220` chật hơn tổng cột 1236 → nén feed + dịch trái); **dùng 2 cột
rìa `1fr` bằng nhau** — feed tự ở tâm bất kể nội dung rail (rail lấp đều 2 ô 1fr, ~282px @1440).

**★ GIỮ mưa sao băng trên /community (2026-07-03):** thầy muốn giữ hiệu ứng mưa. Có 1 nhịp
sai: tôi từng thấy "hình chữ nhật trắng" sau feed và tưởng do ambient mask (`4c9fb0f` mask mưa
khỏi dải giữa) → tắt ambient trên community. **SAI:** commit MỚI HƠN `b78ba85 "faint app-wide
meteors instead of gating/mask"` đã BỎ mask, mưa giờ MỜ-ĐỀU toàn app (không mask, không band).
"Rectangle" thầy thấy là trạng thái CŨ (mask era) / hoặc feed panel `bg-surface` trước khi làm
phẳng — không tái hiện với code hiện tại. Đã REVERT: `InnerLayout` giữ nguyên chỉ tắt ambient ở
`/learn`, community có mưa. Verify: community 40 meteor, phân bố cả giữa (10) lẫn rìa (30) =
đều, KHÔNG rectangle. **Bài học: đọc TRẠNG THÁI HIỆN TẠI của file (git log -- <file>) trước khi
chẩn đoán — đừng dựa vào 1 commit cũ đã bị commit sau thay thế.**

**Backend business:** chưa có BE — toàn bộ mock SWR (`useQueryCommunityFeedSwr`,
`useQueryPostDetailSwr`, trending/contributors/poll + react/comment mutations optimistic,
transport error = local success). Swap point: giữ nguyên shape hook. (Identity hook đã xoá
ở `community-flat-header` — feed xã hội chung, không identity.)
