# Tasks

## 1. Asset

- [x] 1.1 Convert `public/mascot/fes-mascot-wave.gif` → `public/fes-mascot-wave.webp` bằng `sharp` (animated, resize 260px, quality 80, effort 6, loop 0) — 23 frame, 886KB → 418KB
- [x] 1.2 Chuyển GIF gốc ra `public/fes-mascot-wave.gif` làm fallback (2 file cùng nằm ở `public/` theo yêu cầu)
- [x] 1.3 Không sửa/không bo/không thêm nền vào ảnh — artwork đã có viền sticker trắng + nền trong suốt
- [x] 1.4 Rút khung ĐẦU của bản WebP từ 2600ms → 800ms (các khung sau giữ nhịp gốc 70ms): GIF gốc giữ khung đầu 2,6s trong vòng lặp 4,14s, tức 63% thời gian con sói đứng yên → nhìn thoáng qua tưởng ảnh tĩnh. Sau khi rút: vòng lặp 2,34s, vẫy chiếm 66%. Kiểm lại container vẫn `VP8X + ANIM + 23×ANMF`
- [x] 1.5 GIF fallback GIỮ NGUYÊN file gốc — re-encode GIF phải lượng tử hoá lại bảng màu (mất chất), mà đường fallback chỉ chạm tới trình duyệt không đọc được animated WebP

## 2. Component `MascotAssistant`

- [x] 2.1 `<picture><source srcSet=webp type="image/webp"><img src=gif></picture>`, `<img>` thuần (không `next/image`), `width/height` intrinsic 260×365, `draggable={false}`
- [x] 2.2 **Tư thế LÓ NỬA THÂN từ góc chéo phải dưới** (theo mẫu ảnh chủ sản phẩm gửi): vẽ to hơn ô của nó (`w-32` mobile / `sm:w-48`) rồi đẩy chéo qua mép (`translate-x`/`translate-y`) + nghiêng `rotate-[-8deg]`, để mép màn cắt mất ~48% chiều cao và ~16% bề ngang. Transform đặt trên NÚT (vùng bấm đi theo hình), không đặt trên ảnh (ảnh còn giữ `.mascot-float`). Kèm `-mt` ĐỐI XỨNG với `translate-y` để panel mở ra bám sát đỉnh THẤY ĐƯỢC của linh vật thay vì lơ lửng cách ~90px. `z-40` (dưới modal `z-50`)
- [x] 2.3 Vỏ ngoài ghim `top-4 … bottom-4` + `justify-start` để panel co theo chỗ trống; nút `shrink-0`; panel `flex min-h-0 flex-col`; `<ul>` `min-h-0 flex-1 overflow-y-auto`
- [x] 2.4 Bong bóng chủ động: state `bubble`, bộ đếm `bubblesShownThisVisit` ở module scope (cap 3/phiên), effect hẹn giờ (30–60s lần đầu, 180–300s các lần sau) + effect tự ẩn 8s, click mở menu, không hiện khi `isOpen` hoặc `isHidden`
- [x] 2.5 `isHidden` tính trước các effect để hẹn giờ không tiêu quota bong bóng ở trang không render linh vật
- [x] 2.6 A11y giữ nguyên: nút có `aria-label` + `aria-expanded` + `aria-controls`, panel là `<nav aria-label>`, Esc đóng, click ngoài đóng, Tab đi toggle → từng option

## 3. Danh sách tính năng (`options.ts`)

- [x] 3.1 Default set 8 dòng khớp `TOOL_CATALOG` của AI hub: chat(`/ai`) · planner · summary · flashcards · quiz · debug · cv(`/profile/cv`) · cvReview
- [x] 3.2 Icon lấy đúng bộ phosphor AI hub đang dùng (Notepad/Cards/Question/Bug/Briefcase) + bộ cũ (MapTrifold/ReadCvLogo/Sparkle)
- [x] 3.3 Giữ nguyên nhánh contextual `/subjects/<id>/…` (toolbox của môn) — không đụng

## 4. CSS

- [x] 4.1 `globals.css`: bỏ `@keyframes mascotWave` + `.mascot-wave`, thêm `@keyframes mascotFloat` + `.mascot-float` (translateY 5px, 3s ease-in-out infinite)
- [x] 4.2 Panel/bong bóng: `mascotAssistantPanelIn` 160ms → 200ms, scale 0.98 → 0.96 (scale + fade theo yêu cầu)
- [x] 4.3 Khối `prefers-reduced-motion: reduce` tắt `.mascot-float` + `.mascot-assistant-panel`; ghi rõ ảnh động không tắt được bằng CSS

## 5. Dọn lối vào cũ

- [x] 5.1 Xoá section "Khám phá" khỏi `AccountMenuAuthed` + `AccountMenuGuest`, dọn import mồ côi (`Header`, `useRouter`, `SessionStorage`, `SessionStorageId`, `onExplore`)
- [x] 5.2 Xoá `explore-shortcuts.tsx`
- [x] 5.3 Xoá nhánh i18n `profileMenu.*` ở vi + en (grep: 0 consumer còn lại); GIỮ `auth.context.explore` (còn dùng ở `SubjectResources`)
- [x] 5.4 Sửa docblock của 2 menu cho khớp thực tế
- [x] 5.5 KHÔNG đụng `ContentAiFab` — chủ sản phẩm chốt giữ nút tròn ở trang đọc bài

## 6. i18n

- [x] 6.1 `mascot.assistant.options.*`: 8 cặp label/description dạng câu gợi ý, vi + en
- [x] 6.2 `mascot.assistant.bubble.{hello,day,help}`, vi + en
- [x] 6.3 `preload` WebP trong `src/app/[locale]/layout.tsx`

## 7. Verify

- [x] 7.1 `node`/`json.load` parse sạch vi.json + en.json, `mascot.assistant.options` đủ 8 key ở cả 2 ngôn ngữ
- [x] 7.2 `npx tsc --noEmit` sạch
- [x] 7.3 `npx eslint` sạch trên các file đã đổi
- [x] 7.4 `npm run build` (webpack) xanh
- [x] 7.5 Nghiệm thu trình duyệt — vị trí/z-index/kích thước: `fixed`, `z-40`, trình duyệt chọn đúng `.webp`, `animation: mascotFloat 3s`
- [x] 7.5b Nghiệm thu tư thế ló nửa thân: 412×915 → cắt 48% đáy, 16% phải; 1280×720 → cắt 139px đáy, 21px phải; **không sinh cuộn ngang** ở cả hai; panel mở ra vẫn nằm trọn trong màn và cách đỉnh thấy được của linh vật 4-5px
- [x] 7.6 Nghiệm thu menu: 8 dòng đúng href; hover chuột mở, hover cảm ứng KHÔNG mở, click toggle, Esc đóng, click ngoài đóng; panel nằm trọn trong màn ở 1280×720 và 375×812, không sinh scroll ngang
- [x] 7.7 Nghiệm thu bong bóng (hạ tạm hằng số rồi khôi phục): hiện lần đầu ~29s → tự ẩn → click mở menu → đúng 3 lần rồi dừng → không hiện khi panel đang mở
- [x] 7.8 `openspec validate mascot-assistant-floating-hub --strict`
