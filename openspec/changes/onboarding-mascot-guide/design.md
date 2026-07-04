# Design — onboarding-mascot-guide

## Context
Product tour kiểu game (coach-mark/spotlight — tham chiếu Duolingo, Appcues, Intro.js) dẫn
dắt bằng linh vật thương hiệu. Bám convention app: header 4 link thuần (Home/Workplace/Course/
Community), KHÔNG sidebar toàn cục, màu chủ đạo #3F51B5, login popup-only, AmbientBackground
sao băng, i18n vi/en. Linh vật FTES = husky đeo kính + áo polo FTES, có 4 tư thế nguồn.

## Goals / Non-Goals
**Goals:** engine tour tái sử dụng (spotlight + coach-mark), welcome tour cho người mới, tip
theo ngữ cảnh first-visit, helper nổi + chạy lại, lưu tiến độ không lặp, a11y + reduced-motion
+ i18n. Build green, không đụng BE (mock tín hiệu new-user nếu cần).
**Non-Goals:** trình soạn tour trên UI (tour khai báo bằng code); BE sync cờ onboarding
cross-device (giai đoạn này localStorage, để tương lai); pipeline thưởng XP khi xong (chỉ
emit event nếu endpoint activity có sẵn, không bắt buộc); animation phức tạp/Lottie (dùng art
tĩnh + CSS nhún nhẹ).

## Decisions

### 1. Linh vật & mapping tư thế
- `FtesMascot` props: `pose: "greeting"|"explain"|"point"|"cheer"`, `size: "sm"|"md"|"lg"`,
  `animated?` (nhún idle). Mỗi pose = 1 asset `public/mascot/{pose}.webp` (+ `@2x`), preload
  `greeting`. Linh vật là **trang trí** → `aria-hidden`, nội dung nghĩa nằm ở bong bóng thoại.
- Ý đồ → tư thế: bước mở đầu/welcome = `greeting`; bước giải thích khái niệm = `explain`;
  bước rọi vào 1 nút cụ thể = `point`; bước hoàn thành = `cheer`. Engine tự suy pose từ
  `step.intent` nếu step không chỉ định.
- Tên linh vật qua i18n `mascot.name` (không hardcode) → marketing đổi được.

### 2. Mô hình dữ liệu tour (declarative)
```ts
type TourStep = {
  id: string
  target?: string          // giá trị data-tour="<id>"; bỏ trống = hộp giữa màn hình
  intent?: "welcome"|"explain"|"point"|"celebrate"  // suy ra pose + layout
  titleKey: string; bodyKey: string                 // i18n keys
  placement?: "auto"|"top"|"bottom"|"left"|"right"   // auto = tự lật theo chỗ trống
  route?: string          // step cần ở route này → engine điều hướng trước khi rọi
  allowInteract?: boolean // true = cho phép bấm xuyên vào element (bước "làm thử")
}
type Tour = { id: string; trigger: "first-login"|`first-visit:${string}`|"manual"; steps: TourStep[] }
```
- Tour đăng ký qua `registerTour(tour)` (registry). Target dùng **`data-tour="<id>"`** — ổn
  định, không vỡ khi refactor class/DOM. Element chưa mount → xem §6 (xử lý mất target).

### 3. Spotlight overlay (đèn rọi)
- Portal ở root, `role="dialog" aria-modal`. Nền mờ (#0b0f2e ~72% hoặc token dim) phủ toàn
  màn, **khoét lỗ** đúng bounding-rect của target (+padding 8px, bo góc) bằng SVG mask hoặc 4
  panel bao quanh. `scrollIntoView` target trước khi rọi; reposition khi resize/scroll/route.
- Mặc định chặn tương tác ngoài lỗ; `allowInteract` → cho click xuyên vào đúng element (dạy
  "bấm thử"). Bước không target → không khoét lỗ, chỉ dim + hộp giữa màn hình.

### 4. Coach-mark (bong bóng thoại + linh vật)
- Gắn cạnh lỗ rọi, tự lật (`auto`) để không tràn viewport, có mũi nhọn trỏ về target. Nội
  dung: `FtesMascot` (pose theo intent) + tiêu đề + thân + thanh tiến độ "n/N" + nút
  **Trước / Tiếp** + link **Bỏ qua**. "Bỏ qua" → confirm nhẹ ("Bỏ qua hướng dẫn? Bạn mở lại
  từ nút trợ giúp bất cứ lúc nào") rồi kết thúc CẢ tour.
- Bước cuối nút "Tiếp" đổi thành "Xong" (pose `cheer`).

### 5. Trigger & điều phối (một tour tại một thời điểm)
- **first-login**: luồng `auth-login-popup` khi đăng ký/đăng nhập lần đầu set cờ phiên
  `justRegistered` → `TourProvider` đọc → chạy welcome tour. Không có cờ (đăng nhập lại máy
  mới) → fallback "authenticated-first-visit-ever" theo localStorage.
- **first-visit:{surface}**: surface mount → nếu tour của surface chưa xem → xếp hàng chạy.
- **manual**: từ helper FAB / settings.
- **Hàng đợi**: chỉ 1 tour chạy tại 1 lúc; tour khác đến trong lúc đang chạy → xếp hàng,
  không chồng overlay.

### 6. Lưu tiến độ & xử lý mất target
- localStorage key = `ftes:tour:{principal}:*` với `principal` = userId (đăng nhập) hoặc device
  uuid (khách, sinh 1 lần). `...:completed` = mảng tourId; `...:{tourId}:step` = resume;
  `...:optOut` = tắt hẳn ("Không hiện lại").
- **Target không tìm thấy trong ~1.5s** (element chưa render/đã đổi) → engine **bỏ qua step
  đó sang step kế** (không kẹt), log dev-warning. Route mismatch → điều hướng `step.route`
  rồi chờ target.

### 7. Helper nổi (FAB) + chạy lại
- `MascotHelperFab` góc dưới-cuối (không đè CTA chính; ẩn khi có overlay tour đang chạy). Bấm
  → sheet: "Xem lại hướng dẫn nhanh" (welcome), danh sách tip theo surface đã/định nghĩa, link
  tài liệu. Có nút ẩn FAB (nhớ localStorage).

### 8. a11y & reduced-motion
- Focus chuyển vào coach-mark khi mở; Esc = Bỏ qua; ←/→ = Trước/Tiếp; Enter = Tiếp. Nội dung
  bước trong vùng `aria-live="polite"`. Linh vật `aria-hidden`. Tương phản chữ trên nền dim đạt
  AA. `prefers-reduced-motion` → tắt nhún linh vật + chuyển bước tức thời (không trượt/scale).

### 9. Tích hợp (tùy chọn, không chặn)
- Xong welcome tour → nếu có endpoint activity/event thì emit `onboarding.completed` (nguồn cho
  gamification thưởng XP); không có thì bỏ qua. FE-only, không dựng pipeline thưởng ở đây.

## Risks / Trade-offs
- **Anchor `data-tour` thiếu** → step tự bỏ qua (đã xử lý §6); nợ: gắn đủ anchor ở các surface
  (tasks). Đổi IA header sau này chỉ cần giữ `data-tour` là tour không vỡ.
- **Tín hiệu new-user** phụ thuộc luồng auth; nếu chưa có cờ → fallback localStorage (có thể
  lệch khi user xóa storage / đổi máy) — chấp nhận ở giai đoạn FE-only.
- **Phiền người dùng**: chống bằng opt-out, chạy 1 tour/lúc, dễ Bỏ qua, không auto-lặp.
- BE chưa có → mock cờ new-user + (nếu cần) danh sách tip; gỡ mock khi BE sync onboarding sau.
