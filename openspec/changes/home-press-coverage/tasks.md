# Tasks — home-press-coverage

## 1. Dữ liệu
- [ ] 1.1 Thêm type `PressArticle` + `PRESS_ARTICLES` (6 bài đúng bảng design §1) vào `HomeLanding/content.ts`

## 2. Section
- [ ] 2.1 `sections/PressCoverageSection.tsx` theo khuôn section (max-w-6xl px-4 py-16, header giữa, tự ẩn khi rỗng)
- [ ] 2.2 Dải nguồn "Được nhắc tới trên" (dedupe theo `source`, logo `public/press/logos/{source}.svg` nếu có, else text)
- [ ] 2.3 Featured (bài[0], thẻ lớn) + lưới `sm:grid-cols-2 lg:grid-cols-3` các bài còn lại; cả thẻ là link
- [ ] 2.4 Link ra ngoài: `target="_blank" rel="noopener noreferrer"`, accessible name = title + sourceLabel + "mở tab mới"; hover nâng + underline title (tắt khi reduced-motion)
- [ ] 2.5 Ảnh `<img loading="lazy" onError>` fallback nền + tên nguồn (copy pattern `AchieverImage`)
- [ ] 2.6 Chèn `<PressCoverageSection />` vào `HomeLanding/index.tsx` (sau `HonorBoardSection`)

## 3. Asset & i18n
- [ ] 3.1 Đặt 6 ảnh `public/press/{id}.jpg` (anh gửi ảnh → đúng tên id; hoặc lấy og:image từng bài rồi tự-host, KHÔNG hotlink)
- [ ] 3.2 i18n `homeLanding.press.{eyebrow,title,subtitle,featuredOn,readArticle,newTab}` (vi/en); tiêu đề bài + sourceLabel giữ nguyên tiếng Việt 2 locale

## 4. Verify
- [ ] 4.1 tsc/eslint/build xanh; 6 thẻ mở đúng link tab mới, fallback ảnh không vỡ layout, section ẩn khi rỗng; `openspec validate home-press-coverage` PASS
