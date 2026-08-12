# Tasks

## 1. Asset

- [x] 1.1 Convert `public/mascot/fes-mascot-wave.gif` → `public/fes-mascot-wave.webp` bằng `sharp` (animated, resize 260px, quality 80, effort 6, loop 0) — 23 frame, 886KB → 418KB
- [x] 1.2 Chuyển GIF gốc ra `public/fes-mascot-wave.gif` làm fallback (2 file cùng nằm ở `public/` theo yêu cầu)
- [x] 1.3 Không sửa/không bo/không thêm nền vào ảnh — artwork đã có viền sticker trắng + nền trong suốt
- [x] 1.4 Rút khung ĐẦU của bản WebP từ 2600ms → 800ms (các khung sau giữ nhịp gốc 70ms): GIF gốc giữ khung đầu 2,6s trong vòng lặp 4,14s, tức 63% thời gian con sói đứng yên → nhìn thoáng qua tưởng ảnh tĩnh. Sau khi rút: vòng lặp 2,34s, vẫy chiếm 66%. Kiểm lại container vẫn `VP8X + ANIM + 23×ANMF`
- [x] 1.5 GIF fallback GIỮ NGUYÊN file gốc — re-encode GIF phải lượng tử hoá lại bảng màu (mất chất), mà đường fallback chỉ chạm tới trình duyệt không đọc được animated WebP

## 2. Component `MascotAssistant`

- [x] 2.1 `<picture><source srcSet=webp type="image/webp"><img src=gif></picture>`, `<img>` thuần (không `next/image`), `width/height` intrinsic 260×365, `draggable={false}`
- [x] 2.2 **Tư thế LÓ tới PHẦN THÂN, nghiêng −14°, lấn vào góc phải dưới** (chủ sản phẩm chọn từ 4 phương án dựng sẵn, rồi chốt thêm một nấc nhỏ hơn + lấn sâu hơn): `w-[84px]` mobile · `translate(31px, 52px)` / `sm:w-[126px]` · `translate(47px, 78px)`, lấn qua mép phải 12px / 18px — chính cái lấn này đút bàn tay vào góc thay vì để nó đứng cạnh góc. Giữ lại **68% chiều cao thân** — mép cắt rơi ngay dưới ngực nên còn đủ đầu + tay vẫy + áo có chữ FTES. Gốc xoay để MẶC ĐỊNH (tâm hộp): bộ giải giả định vậy, thêm `origin-bottom-right` là vô hiệu hoá mọi con số. Transform đặt trên NÚT (vùng bấm đi theo hình), không đặt trên ảnh (ảnh giữ `.mascot-float`). `-mt` ĐỐI XỨNG với `translate-y`. `z-40` (dưới modal `z-50`)
- [x] 2.2c **Cách RA số, để người sau khỏi chỉnh mò**: không đoán, mà giải ngược bằng `sharp` ngoài trình duyệt — rasterise ảnh ở đúng `w`, xoay, tìm pixel ĐẶC phải nhất **chỉ trong những hàng sẽ hiện ra**, rồi đặt sao cho pixel đó chạm mép màn và còn lại 68% chiều cao. Chi tiết quan trọng: chỗ rộng nhất của nhân vật là HÔNG, mà hông đã bị cắt xuống dưới màn — đo theo toàn thân thì phần thấy được (đầu/ngực) hụt vào trong, hở một mảng ở đúng đỉnh góc. Đổi ảnh / đổi bề ngang / đổi góc thì phải chạy lại phép giải này
- [x] 2.2b **Hover-intent — rời chuột chỉ HẸN đóng, không đóng ngay** (`HOVER_CLOSE_DELAY_MS` = 2000ms): vỏ ngoài `pointer-events-none` nên KHOẢNG TRỐNG giữa linh vật và panel không bắt được chuột; linh vật lại nằm sát góc còn panel bung lên phía trên-trái, nên đường đi chéo tự nhiên từ cái này sang cái kia cắt qua vùng chết → `pointerleave` bắn → panel biến mất trước khi chuột tới. Vào lại linh vật HOẶC panel đều huỷ hẹn (`openPanel` gọi `cancelPendingClose`, nên cả mở-bằng-phím lẫn mở-bằng-chạm cũng không bị timer cũ đóng nhầm). Timer dọn khi unmount
- [x] 2.3 Vỏ ngoài ghim `top-4 … bottom-4` + `justify-start` để panel co theo chỗ trống; nút `shrink-0`; panel `flex min-h-0 flex-col`; `<ul>` `min-h-0 flex-1 overflow-y-auto`
- [x] 2.4 Bong bóng chủ động: state `bubble`, bộ đếm `bubblesShownThisVisit` ở module scope (cap 3/phiên), effect hẹn giờ (30–60s lần đầu, 180–300s các lần sau) + effect tự ẩn 8s, click mở menu, không hiện khi `isOpen` hoặc `isHidden`
- [x] 2.5 `isHidden` tính trước các effect để hẹn giờ không tiêu quota bong bóng ở trang không render linh vật
- [x] 2.6 A11y giữ nguyên: nút có `aria-label` + `aria-expanded` + `aria-controls`, panel là `<nav aria-label>`, Esc đóng, click ngoài đóng, Tab đi toggle → từng option

## 3. Danh sách tính năng (`options.ts`)

- [x] 3.1 **Panel cũng bám TRANG, không đổ cả 8 dòng ở mọi nơi.** Gom 9 tính năng vào 1 `CATALOG` rồi mỗi route chọn 2-4 khoá (`ROUTE_SETS`): home → Trung tâm AI · Lộ trình học · Làm CV · khoá học → planner/summary/flashcards · challenges|practice|workflow → debug/quiz · profile|career|marketplace → cv/cvReview · resources|blog|search → summary/flashcards · `/ai` → cả 8 (vào đây là để tìm công cụ) · bài học → lessonChat/summary/flashcards/quiz. **Mọi danh sách ngắn đều kết bằng dòng "Trung tâm AI"** nên không bao giờ là ngõ cụt, và bộ đầy đủ luôn cách 1 bước
- [x] 3.2 Icon lấy đúng bộ phosphor AI hub đang dùng (Notepad/Cards/Question/Bug/Briefcase) + bộ cũ (MapTrifold/ReadCvLogo/Sparkle)
- [x] 3.3 Giữ nguyên nhánh contextual `/subjects/<id>/…` (toolbox của môn) — không đụng
- [x] 3.4 **Dòng panel = TÊN tính năng, không phải câu hỏi.** Nhãn dạng câu hỏi bị cắt cụt 6/8 dòng ở bề rộng 19rem (chủ sản phẩm chụp màn hình chỉ ra). Giọng câu hỏi chuyển hẳn sang bong bóng; mô tả đổi `truncate` → `line-clamp-2`. Đo lại: 0/8 nhãn và 0/8 mô tả bị cắt
- [x] 3.5 **Bộ câu theo TRANG** (`getAssistantBubbles`): bài học → "Cần mình giải đáp thắc mắc buổi học không?" mở thẳng chat bám bài · workspace môn → thẻ ghi nhớ / câu hỏi ôn tập của môn đó · trang khoá học → lộ trình học · hồ sơ → làm CV · còn lại → 3 câu xã giao chỉ mở menu. Danh sách ứng viên đọc LÚC BONG BÓNG HIỆN chứ không phải lúc hẹn giờ, vì người dùng có thể đã chuyển trang trong lúc chờ
- [x] 3.6 **Đích của dòng/bong bóng có 2 dạng**: `href` (điều hướng) hoặc `action` (chạy tại chỗ). Chat bám bài KHÔNG có route riêng — nó là panel trên chính trang đang mở — nên phải là `action` + render bằng `<button>`; để `<a href>` thì trỏ vào hư không và hỏng cả bấm-giữa/copy-link

## 4. CSS

- [x] 4.1 `globals.css`: bỏ `@keyframes mascotWave` + `.mascot-wave`, thêm `@keyframes mascotFloat` + `.mascot-float` (translateY 5px, 3s ease-in-out infinite)
- [x] 4.2 Panel/bong bóng: `mascotAssistantPanelIn` 160ms → 200ms, scale 0.98 → 0.96 (scale + fade theo yêu cầu)
- [x] 4.3 Khối `prefers-reduced-motion: reduce` tắt `.mascot-float` + `.mascot-assistant-panel`; ghi rõ ảnh động không tắt được bằng CSS

## 5. Dọn lối vào cũ

- [x] 5.1 Xoá section "Khám phá" khỏi `AccountMenuAuthed` + `AccountMenuGuest`, dọn import mồ côi (`Header`, `useRouter`, `SessionStorage`, `SessionStorageId`, `onExplore`)
- [x] 5.2 Xoá `explore-shortcuts.tsx`
- [x] 5.3 Xoá nhánh i18n `profileMenu.*` ở vi + en (grep: 0 consumer còn lại); GIỮ `auth.context.explore` (còn dùng ở `SubjectResources`)
- [x] 5.4 Sửa docblock của 2 menu cho khớp thực tế
- [x] 5.5 **ĐẢO quyết định trước đó: bỏ nút tròn ở trang đọc bài, linh vật thay hẳn.** Chủ sản phẩm chọn lại khi muốn có bong bóng hỏi về buổi học. `ContentAiFab` GIỮ NGUYÊN vai trò host panel (popover desktop / drawer mobile), chỉ mất cái nút: nút tròn trở thành **neo vô hình** (`opacity-0 pointer-events-none excludeFromTabOrder aria-hidden`, `size-1`). Lý do không xoá hẳn: react-aria định vị Popover THEO PHẦN TỬ TRIGGER — xoá là panel mất chỗ neo. Giữ neo thì placement / dismiss / portal-fullscreen / chế độ mở rộng nguyên vẹn, mà chuột-bàn phím-screen reader đều không chạm tới được. Bỏ luôn kéo-thả + vị trí lưu localStorage (không còn nút nằm chắn cột đọc để mà kéo ra)

## 6. i18n

- [x] 6.1 `mascot.assistant.options.*`: 8 cặp label/description dạng câu gợi ý, vi + en
- [x] 6.2 `mascot.assistant.bubble.{hello,day,help}`, vi + en
- [x] 6.3 `preload` WebP trong `src/app/[locale]/layout.tsx`

## 6b. Test đi theo quyết định sản phẩm

- [x] 6b.1 **CI đỏ vì `ContentAiFab/index.test.tsx` — do em, không phải hạ tầng.** 7 test đang ghim cái nút tròn + kéo-thả vừa bị bỏ: `getByLabelText("reader.ai.open")`, khôi phục vị trí từ localStorage, ngưỡng kéo, kẹp biên, nuốt toggle cuối cú kéo
- [x] 6b.2 **VIẾT LẠI theo hành vi mới, KHÔNG xoá cho xanh.** Phần kéo-thả mất cùng tính năng (đúng), phần còn lại ghim đúng hợp đồng mà linh vật dựa vào: (1) render theo route param · (2) **STORE mở chat, không phải cú bấm** · (3) neo popover `aria-hidden` + `tabIndex=-1` + `pointer-events-none opacity-0` → cả trang chỉ còn ĐÚNG MỘT lối vào AI · (4) nhánh drawer mobile
- [x] 6b.3 Mock HeroUI `Button` cho `className` đi XUYÊN qua (khác các prop HeroUI-only bị nuốt): tính vô hình + bất động của neo nằm ở chính mấy class đó, nuốt đi thì test không phân biệt nổi neo bất động với nút thật. `excludeFromTabOrder` map sang `tabIndex={-1}` cho khớp react-aria
- [x] 6b.4 `npx vitest run` toàn bộ: **131 file / 855 test xanh**

## 7. Verify

- [x] 7.1 `node`/`json.load` parse sạch vi.json + en.json, `mascot.assistant.options` đủ 8 key ở cả 2 ngôn ngữ
- [x] 7.2 `npx tsc --noEmit` sạch
- [x] 7.3 `npx eslint` sạch trên các file đã đổi
- [x] 7.4 `npm run build` (webpack) xanh
- [x] 7.5 Nghiệm thu trình duyệt — vị trí/z-index/kích thước: `fixed`, `z-40`, trình duyệt chọn đúng `.webp`, `animation: mascotFloat 3s`
- [x] 7.5b **Nghiệm thu BẰNG MẮT, không chỉ bằng số.** Pane trình duyệt ở môi trường này bị ẩn nên `computer{screenshot}` luôn timeout ("not compositing frames") → 2 vòng trước chỉ đo toạ độ rồi tự cho là đạt, và cả 2 vòng đều SAI (chỉ ló cái đầu, bị nghiêng). Cách thay thế: dựng lại chuỗi transform của CSS bằng `sharp` ngoài trình duyệt (đặt ảnh đã resize/xoay lên canvas đúng cỡ viewport, tính tâm sau khi xoay quanh gốc bottom-right), xuất PNG rồi ĐỌC ảnh đó. Đối chiếu 4 phương án, chọn phương án khớp ảnh mẫu. **Bất cứ ai sửa lại tư thế này phải render rồi NHÌN, đừng tin số đo.**
- [x] 7.5c Số đo trình duyệt thật khớp đúng bản dựng: 412×915 → `w 84px`, `translate 31px 52px`, `rotate -14deg`, cắt 28px phải / 45px đáy; 1280×720 → `w 126px`, `translate 47px 78px`, `rotate -14deg`; **không sinh cuộn ngang** ở cả hai; panel nằm trọn trong màn, 8 dòng; hover-intent còn nguyên (rời 800ms còn, vào card 2,5s còn, rời hẳn 2,4s đóng)
- [x] 7.5c Nghiệm thu hover-intent (bắn PointerEvent `pointerType:"mouse"` thật): hover linh vật → mở; rời chuột 700ms → CÒN; di vào card rồi chờ 2,6s → CÒN (hẹn đóng đã huỷ); rời hẳn → còn ở 1,2s, đóng ở 2,4s. Chạm (`pointerType:"touch"`) mở panel và KHÔNG tự đóng sau 2,6s — timer chỉ dành cho chuột
- [x] 7.6 Nghiệm thu menu: 8 dòng đúng href; hover chuột mở, hover cảm ứng KHÔNG mở, click toggle, Esc đóng, click ngoài đóng; panel nằm trọn trong màn ở 1280×720 và 375×812, không sinh scroll ngang
- [x] 7.7 Nghiệm thu bong bóng (hạ tạm hằng số rồi khôi phục): hiện lần đầu ~29s → tự ẩn → click mở menu → đúng 3 lần rồi dừng → không hiện khi panel đang mở
- [x] 7.9 **Nghiệm thu ngữ cảnh trên đúng route bài học** (`/vi/courses/…/learn/content/modules/…/contents/…`): panel đổi phụ đề sang "Mình đang đọc bài này cùng bạn", dòng đầu là `<button>` (không phải `<a>`) nhãn "Hỏi về bài đang đọc", KHÔNG còn nút tròn nào trên màn; bong bóng nói đúng "Cần mình giải đáp thắc mắc buổi học không?", bấm vào thì `panelOpened=false` mà `chatDialogOpened=true` — tức mở THẲNG chat chứ không mở menu
- [x] 7.10 Nghiệm thu bề rộng chữ: 0/8 nhãn và 0/8 mô tả bị cắt (trước đó 6/8 mô tả bị cắt); panel vẫn nằm trọn trong màn, danh sách cuộn trong
- [x] 7.11 Nghiệm thu panel theo trang (đọc thẳng DOM ở từng route): `/vi` → 3 dòng (Trung tâm AI · Lộ trình học · Làm CV) · `/vi/courses` → 4 (planner/summary/flashcards/hub) · `/vi/challenges` → 3 (debug/quiz/hub) · `/vi/profile` → 3 (cv/cvReview/hub) · `/vi/ai` → đủ 8 · route bài học → 4 (Hỏi về bài đang đọc/summary/flashcards/quiz) + phụ đề đổi ngữ cảnh
- [x] 7.8 `openspec validate mascot-assistant-floating-hub --strict`
