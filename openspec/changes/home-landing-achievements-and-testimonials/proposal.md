# Proposal — home-landing-achievements-and-testimonials

## Why

Ba điểm trên trang chủ landing còn yếu sau đợt honor-board:

- **Mascot chào ở đỉnh hero** chiếm chỗ như một banner áp đảo, đẩy tiêu đề/eyebrow
  xuống dưới, làm loãng thông điệp mở đầu.
- **Section "Inside the journey / What each stage gives you"** (`ModuleShowcaseSection`)
  chỉ là 3 card mô tả trừu tượng "mỗi chặng cho bạn gì" — trùng ý với chính scene
  hành trình ngay phía trên, không mang bằng chứng thật về FTES.
- **`MentorTeamSection`** chỉ khoe đúng một founder → trông mỏng, thiếu tiếng nói của
  cả đội ngũ; trong khi legacy Ftes frontend có sẵn 5 mentor kèm quote thật.

Đồng thời repo đang có 3 bản `useCarousel` gần trùng nhau (hero slider + category shelf
cùng import từ `FeaturedSlider/useCarousel.ts`) — nên nâng cấp thành một block primitive
dùng chung khi thêm carousel thứ ba (testimonials).

## What Changes

- **Mascot sign-off:** `HomeMascotGreeting` chuyển từ đỉnh cột text hero xuống **dưới
  stage stepper**, size `md` → `sm` — đọc như lời chào kết thân thiện (hero chrome),
  không còn là banner ở đầu trang.
- **Thành tựu thay Module showcase:** bỏ `ModuleShowcaseSection` (3 card "what each
  stage gives you"), thay bằng `AchievementsSection` — 6 giải thưởng/cột mốc THẬT của
  FTES port từ legacy home (Techfest VN 2025 Top 100, Startup Gia Lai Top 4, Innovation
  Quest Top 30, KNST Gia Lai Top 3, học bổng khởi nghiệp FPTU 100%, 5 AI assistant).
  Là **award card** (headline giải thưởng dạng chuỗi "Top 100" / "100%" + nhãn), KHÔNG
  phải KPI đếm số — cố ý không trùng số liệu với `PlatformStatsSection` (đếm live) hay
  `HonorBoardSection` (bảng vàng học viên).
- **Đội ngũ FTES thành testimonials CAROUSEL:** `MentorTeamSection` dựng lại thành
  carousel 5 mentor thật (founder Nguyễn Anh Khoa + đội ngũ), mỗi slide là quote card +
  byline (avatar · tên · vai trò · social · link profile). Dùng lại hook nhà `useCarousel`
  (native CSS scroll-snap, KHÔNG dependency): tự chạy ~6s, prev/next + dots, wrap 2 đầu,
  pause khi hover/focus-within/tab ẩn/`prefers-reduced-motion`, theo WAI-ARIA carousel.
- **`useCarousel` lên block dùng chung:** move `FeaturedSlider/useCarousel.ts` →
  `src/components/blocks/carousel/useCarousel.ts`; hero slider + category shelf +
  testimonials cùng import từ đây (thêm option `intervalMs` để testimonials chạy chậm hơn).
- **i18n:** thêm `homeLanding.achievements.*` và `homeLanding.mentors.quotes.*`
  (+ nhãn điều khiển carousel: `regionLabel/prev/next/goToSlide/viewProfile`) ở
  `src/messages/{en,vi}.json`; bỏ key `mentors.founder` / `mentors.blog` cũ.

## Capabilities

### New Capabilities

- `home-landing`: (a) section "Thành tựu FTES" thay chỗ section stage-cards; (b) section
  đội ngũ là carousel testimonials tự chạy có prev/next + dots + pause-on-hover + wrap +
  a11y; (c) mascot greeting đặt làm hero sign-off (không phải banner đỉnh trang).

## Impact

- FE-only. Source chạm: `HomeLanding/{index.tsx,content.ts}`, sections
  `JourneyHero.tsx` · `HomeMascotGreeting.tsx` · `AchievementsSection.tsx` (mới) ·
  `MentorTeamSection.tsx`; xoá `ModuleShowcaseSection.tsx`. Carousel dùng chung:
  `blocks/carousel/useCarousel.ts` (mới) + cập nhật import ở `FeaturedSlider/index.tsx`
  và `CategoryShelf/index.tsx`; xoá `FeaturedSlider/useCarousel.ts`. i18n
  `messages/{en,vi}.json`. Không đổi BE, không route mới, không thêm dependency.
