# Tasks — package-gate-legacy-style

## 1. Checkout shell dùng chung
- [x] 1.1 `CheckoutShell` (nội bộ `PackageGateModal`): header "Thanh toán" đậm + nút ✕ tròn (`Button isIconOnly variant="tertiary" rounded-full`, `aria-label`), `SegmentedControl` "Tóm tắt/Thanh toán", body theo tab, footer 1 CTA lớn `rounded-full` "Tiếp tục thanh toán" + `ArrowRightIcon`
- [x] 1.2 Tab state ở `PackageGateModal`, mặc định `"summary"` + reset về `"summary"` mỗi lần `isOpen` bật
- [x] 1.3 Tab "Thanh toán" = ghi chú `modal.paymentNextHint` (chọn phương thức ở bước sau)

## 2. Tóm tắt đơn hàng
- [x] 2.1 `OrderSummaryLine`: `CoverImage` thumbnail `size-14` (`rounded-2xl`, object-cover) + tên `line-clamp-2` + `PriceTag size="md"` + dòng "Tiết kiệm {amount}" (`cart.itemSaving`) khi gốc > giá bán
- [x] 2.2 Biến thể trọn khóa: 1 dòng đơn hàng từ sản phẩm COURSE_UNLOCK (`WholeCoursePanel`); không có sản phẩm → giữ thông báo `modal.emptyTitle`/`modal.emptyHint`
- [x] 2.3 Biến thể gói (`PackagePanel`): mỗi gói = `PackageGateCard` dòng CHỌN được (`aria-pressed`, viền accent khi chọn, `CheckCircleIcon`); giữ hành vi chọn gói; CTA chạy checkout cho gói đang chọn (mặc định gói default → gói rẻ nhất)

## 3. Gộp logic checkout
- [x] 3.1 `useProductCheckout` (resolve → `addCart` → free-checkout | `payment.open`, bọc `useRequireAuth().guard`) dùng chung cho `WholeCoursePanel` + `PackagePanel` + `WholeCourseGateCard`
- [x] 3.2 `WholeCourseGateCard` giữ export + giao diện standalone (`detail.wholeCourse` + `detail.enroll`) cho trang chi tiết (không vỡ `enrollCta.test`)

## 4. i18n & test & verify
- [x] 4.1 i18n `courseSystem.preview.modal.{paymentTitle,close,tabSummary,tabPayment,continuePayment,paymentNextHint}` vi + en (mirrored, JSON hợp lệ); tái dùng `cart.itemSaving`
- [x] 4.2 Cập nhật `index.test.tsx`: khẳng định có tabs + tóm tắt + CTA "Tiếp tục thanh toán" cho biến thể trọn khóa; giữ test gói-free + test no-product
- [x] 4.3 `npx tsc --noEmit` sạch + `npm run build` (webpack) xanh + `PackageGateModal`/`enrollCta` test xanh
