# home-press-coverage — Section "Báo chí nói về FTES" trên trang Home

## Why

FTES gắn với hệ sinh thái khởi nghiệp / giáo dục tư duy làm chủ (FPTU, phong trào khởi nghiệp
Gia Lai) và đã được nhiều báo lớn nhắc tới. Trang Home hiện có các khối uy tín (Bảng vàng học
viên, Đội ngũ mentor, Thống kê) nhưng **thiếu tín hiệu "được truyền thông công nhận"** —
một dạng social proof mạnh cho người mới vào (họ thấy báo chí đưa tin → tin tưởng hơn).

Bổ sung section **"Báo chí nói về FTES / FTES trên truyền thông"**: dải logo nguồn báo +
lưới thẻ bài viết dẫn ra 6 bài báo thật (mở tab mới), kèm ảnh thumbnail mỗi bài.

## What Changes

- Thêm section `PressCoverageSection` vào `HomeLanding` (sau khối Bảng vàng — cùng nhóm proof),
  theo đúng khuôn section hiện có (`max-w-6xl px-4 py-16`, header giữa, i18n `homeLanding`,
  ảnh lazy + fallback, tự ẩn khi rỗng).
- **Dữ liệu curated** trong `content.ts` (`PRESS_ARTICLES`) — không gọi BE. Mỗi bài:
  `{ id, source, sourceLabel, title, url, thumbnail, publishedAt? }`. Nạp sẵn 6 bài:
  1. **CafeF** — "Học khởi nghiệp ở trường đại học: Không phải ai cũng thành founder nhưng ai cũng cần tư duy làm chủ"
  2. **Đại học FPT** — "Đồ án khởi nghiệp của sinh viên FPTU đạt doanh thu gần 1 tỷ đồng sau 1 năm"
  3. **Báo Gia Lai** — "Gia Lai: Kết nối và gọi vốn đầu tư cho 4 dự án khởi nghiệp năm 2025"
  4. **Báo Gia Lai** — "10 dự án vào chung kết cuộc thi Thanh niên Gia Lai khởi nghiệp sáng tạo"
  5. **Báo Gia Lai** — "30 dự án vào vòng bán kết cuộc thi Thanh niên Gia Lai khởi nghiệp sáng tạo"
  6. **Thương Hiệu & Truyền Thông** — "Gia Lai tạo bệ phóng cho doanh nghiệp khởi nghiệp sáng tạo"
- **Layout**: 1 bài featured (thẻ lớn, ảnh + tiêu đề + nguồn) + lưới các bài còn lại; trên đầu
  là dải "Được nhắc tới trên" (tên/logo các nguồn: CafeF · Đại học FPT · Báo Gia Lai ·
  Thương Hiệu & Truyền Thông). Cả thẻ là link.
- **Link ra ngoài an toàn**: `target="_blank" rel="noopener noreferrer"`; ảnh có `alt` = tiêu đề,
  fallback khi ảnh lỗi (thẻ nền nguồn + tên nguồn) như `AchieverImage`.
- **Ảnh thumbnail**: self-host `public/press/{id}.jpg` (anh gửi ảnh → drop vào đây; hoặc lấy
  og:image các bài rồi tự-host — KHÔNG hotlink trực tiếp vì báo hay chặn hotlink/CORS).
- i18n `homeLanding.press.*` (heading/subtitle/CTA "Đọc bài ↗"/"Được nhắc tới trên"); tiêu đề
  bài giữ nguyên tiếng Việt ở cả 2 locale (là tiêu đề báo thật). Reduced-motion, a11y.

## Capabilities

### New Capabilities
- `home-press-coverage`: section báo chí/truyền thông trên Home — dữ liệu curated 6 bài,
  featured + lưới, dải nguồn, link ra ngoài an toàn, ảnh fallback, i18n/a11y.

### Modified Capabilities
- (none — chỉ chèn thêm 1 section vào `HomeLanding`, các section khác không đổi)

## Impact

- FE only, không BE. Build stays green.
- File chạm: `HomeLanding/content.ts` (+`PRESS_ARTICLES`), `HomeLanding/index.tsx` (chèn
  section), mới `sections/PressCoverageSection.tsx`; asset `public/press/*`; i18n vi/en.
