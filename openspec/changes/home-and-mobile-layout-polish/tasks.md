# Tasks

## 1. Hành trình không đọc hai lần trên điện thoại
- [x] 1.1 `JourneyHero`: cột visual `hidden … lg:block`, node vẫn mount (fallback còn trong HTML)
- [x] 1.2 Comment tại chỗ giải thích vì sao ẩn bằng CSS chứ không unmount (SEO)

## 2. Ưu đãi & chính sách thành strip vuốt ngang
- [x] 2.1 Tách `OfferGroupBody` dùng chung cho tab desktop và thẻ mobile
- [x] 2.2 Dưới `lg`: ẩn rail tab, dựng track scroll-snap thuần CSS + thẻ `snap-center`
- [x] 2.3 Hàng chấm: `syncSlide` đo bằng `getBoundingClientRect` (không dùng `offsetLeft`), `goToSlide` cuộn mượt
- [x] 2.4 Bỏ khung mockup `aspect-video` ở nhánh mobile
- [x] 2.5 Desktop `lg:` giữ nguyên tab rail + panel giữ-mounted
- [x] 2.6 i18n nhãn vuốt (en + vi)

## 3. Bảng vàng không tràn chữ
- [x] 3.1 `GoldName`: `max-w-full break-words`, `text-lg md:text-xl` cho thẻ podium
- [x] 3.2 Danh hiệu: `break-words` + `md:whitespace-nowrap`, hạ một cỡ dưới `md`
- [x] 3.3 `PodiumCard` `min-w-0` + padding `p-5 sm:p-6`; danh sách dòng `break-words`

## 4. Rail môn học → tab strip trên điện thoại
- [x] 4.1 Rail `hidden … md:block` (loại khỏi layout, không chỉ thu gọn)
- [x] 4.2 `NAV_ITEMS` phẳng + `activeKey` (fallback `overview`)
- [x] 4.3 `TabsCard` `w-max` trong hộp `overflow-x-auto`, `md:hidden`, giữ nhãn

## 5. Link báo chí trong Thành tựu
- [x] 5.1 `PressLink` + field `press?` trên `AchievementStat`, docblock nói rõ vì sao không i18n
- [x] 5.2 Gắn 5 link cho KNS Gia Lai, 4 link cho học bổng FPT (tổng 9)
- [x] 5.3 `AchievementsSection`: render danh sách dưới link "Xem chi tiết", `line-clamp-1`, mở tab mới
- [x] 5.4 i18n nhãn khối báo chí (en + vi)
- [x] 5.5 `AchievementsSection.test.tsx`

## 6. Verify
- [x] 6.1 `npx tsc --noEmit` sạch
- [x] 6.2 `npx vitest run` các test liên quan
- [ ] 6.3 Xem thật trên thiết bị / responsive viewport — CHƯA làm (cấm `next dev` trong phiên này)
