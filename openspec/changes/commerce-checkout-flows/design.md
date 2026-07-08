## Context

Commerce có sẵn API client + SWR hooks (`checkout`, `getCart`/`addCartItem`/`removeCartItem`, `validateCoupon`, `getOrder`, `getMyWallet`) nhưng 0 consumer. Contract BE đã xác thực từ `FTES-AOS-Backend`:

- `POST /commerce/checkout` `{ itemIds[], couponName?, payMethod: "VIETQR"|"COIN", idempotencyKey }` → `CheckoutResult{ orderId, amount?, amountCoin?, qrCode?, status }`.
- Order status: `PENDING, AWAITING_PAYMENT, PAID, FULFILLING, SUCCESS, FAILED, CANCELLED, EXPIRED, REFUNDED`. Checkout tạo đơn ở `AWAITING_PAYMENT` (VietQR) hoặc trả `PAID` ngay (COIN đủ xu).
- `qrCode` là **string placeholder** (`"VIETQR|amount=…|content=FTES <orderId>"`), chưa nối cổng thật.
- Coupon percent-only, **chỉ áp cho VietQR**; COIN bỏ coupon.
- Không SSE/WS → FE **poll** `GET /commerce/orders/{orderId}`.
- **Không** có endpoint nạp xu (top-up).

Component tái dùng: `reuseable/QRCode` (render QR từ string), `ModalContainer` + overlay slot `payment` + `usePaymentOverlayState`, namespace i18n `payment`.

## Goals / Non-Goals

**Goals:**
- 1 `PaymentModal` dùng chung cho cả 2 luồng, chọn VietQR/Xu, coupon (VietQR), QR + poll tới PAID, hoặc COIN trả ngay.
- Luồng 1 (Mua ngay) + Luồng 2 (giỏ → checkout) với dữ liệu Marketplace/cart thật.
- FE-only, khớp cannon, không thêm dependency.

**Non-Goals:**
- Nạp xu bằng tiền (top-up) — không có endpoint BE.
- Trang orders/invoice/refund, wiring CourseEnroll (data mock), tích hợp cổng/webhook thật.
- QR "thật" quét trả được — `qrCode` hiện là placeholder demo.

## Decisions

**D1 — 1 modal dùng chung, mở bằng overlay context mang `itemIds`.** Cả 2 luồng hội tụ về `checkout(itemIds,…)`, nên chỉ khác *nguồn itemIds* (buy-now = 1 item vừa add; cart = mọi item). Modal nhận `PaymentContext = { itemIds, title, amountVnd, amountCoin? }`. *Thay vì* 2 modal riêng (trùng logic coupon/QR/poll) hoặc trang checkout riêng (nặng, kém tái dùng).

**D2 — Reshape `PaymentContext` (BREAKING nội bộ, 0 consumer).** Union theo-flow cũ (course/subscription/membership) không mang itemIds và không ai dùng → thay bằng payload phẳng. Rẻ hơn là bọc thêm variant mới quanh union chết.

**D3 — Poll bằng SWR `refreshInterval` là hàm của data.** `useGetOrderSwr(orderId, { poll })`: `refreshInterval: (d) => isTerminal(d?.status) ? 0 : 3000`, key `null` khi `orderId` rỗng/modal đóng → dừng poll. Đúng pattern nhà (notifications polling). *Thay vì* thêm socket/SSE (BE không có).

**D4 — Buy-now = add-to-cart ngầm rồi checkout.** BE bắt buộc `itemIds` là cart-item id, không cho checkout thẳng productId → buy-now phải `addCartItem` trước, lấy `CartItemView.id`, mở modal. Chấp nhận đơn "rác" trong giỏ nếu người dùng bỏ ngang (BE dọn khi PAID/expire).

**D5 — Coupon & Xu loại trừ nhau theo method.** VietQR: hiện ô coupon + QR. Xu: ẩn coupon (BE bỏ), hiện số dư; thiếu xu → disable. Phản ánh đúng hành vi BE, tránh hứa điều BE không làm (trộn xu + QR).

**D6 — Trạng thái modal = máy trạng thái nhỏ.** `choose → (VietQR: awaiting → success/failed) | (COIN: success/failed)`. Mỗi checkout attempt sinh 1 `idempotencyKey` (`crypto.randomUUID()`), reset khi mở lại.

## Risks / Trade-offs

- **QR placeholder không quét trả được thật** → chỉ demo. Mitigation: ghi rõ giả định; khi BE nối cổng, `qrCode` đổi thành payload/URL thật, FE không phải sửa (chỉ truyền vào `QRCode`).
- **Đơn rác trong giỏ khi bỏ ngang buy-now** → Mitigation: dựa BE expire/cleanup; không tự xoá ở FE (tránh xoá nhầm khi user reload đang chờ QR).
- **Poll tốn request khi tab mở lâu** → Mitigation: `refreshWhenHidden:false`, dừng ở terminal, gate key `null` khi modal đóng.
- **Reshape `PaymentContext` phá type cũ** → Mitigation: đã xác nhận 0 consumer; `PaymentType` enum PG cũ (PayOS/SePay…) để nguyên, không đụng.
- **Race coupon/method**: đổi sang Xu sau khi đã apply coupon → clear coupon khỏi payload. Mitigation: chỉ đính `couponName` khi method=VIETQR.

## Migration Plan

FE-only, không migration dữ liệu. Rollback = gỡ mount `PaymentModal` + revert wiring (nút trở lại no-op). Verify `npm run build` (webpack) + `tsc --noEmit`.

## Open Questions

- Xu (COIN) có cần `amountCoin` từ đâu khi buy-now/cart? `ProductView.priceCoin` + `CheckoutResult.amountCoin`. Nếu sản phẩm không có `priceCoin` → ẩn tab Xu cho item đó (chỉ VietQR). (Giải quyết khi implement, không chặn.)
