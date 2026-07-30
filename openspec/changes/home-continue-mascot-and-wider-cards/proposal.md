## Why

Hai lỗi bố cục ở dải "Tiếp tục học" (`MyCoursesSection`) trên home landing:

1. **Thẻ khoá học mất chữ.** Thẻ xếp `lg:grid-cols-4` (~271 px/thẻ) trong khi `ContinueCard`
   đặt 3 thứ trên CÙNG một hàng ngang: thumbnail 112 px (`shrink-0`) + cột chữ + nhãn
   "Tiếp tục học" (`shrink-0`, ~110 px). Cột chữ chỉ còn ~30 px nên **tên khoá học và
   "% hoàn thành" bị `truncate` mất sạch** — người học chỉ thấy ảnh bìa và chữ "Tiếp tục học"
   giống nhau ở cả 3 thẻ, không biết thẻ nào là khoá nào.
2. **Con sói lạc chỗ.** Lời chào FrosTES đứng trong một dải full-width RIÊNG ngay dưới dải
   "Tiếp tục học", thành một băng trống trải chỉ có mascot + một dòng chữ.

## What Changes

- **Chuyển lời chào mascot VÀO TRONG dải "Tiếp tục học"**, đặt ngay **dưới tiêu đề** và
  **trên dãy thẻ** (thứ tự đọc: eyebrow → tiêu đề "Tiếp tục học" → sói chào → thẻ khoá học).
  Bỏ dải mascot riêng bên dưới.
- **Giữ nguyên lời chào cho khách chưa đăng nhập**: dải "Tiếp tục học" tự ẩn khi không có
  enrollment, nên khi đó mascot vẫn render ở dải riêng như cũ. Trang **luôn có đúng MỘT**
  mascot (guardrail one-mascot-per-page), không bao giờ 2 hay 0.
- **Thẻ khoá học rộng ra để đủ chữ**: grid từ `sm:grid-cols-2 lg:grid-cols-4` → tối đa
  **2 cột** (`sm:grid-cols-2`), mỗi thẻ ~554 px ở desktop → tên khoá + "% hoàn thành" +
  nhãn CTA cùng hiển thị đủ.

## Capabilities

### New Capabilities
<!-- không có capability mới -->

### Modified Capabilities
- `home-continue-learning`: requirement **"Mascot greeting sits directly below the
  Continue-learning band"** (mascot đang là sibling ĐỨNG SAU dải → chuyển vào TRONG dải, dưới
  tiêu đề) và **"Continue-learning cards show the course cover image"** (bổ sung: tên khoá +
  "% hoàn thành" phải đọc được, không bị bóp mất). Cả 2 requirement gốc đến từ change chưa
  archive `home-continue-image-and-mascot`.

## Impact

- **Code**: `HomeLanding/sections/MyCoursesSection.tsx` (thêm mascot dưới tiêu đề, đổi grid),
  `HomeLanding/sections/HomeMascotGreeting.tsx` (thêm biến thể "dải dự phòng" tự ẩn khi dải
  khoá học đã render mascot), `HomeLanding/index.tsx` (thay dải mascot cũ bằng biến thể đó).
- **Không đụng**: block `ContinueCard` (dùng ở nơi khác — chỉ đổi bố cục grid ở cấp feature),
  BE/API, i18n (không có chuỗi mới).
- **Test**: thêm `e2e/home-continue-mascot-and-cards.spec.ts` — chạy được **không cần mật khẩu
  test** bằng cách seed token giả + mock `GET /courses/me/enrollments`.
