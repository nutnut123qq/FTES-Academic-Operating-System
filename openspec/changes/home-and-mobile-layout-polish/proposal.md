# home-and-mobile-layout-polish — trang chủ trên điện thoại: hết lặp, hết tràn, cuộn được; thêm 9 link báo vào Thành tựu

> **Change hồi tố.** Code đã ship trong đợt 1 (2026-08-15); tài liệu viết SAU theo diff thật.

## Why

Duyệt trang chủ trên điện thoại, bốn chỗ hỏng theo bốn kiểu khác nhau:

1. **Khối hành trình đọc thành HAI LẦN.** Cột trái đã là stepper liệt kê đủ 5 chặng; cột phải, khi
   không có WebGL (mọi máy dưới `lg`), rơi về minh hoạ tĩnh liệt kê ĐÚNG 5 chặng đó — thành một
   danh sách dọc rồi một hàng icon+mũi tên bị bóp, chồng lên nhau.
2. **"Ưu đãi & chính sách" đẩy panel ra khỏi màn hình.** 8 chip tab xuống dòng thành khối 3 hàng
   lởm chởm; khung mockup của desktop có content box `aspect-video` 16:9 nên ở bề ngang điện thoại
   nó CẮT một nhóm ưu đãi 4 dòng.
3. **Bảng vàng tràn chữ ra ngoài viền.** Tên viết hoa ở `text-xl` rộng hơn thẻ podium khi lưới đi
   ba-cột từ `sm` (~190px nội dung), và dòng danh hiệu `whitespace-nowrap` ở `text-3xl` thì rộng hơn
   cả thẻ — thẻ là hộp `flex-col items-center` nên thứ không xuống dòng được thì thò hẳn ra ngoài.
4. **Rail môn học ăn hết bề ngang trên điện thoại.** Cột 16rem (thu lại còn 4rem cũng vậy) chiếm
   chỗ của nội dung tab.

Ngoài ra, thẻ thành tựu trên trang chủ chỉ có link tới bài đăng của FTES; **bằng chứng báo chí thật
thì không có ở đâu cả** — kể cả giải KNS Gia Lai vốn KHÔNG có bài đăng nào của FTES.

## What Changes

- **JourneyHero:** cột visual `hidden` dưới `lg`, `lg:block` trở lên. Node vẫn được MOUNT và chỉ ẩn
  bằng CSS, nên phần chữ fallback vẫn nằm trong HTML server-render cho crawler (ràng buộc SEO của
  spec cũ). Từ `lg` trở lên KHÔNG đổi gì.
- **OffersPolicySection:** dưới `lg` ẩn hẳn rail tab, 8 nhóm thành **strip vuốt ngang bằng CSS
  scroll-snap thuần** (`overflow-x-auto` + `snap-x snap-mandatory` trên track, `snap-center` từng
  thẻ) kèm hàng chấm vừa báo vị trí vừa đặt được vị trí. **Không thêm thư viện carousel.** Bỏ khung
  mockup ở nhánh mobile (chính nó cắt nội dung). Thân nhóm ưu đãi tách thành `OfferGroupBody` dùng
  chung cho tab desktop và thẻ mobile → hai bề mặt không thể lệch nội dung. Desktop `lg:` giữ
  nguyên tab rail + panel giữ-mounted (SEO).
- **GoldenBoard** (dùng chung bởi khối Bảng vàng ở trang chủ và trang `/goldenboard`): cho phép
  xuống dòng (`break-words`, `max-w-full`, `min-w-0`) và hạ một cỡ chữ dưới `md` (tên `text-lg`,
  danh hiệu `text-xl/2xl`); `whitespace-nowrap` của danh hiệu chỉ còn từ `md:`. Desktop giữ nguyên.
- **SubjectWorkspaceShell:** dưới `md` rail bị **loại khỏi layout** (không chỉ thu gọn), cùng các
  mục đó thành **tab strip cuộn ngang** (`TabsCard` ở `w-max` trong hộp `overflow-x-auto`) ghim trên
  nội dung. Nhãn giữ nguyên (không dùng chế độ icon-only của block, vì chế độ đó bỏ nhãn đúng ở
  breakpoint này). Strip là tab có điều khiển nên cần `activeKey`, rơi về `overview` khi đang ở
  trang ngoài rail.
- **AchievementsSection + content.ts:** thêm `press?: ReadonlyArray<PressLink>` vào `AchievementStat`
  và gắn **9 bài báo thật** — 5 bài cho giải "Thanh niên Gia Lai khởi nghiệp sáng tạo" (Báo Gia Lai
  ×3, Báo Mới, Thương hiệu & Truyền thông), 4 bài cho học bổng khởi nghiệp FPT (Đại học FPT,
  aFamily, CafeF ×2). `source` + `title` cố ý KHÔNG đưa vào i18n: đó là tên toà soạn và tiêu đề
  **đúng như đã đăng** — dữ liệu trích dẫn, dịch đi là trích sai. Chỉ nhãn khối ("Báo chí nói về
  FTES") mới qua i18n. Mỗi dòng `line-clamp-1` để thẻ 5 bài không cao hơn thẻ khác; link mở tab mới
  với `rel="noopener noreferrer"`.

## Impact

- Affected specs: `home-landing` (MODIFIED fallback hành trình + Ưu đãi; ADDED báo chí + tràn chữ
  Bảng vàng), `subject-workspace-ia` (ADDED tab strip mobile)
- Affected code: `HomeLanding/sections/{JourneyHero,OffersPolicySection,AchievementsSection}.tsx`,
  `HomeLanding/content.ts`, `goldenboard/GoldenBoard/index.tsx`,
  `subject/SubjectWorkspaceShell/index.tsx`, `messages/{en,vi}.json`
  (`homeLanding.achievements.press`, `homeLanding.offers.swipeAria`, `subject.navLabel`)
- Không đụng BE, không migration, không thêm dependency.
