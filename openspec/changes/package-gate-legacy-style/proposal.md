# package-gate-legacy-style — Modal đăng ký khóa/gói dựng lại theo layout checkout LEGACY

## Why
Modal chặn nội dung premium (`PackageGateModal`, mở khi bấm 1 bài PREMIUM để đăng ký) đang là
một card danh sách gói tuỳ biến: header lock-icon + tiêu đề theo ngữ cảnh, mỗi gói là 1 card
riêng với nút mua riêng, footer chỉ có nút "Để sau". Thầy muốn dựng lại **y hệt** bố cục
checkout LEGACY tham chiếu: một thẻ trắng bo góc với **tiêu đề "Thanh toán" + nút ✕ tròn**, một
**segmented tabs "Tóm tắt / Thanh toán"** (mặc định "Tóm tắt"), phần **tóm tắt đơn hàng** (ảnh
vuông bo góc + tên khóa 2 dòng + giá lớn đậm + giá gốc gạch ngang + chip `−X%` + dòng "Tiết kiệm
{amount}"), và **một nút CTA lớn "Tiếp tục thanh toán →"** ở dưới. (KHÔNG có dòng "🎓 Bạn đã sở
hữu N khóa học" — thầy đã chốt bỏ.)

Đây là thay đổi HIỂN THỊ: luồng checkout thật (resolve sản phẩm → thêm giỏ → free-checkout hoặc
mở `PaymentModal`) giữ nguyên; logic gated enroll (login → free-enroll, mua chính khóa/gói để mở
phần còn lại) không đổi.

## What Changes
- **Vỏ checkout dùng chung `CheckoutShell`** cho cả hai biến thể: header ("Thanh toán" đậm + nút
  ✕ tròn `isIconOnly`), `SegmentedControl` "Tóm tắt / Thanh toán" (mặc định "Tóm tắt", reset mỗi
  lần mở), body theo tab, và **một** CTA lớn `rounded-full` "Tiếp tục thanh toán →" ở footer.
- **Tab "Tóm tắt"** = tóm tắt đơn hàng dùng block nhà: `CoverImage` (thumbnail `size-14`,
  `rounded-2xl`, object-cover) + tên (2-line clamp) + `PriceTag` (giá đậm + gốc gạch ngang +
  chip `−X%`) + dòng "Tiết kiệm {amount}" (chỉ khi gốc > giá bán).
- **Tab "Thanh toán"** = ghi chú ngắn "sẽ chọn phương thức ở bước tiếp theo" (phương thức thật
  chọn trong `PaymentModal` toàn cục mở sau đó).
- **Biến thể trọn khóa** (không có gói phù hợp → LEGACY course): 1 dòng đơn hàng từ sản phẩm
  COURSE_UNLOCK; CTA chạy resolve → giỏ → (free-checkout | PaymentModal). Không có sản phẩm →
  giữ thông báo "Không có gói phù hợp".
- **Biến thể bán theo gói** (`packageSlugs` không rỗng): mỗi gói là 1 **dòng đơn hàng chọn được**
  (thumbnail + tên + `PriceTag` + tiết kiệm), giữ hành vi chọn gói; CTA chạy checkout cho gói
  ĐANG chọn (mặc định gói default, nếu không thì gói rẻ nhất).
- **Gộp logic checkout về 1 hook `useProductCheckout`** (resolve → giỏ → free-checkout|PaymentModal
  bọc auth-guard) dùng chung cho cả modal LẪN card trọn khóa của trang chi tiết → không đẻ bản
  sao thứ N của `addCart → isFree ? checkout : payment.open`.
- i18n `courseSystem.preview.modal.{paymentTitle,close,tabSummary,tabPayment,continuePayment,
  paymentNextHint}` (vi + en, mirrored); tái dùng `cart.itemSaving` cho dòng "Tiết kiệm {amount}".

## Capabilities
### New Capabilities
- `package-gate-legacy-style`: modal đăng ký khóa/gói theo bố cục checkout LEGACY (tiêu đề "Thanh
  toán" + tabs "Tóm tắt/Thanh toán" + tóm tắt đơn hàng + CTA "Tiếp tục thanh toán") cho cả biến
  thể trọn khóa lẫn bán theo gói.

## Impact
FE-only, KHÔNG cần API mới. Sửa `PackageGateModal/index.tsx` (+ `WholeCourseGateCard` giữ nguyên
API export & giao diện standalone cho trang chi tiết + `PackageGateCard` thành dòng chọn được) +
`index.test.tsx`. Tái dùng block nhà `SegmentedControl`, `Modal`, `PriceTag`, `CoverImage`,
`Button`, `Chip`. Giữ nguyên `usePaymentOverlayState`/`PaymentModal` toàn cục. tsc sạch + build
webpack xanh.
