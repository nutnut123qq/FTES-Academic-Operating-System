# onboarding-mascot-guide — Linh vật FTES dẫn đường: product tour kiểu game cho người mới

## Why

Người dùng mới đăng ký / lần đầu vào FTES gặp ngay một nền tảng nhiều tính năng (header 4
module Home/Workplace/Course/Community, AI tutor, gamification XP/streak, community, mua khóa
theo gói/nguyên course, học thử) mà KHÔNG có gì dẫn dắt → choáng, không biết bấm đâu, rời đi.
Hiện app chưa có bất kỳ luồng onboarding nào.

Giải pháp: dùng **linh vật FTES (husky đeo kính, áo polo FTES)** làm "người hướng dẫn" kiểu
game — hiện lên khi tạo tài khoản mới / lần đầu vào web, chỉ từng nút làm gì, tính năng dùng
ra sao, qua các bước spotlight (đèn rọi) + bong bóng thoại. Linh vật có sẵn 4 tư thế map đúng
4 vai trò của một bước hướng dẫn:

| Tư thế art | Vai trò trong tour |
|---|---|
| Vẫy tay chào | Bước chào mừng / mở đầu |
| Cầm tablet | Bước giải thích / cung cấp thông tin |
| Chỉ tay | Bước rọi đèn vào 1 nút/element cụ thể ("bấm cái này") |
| Giơ tay reo mừng | Bước hoàn thành / chúc mừng |

Mục tiêu: tăng activation (người mới hiểu và dùng được tính năng chính trong phiên đầu),
giảm bỏ ngang, tạo bản sắc thương hiệu vui-thân-thiện.

## What Changes

- **Component linh vật `FtesMascot`**: render 4 tư thế (`greeting | explain | point | cheer`),
  3 cỡ (sm/md/lg), animation nhún nhẹ idle (tắt khi `prefers-reduced-motion`). Tên hiển thị
  của linh vật lấy từ i18n `mascot.name` (marketing chốt sau — mặc định đề xuất "Tesu").
- **Product tour engine** (kiểu coach-mark/game tutorial): `TourProvider` + hook
  `useProductTour` + overlay spotlight (portal) khoét lỗ rọi sáng đúng element + bong bóng
  thoại gắn vào element (tự lật vị trí), có Prev/Next/Bỏ qua, thanh tiến độ "bước n/N".
- **Tour khai báo bằng dữ liệu** (Tour/Step schema): mỗi step nhắm tới 1 element qua thuộc
  tính ổn định `data-tour="<id>"` (KHÔNG dựa CSS class dễ vỡ); step không target → hộp giữa
  màn hình (welcome/celebration). Mỗi step tự chọn tư thế linh vật theo ý đồ.
- **Welcome tour cho tài khoản mới**: tự chạy khi vừa đăng ký thành công / lần đầu đăng nhập,
  đi qua header 4 module → global search → CTA học khóa đầu tiên → AI tutor → kết bằng bước
  reo mừng. Người dùng có thể "Bỏ qua" bất cứ lúc nào.
- **Tip theo ngữ cảnh (first-visit)**: lần đầu vào từng surface lớn (Workplace, Course detail,
  Community, AI hub…) linh vật hiện 1-vài bước tip riêng cho surface đó. Đăng ký được (declarative
  registry), mỗi lúc chỉ chạy 1 tour (hàng đợi, không chồng).
- **Nút trợ giúp nổi (mascot helper FAB)**: linh vật nhỏ nổi góc dưới, bấm mở bảng trợ giúp —
  chạy lại welcome tour, xem danh sách tip theo surface, link tài liệu. Ẩn được, không cản trở.
- **Lưu tiến độ**: đã xem/đã hoàn thành tour lưu localStorage theo user (đăng nhập) hoặc device
  id (khách) → không lặp lại; resume đúng bước nếu bỏ giữa chừng; tùy chọn "Không hiện lại".
- **Gắn `data-tour` anchor** vào các element chính (4 link header, ô search Ctrl/K, CTA khóa
  học, nút AI tutor, chip XP/streak) để engine nhắm trúng.
- Đầy đủ **a11y** (focus trap + Esc bỏ qua + phím ←/→/Enter, aria-live đọc nội dung bước,
  linh vật `aria-hidden` vì trang trí), **reduced-motion**, **i18n vi/en** (`mascot.*`,
  `onboarding.*`).

## Scope (FE-only slice)

**Delivered:** `FtesMascot` (poses/sizes/animated/reduced-motion, art via one swappable
module), the tour engine (`TourProvider` + `SpotlightOverlay` + `MascotCoachMark`), the
welcome tour with `data-tour` anchors, first-visit auto-start with a single device-wide
done flag, confirmed skip, manual replay from the account menu, missing-target skip, and
full a11y (focus trap, keyboard, aria-live, reduced-motion) + i18n vi/en.

**Non-Goals (deferred — NOT specified as requirements of this change):** cross-device BE
sync of the onboarding flag; per-surface first-visit tip registry (`registerTour` /
`first-visit:{surface}`); a multi-tour queue; resume-at-step and an opt-out flag;
per-principal storage keys (`ftes:tour:{principal}:*`); a floating `MascotHelperFab`
(replaced by an account-menu replay entry); step `route` navigation and `allowInteract`
pass-through; emitting `onboarding.completed`. These stay in tasks.md as a backlog and are
deliberately absent from the delta spec so `openspec sync` cannot write unbuilt behaviour
into the main specs.

## Capabilities

### New Capabilities
- `onboarding-mascot-guide`: linh vật FTES + product tour engine — component tư thế, spotlight
  coach-mark, welcome tour người mới, tip theo ngữ cảnh, helper nổi + chạy lại, lưu tiến độ,
  a11y/reduced-motion/i18n.

### Modified Capabilities
- `app-shell-navigation`: KHÔNG đổi hành vi — chỉ thêm thuộc tính `data-tour` (anchor) vào 4
  link header + ô search để tour nhắm tới; contract điều hướng giữ nguyên (ghi ở tasks).

## Impact

- FE only. Không đổi API/BE. Build stays green.
- Component/hook mới: `FtesMascot`, `TourProvider`, `useProductTour`, `MascotCoachMark`,
  `SpotlightOverlay`, `MascotHelperFab`; registry `tours/*`.
- Lưu localStorage `ftes:tour:{key}:*`. Tín hiệu "vừa đăng ký" lấy từ luồng
  `auth-login-popup` (registration success). BE sync cờ onboarding = **non-goal** (tương lai).
- Asset: 4 file tư thế linh vật (WebP) tách từ ảnh nguồn, đặt `public/mascot/`.
- Thêm `data-tour` vào surface có sẵn (header, search, course card, AI, gamification chip).
