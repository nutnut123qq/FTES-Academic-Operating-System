## Context

`AchievementsSection` (home landing, slot giữa `PlatformStatsSection` và `OffersPolicySection`)
hiện render grid 6 card tĩnh: icon phosphor + chuỗi highlight (`Top 100`, `100%`) + nhãn i18n.
Dữ liệu ở `HomeLanding/content.ts` (`ACHIEVEMENTS: Array<{key, value}>`), nhãn ở
`messages/{vi,en}.json → homeLanding.achievements.items.<key>.label`.

Website cũ `Ftes-frontend` có 2 khối riêng biệt cho cùng chủ đề:
1. `achiverProject/index.tsx` — "Thành tựu": 3 card icon + link "Chi tiết" (framer-motion).
2. `achiverProject/sliderAchiverComponent.tsx` — **"Những gì chúng tôi đạt được"**: slider
   `react-slick` 3-up, 8 mốc, mỗi mốc **ảnh thật** (`public/achiver/*`) + badge năm + mô tả
   + link "Read Story →" ra Facebook. ← đây là bản được chọn để port (title khớp đúng
   `homeLanding.achievements.title` hiện tại của AOS).

Ràng buộc:
- Khối 100% static, không BE (giữ nguyên tính chất hiện tại, luôn crawlable).
- Nhà đã có hook carousel: `blocks/carousel/useCarousel` (scroll-snap thuần, autoplay pause
  hover/focus/hidden-tab, tắt hẳn khi `prefers-reduced-motion`) và block card `MediaCard`.
- Ảnh gốc rất nặng: `openday.jpg` 8.5 MB, `giai_3_knstgl.png` 3.5 MB, `ttsg.png` 1.8 MB,
  `innovationquest.jpg` 1.0 MB — tổng ~16 MB, không thể đưa nguyên vào landing.
- 2 mốc trong danh sách AOS hiện tại **không có ảnh** ở web cũ: `startupGiaLai` (Top 4 Gia Lai
  — web cũ để ở khối 3-card, chỉ có link báo) và `aiAssistants` (không phải mốc sự kiện).

## Goals / Non-Goals

**Goals:**
- Mỗi thành tựu có **bằng chứng xem được**: ảnh thật + link bài đăng gốc (Facebook/báo).
- Giữ nguyên **mọi nội dung hiện có** (6 key) khi thêm 4 mốc mới → 10 mốc, không mất mục nào.
- Tái dùng primitive nhà (`useCarousel`, `MediaCard`, HeroUI `Chip`/`Link`/`Typography`),
  **không thêm dependency**, không hand-roll `<div border>`/`<button hover:bg>`.
- A11y theo WAI-ARIA carousel pattern như `MentorTeamSection` đã làm (region có nhãn,
  ArrowLeft/Right, dots `aria-current`, `aria-live` off khi autoplay).
- Giữ nhịp section của landing: `max-w-6xl` · `py-16` · heading `mb-10` (eyebrow + title).

**Non-Goals:**
- KHÔNG port `react-slick` / `slick-carousel` CSS (web cũ dùng, AOS không cần).
- KHÔNG dựng lightbox/gallery xem ảnh full — click ảnh đi thẳng bài gốc là đủ.
- KHÔNG đưa số liệu live (khoá học/học viên) vào đây — đã có `PlatformStatsSection`.
- KHÔNG port khối "Học viên CHẤT cỡ nào" của web cũ (AOS đã có `HonorBoardSection`).
- KHÔNG đổi vị trí khối trong landing.

## Decisions

### D1. Carousel = `useCarousel` scroll-snap, KHÔNG react-slick
Hook nhà đã có sẵn mọi thứ cần (index theo scroll, next/prev wrap, autoplay pause
hover/focus/hidden, reduced-motion). Port `react-slick` sẽ thêm 2 package + 2 file CSS global
và một hệ arrow/dots riêng, lệch hẳn khỏi hệ carousel đang dùng ở catalog + mentors.

### D2. Track kiểu "shelf" nhiều card/viewport (như `CategoryShelf`), KHÔNG 1 slide full-width
Web cũ hiện 3 card/lượt (`slidesToShow: 3` → 2 → 1 theo breakpoint). Với 10 mốc, mỗi slide
full-width (kiểu `MentorTeamSection`) sẽ cần 10 lần bấm để xem hết. Chọn slide **fixed-width**
`snap-start` (`w-[17rem] sm:w-[19rem]`) trong track `overflow-x-auto` → responsive tự nhiên
(1 card ở mobile, 3–4 ở desktop) mà không cần `responsive` config. `useCarousel` đã hỗ trợ
đúng dạng này (docstring nói rõ: "Slides may be full-track-width … or fixed-width cards").

### D3. Autoplay BẬT (~4.5 s), giống web cũ
`CategoryShelf` tắt autoplay vì là shelf công cụ (người dùng đang chủ động tìm khoá học);
khối này là **social proof trên landing** — web cũ autoplay 4 s. Chọn `4_500` ms: đủ chậm để
đọc tiêu đề + mô tả 2 dòng. Hook tự pause hover/focus/tab-hidden và tắt hẳn khi reduced-motion,
nên autoplay không gây khó chịu.

### D4. Card = `MediaCard` (block nhà), link đặt ở `footer` — KHÔNG dùng prop `href` của card
`MediaCard` bọc cả card thành `<a href>` nhưng **không nhận `target`/`rel`**, còn bằng chứng là
link **ngoài** (Facebook/báo) nên phải `target="_blank" rel="noopener"`. Vì vậy card để
non-interactive, `footer` = HeroUI `Link` "Xem chi tiết →" (đúng idiom `mentors.viewProfile`
đã có trong landing). Tránh luôn nested-anchor (link trong link) nếu vừa set `href` card vừa
có link trong footer. Mốc không có bằng chứng → không render footer, card thành thẻ tĩnh.

### D5. Ảnh: copy + nén sang `public/achievements/`, dùng `<img loading="lazy">`
Nén xuống ≤1280 px chiều ngang, JPEG q82 (tổng kỳ vọng < 1.5 MB thay vì 16 MB). Đặt ở
`public/achievements/` (theo lối `public/landing/*`), tên kebab-case (`open-day.jpg`,
`goi-von-lan-1.jpg` — bỏ tên gốc có **dấu cách** `goi_von_lan _1.jpg`, dễ vỡ URL).
Dùng `<img>` thay `next/image`: toàn bộ landing hiện dùng `<img>` (`MediaCard` README cũng
vậy), ảnh đã nén sẵn nên lợi ích optimizer không bù cho việc lệch convention.
`cover` = `<img className="aspect-video w-full object-cover">` đúng usage của `MediaCard`.

### D6. Mốc thiếu ảnh → fallback icon, KHÔNG bịa ảnh, KHÔNG bỏ mốc
`startupGiaLai` và `aiAssistants` render cover fallback: khung `aspect-video` với
`bg-accent/10` + icon phosphor của mốc (giữ đúng icon map hiện có). Giữ mốc lại vì
`startupGiaLai` là giải thật (có link báo) và `aiAssistants` đang nằm trong requirement hiện
hành; loại chúng đi sẽ là âm thầm thu hẹp nội dung.

### D7. Badge năm OVERLAY trên ảnh (như web cũ) + chip xếp hạng ở `meta`
Không bỏ dữ liệu xếp hạng đang có (requirement hiện hành bắt buộc in verbatim, không
count-up). Bản đầu đặt cả 2 chip vào slot `meta`; sau khi so với ảnh chụp web cũ (thầy gửi),
chỉnh lại cho **giống bản gốc**: badge năm nằm **trên ảnh** (`absolute bottom-3 left-3`,
bọc cover trong `div.relative`), chip xếp hạng ("Top 100"/"100%") ở `meta` dưới tiêu đề.
Badge dùng `bg-accent text-accent-foreground` thay vì `red-primary` của web cũ để giữ palette
AOS. Mốc không có xếp hạng (`openDay`, `ttsg`, `fundraising`, `demoDay`) chỉ có badge năm.

### D9. Mũi tên prev/next đặt 2 BÊN track, ẩn trên phone (như web cũ)
Web cũ để 2 nút tròn nổi 2 bên slider (giữa chiều cao). Bản đầu đặt hàng nút dưới track theo
idiom `MentorTeamSection`; chỉnh lại thành `absolute -left-3/-right-3 top-1/2` trên region
`relative` cho khớp bản gốc. Ẩn dưới `sm` (`hidden sm:flex`): trên phone swipe native là cử
chỉ chính, nút nổi chỉ che mất ảnh. Bỏ dãy dots (10 mốc thì dots vô dụng — web cũ cũng tắt).

### D10. Số card/viewport khớp breakpoint web cũ: 1 → 2 → 3
Web cũ `slidesToShow: 3` (≥1024) → 2 (≥768) → 1. Với scroll-snap không có prop `responsive`,
làm bằng width tính theo phần trăm trừ gap: `w-[17rem]` (phone) ·
`sm:w-[calc(50%-0.375rem)]` · `lg:w-[calc(33.333%-0.5rem)]` với `gap-3` (0.75rem).

### D8. i18n: mỗi mốc thêm `title` + `description`, giữ `label` cũ làm `title`
Hiện chỉ có `label` (vd "Startup xuất sắc · Techfest Vietnam 2025"). Cấu trúc mới:
`items.<key>.{title, description}` — `title` lấy từ `label` cũ (giữ nguyên bản dịch đã có),
`description` là 1–2 câu port từ web cũ (dịch sang en cho `en.json`). Thêm nhóm chuỗi điều
khiển `achievements.{regionLabel, prev, next, goToSlide, viewDetail}` **trùng tên** với bộ
`mentors.*` đang có để nhất quán.

## Risks / Trade-offs

- **Ảnh nén quá tay làm mờ chứng nhận/bằng khen** (ảnh KNSTGL là ảnh giấy khen có chữ) →
  giữ 1280 px + q82 (không xuống 800 px), và link "Xem chi tiết" luôn dẫn tới bài gốc có ảnh
  gốc; kiểm mắt sau khi nén bằng screenshot preview.
- **10 mốc dài hơn 6 ô** → trang cao hơn; giảm nhẹ bằng track ngang (chiều cao không đổi so
  với grid 2 hàng cũ, thực tế còn thấp hơn) và mô tả clamp 2 dòng của `MediaCard`.
- **Link Facebook có thể chết/đổi quyền riêng tư** (link `share/p/...` do người khác đăng) →
  link là `target="_blank" rel="noopener"`, mất link chỉ mất footer 1 card, không vỡ khối;
  ảnh vẫn ở local nên bằng chứng hình không phụ thuộc Facebook.
- **Autoplay ngang trên mobile có thể cướp scroll dọc** → track dùng `overflow-x-auto`
  scroll-snap native (không giữ touch dọc), autoplay chỉ gọi `scrollTo` trên chính track;
  hook đã pause khi tab hidden. Cần kiểm tay ở viewport 375 px.
- **Ảnh nặng nếu nén thất bại im lặng** → task verify bắt buộc in kích thước từng file sau
  nén và so tổng < 1.5 MB, không tin "đã nén".

## Migration Plan

Thuần FE static, không migration dữ liệu: đổi `content.ts` + section + i18n + thêm assets
trong 1 commit. Rollback = revert commit (ảnh mới nằm trong cùng commit). Không cờ tính năng
(khối marketing tĩnh, không rủi ro runtime).

## Open Questions

- Mô tả cho `startupGiaLai` / `aiAssistants` (2 mốc không có mô tả ở web cũ) sẽ viết mới
  ngắn gọn từ nhãn hiện có — nếu marketing có bản copy chuẩn thì thay sau, không chặn.
