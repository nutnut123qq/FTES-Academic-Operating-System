## Why

Khối "Thành tựu" ở home landing hiện chỉ là grid 6 ô số trơ (icon + "Top 100" + nhãn) —
**không ảnh, không bằng chứng**: người xem không có cách nào kiểm chứng FTES thật sự đạt
Techfest Top 100 hay giải KNSTGL. Trong khi đó website cũ (`Ftes-frontend`, khối
"Những gì chúng tôi đạt được") đã có sẵn **ảnh thật của 8 mốc** (`public/achiver/*`) kèm
**link bài đăng Facebook/báo** cho từng mốc — tài sản đã tồn tại nhưng chưa được port sang
AOS. Landing mất đi phần social-proof mạnh nhất mà công ty đang có.

## What Changes

- Khối `AchievementsSection` đổi từ **grid tĩnh 6 ô** → **carousel mốc thành tựu có ảnh**:
  mỗi slide = ảnh cover thật + chip năm + chip xếp hạng (giữ "Top 100"/"Top 4"/"100%") +
  tiêu đề + mô tả ngắn + link **"Xem chi tiết"** mở tab mới ra bằng chứng (Facebook/báo).
- **Nội dung tăng từ 6 → 10 mốc**: giữ đủ 6 key hiện có (`techfest`, `startupGiaLai`,
  `innovationQuest`, `knstgl`, `fptScholarship`, `aiAssistants`) + thêm 4 mốc mới port từ
  web cũ: `openDay`, `ttsg` (Tech Talent Showcase), `fundraising` (Gọi vốn lần 1), `demoDay`.
- **Ảnh**: copy 8 ảnh từ `Ftes-frontend/public/achiver/` sang `public/achievements/`, **nén
  lại** (≤1280px, JPEG q≈82) vì bản gốc quá nặng cho landing (`openday.jpg` 8.5 MB,
  `giai_3_knstgl.png` 3.5 MB — tổng ~16 MB).
- **Mốc không có ảnh** (`startupGiaLai`, `aiAssistants`) dùng **fallback**: khung tỉ lệ
  video với icon + gradient nhạt, KHÔNG bịa ảnh và KHÔNG âm thầm bỏ mốc.
- **Mốc không có link bằng chứng** (`ttsg`, `knstgl`, `aiAssistants`) chỉ đơn giản không
  render link — không dựng link giả `#`.
- **Không thêm dependency**: dùng hook nhà `useCarousel` (scroll-snap thuần, đã dùng ở
  `MentorTeamSection`/`CategoryShelf`) + block `MediaCard`. Web cũ dùng `react-slick`,
  **không port dep này**.

## Capabilities

### New Capabilities
<!-- không có capability mới -->

### Modified Capabilities
- `home-landing`: requirement **"Thành tựu FTES achievements section"** đổi hình thái từ
  grid card số tĩnh → carousel mốc có ảnh/năm/mô tả/link bằng chứng, và mở rộng danh sách
  mốc bắt buộc phủ (thêm Open Day, TTSG, Gọi vốn lần 1, Demo Day). Bản requirement gốc đến
  từ change chưa archive `home-landing-achievements-and-testimonials`.

## Impact

- **Code**: `src/components/features/home-landing/HomeLanding/sections/AchievementsSection.tsx`
  (viết lại thành carousel), `.../HomeLanding/content.ts` (type `AchievementStat` →
  mốc có `year`/`imageSrc`/`href`; danh sách 6 → 10).
- **i18n**: `src/messages/{vi,en}.json` — mỗi mốc thêm `title` + `description` (hiện chỉ có
  `label`), thêm chuỗi điều khiển carousel (`regionLabel`, `prev`, `next`, `goToSlide`,
  `viewDetail`) theo đúng bộ key mà `mentors.*` đã dùng.
- **Assets**: thêm `public/achievements/*.jpg` (8 file đã nén, kỳ vọng tổng < 1.5 MB).
- **Không đụng**: BE/API (khối 100% static), `PlatformStatsSection` (số liệu live),
  `HonorBoardSection` (bảng vàng học viên) — không trùng số nào.
- **Dependencies**: không thêm/bớt package.
