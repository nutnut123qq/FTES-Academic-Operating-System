# Tasks — checkout-savings-no-quantity

## 1. Plumb the list price into the payment context
- [x] 1.1 `modules/types/payment.ts`: thêm `originalAmountVnd?: number` (giá gốc VND trước giảm; bỏ khi không có giảm)
- [x] 1.2 `CartShell.checkout` + `MiniCartDrawer.checkout`: `computeCartSavings(items, subtotal).originalTotal`, truyền `originalAmountVnd` khi `hasSavings` (else `undefined`)
- [x] 1.3 `CourseDetail.onBuyPackage`: `originalAmountVnd = Number(selectedPackage.originalPrice)` khi > `amountVnd` charged
- [x] 1.4 `useCourseEnrollment`: thêm `originalPriceVnd` vào `CourseEnrollmentBuyContext`, truyền `originalAmountVnd` khi > `amountVnd`; `CourseDetail` truyền `course.price.originalVnd` vào buy-context

## 2. Savings display in PaymentModal summary
- [x] 2.1 `PaymentModal`: `showSavings = method === "VIETQR" && originalAmountVnd > amountVnd`; `savedVnd`/`savedPercent` chỉ tính khi đó
- [x] 2.2 Ô tóm tắt: khi `showSavings` render `PriceTag` (discounted = amountVnd, original = originalAmountVnd → gạch ngang + chip `−X%`); else giữ dòng số tiền cũ (VND/Coin)
- [x] 2.3 Dòng xanh `text-success` "Tiết kiệm {amount} (−{percent}%)"; nhánh Xu KHÔNG hiện
- [x] 2.4 i18n `payment.checkout.savings` vi + en (mirrored, cùng cách đặt ₫ như `amountVnd`)

## 3. Remove quantity from the cart (display + math)
- [x] 3.1 `CartLineItem`: bỏ caption "Số lượng: N"; `saving = original − unitPrice` (bỏ `× quantity`)
- [x] 3.2 `cartSavings.ts`: `lineCharged = unitPrice`, `lineSaving = original − unit` (bỏ `× quantity`) + cập nhật doc
- [x] 3.3 Rà `PackageGateModal` / `MarketplaceCatalog` / `CartShell` / `MiniCartDrawer`: không có control/label số lượng hiển thị (chỉ còn `quantity: 1` khi add-to-cart — GIỮ)
- [x] 3.4 GIỮ `quantity` trong `commerce/types.ts` + `addCart.trigger({ productId, quantity: 1 })`
- [x] 3.5 Gỡ key i18n `cart.quantity` (không còn tham chiếu) khỏi vi + en

## 4. Verify
- [x] 4.1 `cartSavings.test.ts`: khẳng định math bỏ quantity (list − charged, không × qty) + `computeCartSavings`
- [x] 4.2 `node_modules/.bin/tsc --noEmit` → exit 0
- [x] 4.3 `node_modules/.bin/vitest run src/components/features/cart src/components/modals/PaymentModal` → xanh (10 test)
