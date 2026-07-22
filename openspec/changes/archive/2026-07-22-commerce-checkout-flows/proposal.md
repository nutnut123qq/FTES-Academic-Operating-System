## Why

Tầng API + SWR hook commerce (checkout / cart / coupon / order) đã dựng đầy đủ nhưng **không component nào tiêu thụ** — người dùng chưa có cách nào trả tiền: nút "Mua" ở Marketplace và CTA enroll đều no-op, không có trang giỏ hàng. Cần nối UI để mở 2 luồng mua thật: **mua-ngay bằng QR** và **giỏ hàng → checkout**, cả hai áp coupon và cho trả bằng xu ví.

## What Changes

- **PaymentModal (mới, global overlay)**: 1 modal dùng chung cho mọi luồng — chọn phương thức [VietQR | Xu], nhập coupon (chỉ VietQR), hiện QR + poll trạng thái đơn tới `PAID`/`EXPIRED`, hoặc trả bằng xu (COIN) → `PAID` ngay. Mount vào `ModalContainer`.
- **Luồng 1 — Mua ngay (Marketplace)**: nút "Mua ngay" → `addCartItem` ngầm → mở PaymentModal với cart-item vừa tạo.
- **Luồng 2 — Giỏ hàng**: thêm nút "Thêm vào giỏ" ở Marketplace; trang `/cart` mới (list `getCart` + xoá item) với nút "Thanh toán" → mở PaymentModal với toàn bộ cart-item.
- **Trả bằng xu**: tab COIN trong PaymentModal hiển thị số dư ví (`getMyWallet`); đủ xu → checkout `payMethod=COIN`. **BREAKING (nội bộ, 0 consumer)**: reshape `PaymentContext` (`modules/types/payment.ts`) từ union theo-flow (course/subscription/membership) sang payload mang `{ itemIds, title, amountVnd, amountCoin? }`.
- **Poll đơn**: `useGetOrderSwr` thêm option `refreshInterval` (dừng khi đơn ở trạng thái terminal) để chờ webhook BE đổi `AWAITING_PAYMENT → PAID`.
- **i18n**: mở rộng namespace `payment` + thêm key `cart`/marketplace (vi.json + en.json).

## Capabilities

### New Capabilities

- `commerce-payment-modal`: Modal thanh toán dùng chung — chọn phương thức (VietQR/COIN), áp coupon (validate hiện số giảm, chỉ VietQR), hiện QR + poll đơn tới PAID/EXPIRED, hoặc trả bằng xu ví → PAID ngay; báo lỗi thiếu xu / hết hạn.
- `commerce-buy-now`: Luồng "Mua ngay" ở Marketplace — add-to-cart ngầm rồi mở PaymentModal cho đúng 1 sản phẩm.
- `commerce-cart`: Trang giỏ hàng `/cart` (liệt kê + xoá item) và nút "Thêm vào giỏ" ở Marketplace; nút Thanh toán mở PaymentModal cho toàn giỏ.

### Modified Capabilities

<!-- Không sửa requirement của spec hiện có. Commerce chưa có spec nào. -->

## Impact

- **FE code mới**: `components/modals/PaymentModal/`, `app/[locale]/cart/page.tsx` + `components/features/cart/CartShell/`, mount trong `components/modals/ModalContainer.tsx`.
- **FE code sửa**: `modules/types/payment.ts` (reshape `PaymentContext`), `hooks/swr/api/rest/queries/useGetOrderSwr.ts` (option poll), `MarketplaceCatalog` (2 nút), `messages/{vi,en}.json`.
- **Dùng lại (không đổi)**: `commerce.ts` + các hook checkout/cart/coupon/order, `reuseable/QRCode`, overlay slot `payment` + `usePaymentOverlayState`.
- **Contract BE (đã xác thực, không đổi)**: `POST /commerce/checkout`, `POST /commerce/coupons/validate`, `GET /commerce/orders/{id}`, `GET /wallet/me`. Poll thay cho WS (BE không có SSE/WS).
- **Giả định / ngoài scope**: `qrCode` BE trả là **string placeholder** (chưa nối cổng thật) → QR mang tính demo. **Nạp xu (top-up) bằng tiền — KHÔNG có endpoint BE → không làm**. Trang orders/invoice/refund, wiring CourseEnroll (data mock + course→product chưa rõ), tích hợp cổng/webhook thật (BE) — defer.
