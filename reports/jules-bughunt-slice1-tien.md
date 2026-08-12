## [P0] Stale UI "Đăng ký học" sau khi thanh toán Course qua thẻ Legacy Buy
- File: src/components/features/course/hooks/useCourseEnrollment.ts:110
- Trigger: User vào trang chi tiết khóa học LEGACY (không phải PACKAGE), nhấn "Đăng ký học". Modal payment mở lên và user thanh toán qua VietQR (hoặc Xu). Sau khi thanh toán thành công, user nhấn Done và modal đóng lại.
- Expected vs Actual: Expected: Giao diện khóa học tự tải lại và cập nhật thay nút "Đăng ký học" bằng "Tiếp tục học" (vì người dùng đã mua khóa học). Actual: Vì lời gọi `payment.open({ ... })` trong `useCourseEnrollment` không hề chứa hàm `onSuccess` để gọi mutate, dữ liệu SWR `useQueryCourseDetailSwr` không tự động revalidate sau thanh toán thành công. Kết quả là nút "Đăng ký học" không bị disable hay ẩn đi, user nếu không F5 lại trang có thể bấm nhầm thêm một lần nữa và bị charge lần 2. (Trái ngược với `PackageGateModal` gọi `onPurchased`, ở đây `CourseDetail` có sẵn `onPurchased={() => { void mutate() }}` nhưng `EnrollCard` / `useCourseEnrollment` bị thiếu luồng pass prop này).
- Cause: Lời gọi `payment.open` thiếu thuộc tính `onSuccess` callback. `useCourseEnrollment` cần lấy callback này từ hook args và pass vào `payment.open`.
- Confidence: high
- Fix sketch: Thêm `onSuccess?: () => void` vào `CourseEnrollmentBuyContext` interface, pass nó từ `EnrollCard` (CourseDetail), và pass `onSuccess: buy?.onSuccess` vào `payment.open({ ... })`.

## [P2] Polling Order chỉ dừng khi BE đánh dấu terminal
- File: src/components/modals/PaymentModal/index.tsx:132
- Trigger: User bắt đầu tạo thanh toán VietQR và đi tới phần QR countdown. Đơn order giữ nguyên ở AWAITING_PAYMENT.
- Expected vs Actual: Expected: The poll stops if the order is abandoned. Actual: The poll only terminates when the backend marks the order terminal. If the backend never expires an AWAITING_PAYMENT order, the poll survives for the whole session — a backend-contract question, FE fix not warranted.
- Cause: `poll: phase === "awaiting" || expired` phụ thuộc vào `polledStatus`.
- Confidence: high
- Fix sketch: Không sửa (đây là backend-contract question).

## Đã kiểm tra và KHÔNG có lỗi
1. TWO independent checkout paths exist: `PackageGateModal` gọi trực tiếp `checkout.trigger` khi sản phẩm FREE, không truyền coupon. `PaymentModal` có form coupon. Hypothesis là coupon mất silent? Sai, vì coupon chỉ áp dụng có thể ở Payment step trong modal. Sản phẩm free = 0 VND thì logic skip payment modal là hợp lý, ko mất voucher.
2. cartSavings.ts computes savings client-side: đồng nhất rules `lineSaving`, list price chỉ tính khi list > sale.
3. Đóng PaymentModal polling: Polling past modal close is a DELIBERATE decision để ngân hàng chậm vẫn nhận được order success, tránh double-charge. FE không fix.
4. Double submission: disable in-flight. `PaymentModal` truyền `isDisabled={payPending || insufficient}` và `isBusy` guards ở CTA của PackageGateModal.
5. Cart cache sau mua thành công: có invalidate `void mutate("GET_CART_SWR")`.
6. Product resolution `canBuy`: phân biệt rõ `undefined` vs `false` với cờ `isResolvingProduct`.

Opened Files:
- src/components/modals/PaymentModal/index.tsx
- src/components/features/course/CourseDetail/index.tsx
- src/components/features/course/PackageGateModal/index.tsx
- src/components/features/course/hooks/useCourseEnrollment.ts
- src/hooks/swr/api/rest/queries/useGetOrderSwr.ts
- src/hooks/swr/api/rest/queries/useGetCourseProductSwr.ts
- src/components/features/cart/cartSavings.ts
- src/components/features/cart/CartShell/index.tsx
- src/modules/api/rest/commerce/types.ts
