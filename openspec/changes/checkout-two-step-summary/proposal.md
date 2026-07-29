# checkout-two-step-summary — Modal thanh toán thành wizard hai bước "Tóm tắt → Thanh toán"

## Why
Modal thanh toán chung (`PaymentModal`) hiện đổ tất cả vào một màn: ô tóm tắt luôn hiện +
ngay bên dưới là bộ chọn phương thức / mã giảm / QR. Người mua nhìn phát bị "quá tải", và
không có một bước xác nhận đơn gọn gàng trước khi vào phần trả tiền. Chủ dự án đưa mẫu thiết
kế: một modal sạch với **pill hai đoạn "Tóm tắt" / "Thanh toán"** ngay dưới tiêu đề — bước
**Tóm tắt** cho xem ảnh khóa + tên + giá lớn + nút "Tiếp tục thanh toán →", bước **Thanh toán**
mới là UI trả tiền thật.

Mẫu này đã có sẵn ở `PackageGateModal` (checkout shell hai tab legacy) — giờ áp cùng ngôn ngữ
đó cho modal checkout TOÀN CỤC, dùng lại đúng block nhà (`SegmentedControl`, `CoverImage`,
`PriceTag`) để không lệch look. TOÀN BỘ máy trả tiền (state `phase`, coupon, QR, poll, Xu,
success/failed) GIỮ NGUYÊN — chỉ bọc thêm một lớp hai bước, không viết lại logic thanh toán.

## What Changes
- **`PaymentContext.imageUrl?`** (optional): ảnh cover khóa để làm thumbnail bo góc trên bước
  Tóm tắt (và dòng recap gọn ở bước Thanh toán). Truyền từ các entry point có 1 cover:
  - `PackageGateModal` (`WholeCoursePanel` / `PackagePanel` / `WholeCourseGateCard`): thread
    `courseCoverUrl` qua hook chung `useProductCheckout` (thêm tham số `imageUrl`); thêm prop
    `courseCoverUrl` cho `WholeCourseGateCard`, `CourseDetail` truyền `course.coverUrl` vào.
  - `CourseDetail.onBuyPackage`: `imageUrl: course.coverUrl`.
  - `useCourseEnrollment.onEnroll`: thêm `coverUrl` vào buy-context → `imageUrl`; `CourseDetail`
    truyền `course.coverUrl`, `LearnContentPage` truyền `header.coverUrl`.
  - Giỏ hàng (`CartShell`, `MiniCartDrawer`): giỏ nhiều item không có 1 cover chung → BỎ
    `imageUrl` (bước Tóm tắt hiện tên không có thumbnail — `CoverImage` lo fallback nền trống).
- **Layout hai bước trong `PaymentModal`**:
  - `step: "summary" | "payment"`, reset về `"summary"` mỗi lần mở (nối vào effect reset sẵn có).
  - `SegmentedControl` dưới header (items Tóm tắt / Thanh toán) buộc vào `step`.
  - **Bước Tóm tắt**: thumbnail (`CoverImage` khi có `imageUrl`) + `title`; số tiền phải trả
    **to/đậm**; khi đơn VND có giảm → `PriceTag` (giá trả + giá gốc gạch + chip `−X%`) và dòng
    xanh `text-success` "Tiết kiệm {amount} (−{percent}%)" (dùng lại đúng công thức đã có trong
    file); nút primary full-width "Tiếp tục thanh toán →" (`ArrowRightIcon`) → `setStep("payment")`.
  - **Bước Thanh toán**: render `ChooseView`/`AwaitingView`/`SuccessView`/`FailedView` theo
    `phase` y như cũ, thêm dòng recap gọn ở đầu (thumbnail nhỏ + tên + số tiền phải trả).
  - **Guard**: khi `phase !== "choose"` (QR đang chờ / đã settled) → khoá đoạn "Tóm tắt"
    (`isDisabled`) và ghim modal ở bước Thanh toán để không rewind giữa chừng.
- **COIN**: không hiện tiết kiệm; bước Tóm tắt vẫn hiện số Xu khi VND = 0.
- i18n `payment.checkout.{summaryTab, paymentTab, continueToPayment}` (vi + en, mirrored, cùng
  thứ tự key). Dùng lại `amountVnd`/`amountCoin`/`savings` sẵn có.

## Capabilities
### New Capabilities
- `checkout-two-step-summary`: modal thanh toán toàn cục thành wizard hai bước — bước Tóm tắt
  (ảnh + tên + giá + tiết kiệm + CTA) và bước Thanh toán (máy trả tiền cũ), có pill segmented
  control + guard khoá quay lại khi thanh toán đang chạy.

## Impact
FE-only, KHÔNG cần API mới. Sửa: `modules/types/payment.ts`, `PaymentModal`, `PackageGateModal`,
`CourseDetail`, `useCourseEnrollment`, `LearnContentPage`, 2 file i18n; thêm `stepGating.test.ts`.
Dùng lại block nhà (`SegmentedControl`, `CoverImage`, `PriceTag`) + design token (`text-success`).
Giữ nguyên `summaryAmount` + test của nó. `tsc --noEmit` sạch + vitest xanh (Vercel CI chạy
webpack build thật).
