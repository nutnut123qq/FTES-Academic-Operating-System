## 1. Types & contract

- [x] 1.1 Reshape `modules/types/payment.ts`: thay `PaymentContext` union theo-flow bằng payload phẳng `{ itemIds: string[]; title: string; amountVnd: number; amountCoin?: number }`; giữ `PaymentType` enum PG cũ nguyên vẹn. ✅ (verify code: PaymentContext phẳng {itemIds,title,amountVnd,amountCoin?,onSuccess?}; enum PaymentType giữ ở `modules/types/enums/payment-type.ts`)
- [x] 1.2 Thêm order-status union FE (`OrderStatus`) + helper `isTerminalOrderStatus(status)` (PAID/SUCCESS/FAILED/CANCELLED/EXPIRED/REFUNDED = terminal) trong `modules/api/rest/commerce/types.ts` (hoặc file kề). ✅ (verify code: `OrderStatus` union + `isTerminalOrderStatus`/`isPaidOrderStatus` tại commerce/types.ts)

## 2. Data hooks

- [x] 2.1 `useGetOrderSwr(orderId, opts?)`: thêm option `poll?: boolean` → khi bật, `refreshInterval: (d) => isTerminalOrderStatus(d?.status) ? 0 : 3000`, `refreshWhenHidden:false`; key `null` khi `!orderId`. ✅ (verify code: `queries/useGetOrderSwr.ts` khớp chính xác)
- [x] 2.2 Xác nhận có sẵn hook ví (`useGetMyWalletSwr`) để đọc balance; nếu cần, dùng thẳng trong modal. Không tạo hook top-up. ✅ (verify code: `queries/useGetMyWalletSwr.ts` tồn tại, dùng thẳng trong PaymentModal)

## 3. PaymentModal (capability commerce-payment-modal)

- [x] 3.1 Tạo `components/modals/PaymentModal/index.tsx` theo mẫu `AppearanceModal` (Modal.Backdrop → Container → Dialog), đọc `usePaymentOverlayState()` → `{ isOpen, setOpen, close, context }`; render null khi `!context`.
- [x] 3.2 State máy: `choose | awaiting | success | failed`; sinh `idempotencyKey` (`crypto.randomUUID()`) mỗi lần mở; reset khi đóng.
- [x] 3.3 Summary (title + amount VND) + chọn method [VietQR | Xu]; Xu chỉ hiện khi `context.amountCoin != null`.
- [x] 3.4 VietQR: ô coupon → `usePostValidateCouponSwr` hiện discount/net hoặc lỗi; nút "Thanh toán" → `usePostCheckoutSwr({ itemIds, couponName?, payMethod:"VIETQR", idempotencyKey })`.
- [x] 3.5 Sau checkout VietQR → `awaiting`: render `reuseable/QRCode data={qrCode}` + `useGetOrderSwr(orderId,{poll:true})`; PAID → `success` (mutate cart + wallet); EXPIRED/CANCELLED/FAILED → `failed` (retry).
- [x] 3.6 Xu: hiện balance (`useGetMyWalletSwr`), disable khi `balance < amountCoin`; "Thanh toán" → checkout `payMethod:"COIN"` → PAID → `success` (mutate wallet); lỗi thiếu xu → thông báo.
- [x] 3.7 Đóng modal → poll dừng (gate key), reset state.
- [x] 3.8 Mount `<PaymentModal />` trong `components/modals/ModalContainer.tsx`.

## 4. Buy-now (capability commerce-buy-now)

- [x] 4.1 `MarketplaceCatalog`: nút "Mua ngay" `onPress` → `usePostAddCartItemSwr({ productId, quantity:1 })` → mở `paymentOverlay.open({ itemIds:[res.id], title:product.name, amountVnd:product.priceVnd, amountCoin:product.priceCoin })`.
- [x] 4.2 Loading/disable nút khi request bay; lỗi add-cart → toast/inline, không mở modal.

## 5. Cart (capability commerce-cart)

- [x] 5.1 `MarketplaceCatalog`: thêm nút "Thêm vào giỏ" → `usePostAddCartItemSwr` → `mutate("GET_CART_SWR")`.
- [x] 5.2 Tạo `components/features/cart/CartShell/index.tsx`: `useGetCartSwr` list item (tên/giá) + subtotal; nút xoá → `usePostRemoveCartItemSwr` + mutate; empty state; nút "Thanh toán" → `paymentOverlay.open({ itemIds: allIds, title, amountVnd: subtotal })`.
- [x] 5.3 Route `app/[locale]/cart/page.tsx` render `CartShell`; skeleton theo AsyncContent.

## 6. i18n

- [x] 6.1 Mở rộng namespace `payment` (method labels, coupon, xu/balance, awaiting/success/failed/insufficient) + thêm key `cart`/marketplace (buyNow, addToCart, checkout, empty, subtotal, remove) vào `messages/vi.json` + `messages/en.json` (cùng path, JSON sạch).

## 7. Verify

- [x] 7.1 `tsc --noEmit` sạch.
- [x] 7.2 `npm run build` (webpack) xanh.
- [x] 7.3 Rà runtime cơ bản (dev): mở modal buy-now, đổi method, apply coupon, QR render, poll gọi đúng endpoint (không cần PAID thật).
