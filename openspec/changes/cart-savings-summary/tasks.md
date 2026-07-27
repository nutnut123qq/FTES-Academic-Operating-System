# Tasks — cart-savings-summary

## 1. Savings computation
- [x] 1.1 Helper thuần `src/components/features/cart/cartSavings.ts`: `lineSaving(item)` + `computeCartSavings(items, subtotal?)` → `{ currentTotal, originalTotal, savedAmount, savedPercent, hasSavings }`, dùng `subtotal` BE làm current total, `originalTotal = currentTotal + savedAmount`
- [x] 1.2 Cùng quy tắc "giá gốc chỉ tính khi > giá charged" như `CartLineItem` → chip per-row và tóm tắt không lệch

## 2. Savings summary component
- [x] 2.1 `CartSavingsSummary` (`features/cart/CartSavingsSummary`): dòng "Tổng cộng" + `PriceTag` (discounted = tổng phải trả, original = tổng gốc khi có giảm → gạch ngang + chip `−X%`)
- [x] 2.2 Dòng xanh "Bạn tiết kiệm {amount}" (`text-success`) chỉ hiện khi `hasSavings`
- [x] 2.3 Một template tiền duy nhất qua `cart.priceVnd` (mirror format app), dùng `useFormatter`

## 3. Wire vào cả 2 surface
- [x] 3.1 `MiniCartDrawer` footer: thay dòng "Tạm tính" trơ bằng `CartSavingsSummary`; gỡ import `Typography`/`useFormatter` thừa
- [x] 3.2 `CartShell` (`/cart`): thay dòng "Tạm tính" bằng `CartSavingsSummary` trong khối `border-t pt-4`; gỡ `useFormatter` thừa
- [x] 3.3 `CartLineItem`: caption xanh "Tiết kiệm {amount}" dưới `PriceTag` khi dòng có giảm giá

## 4. Combo-discount (khảo sát)
- [x] 4.1 Rà `modules/api` (REST commerce + GraphQL): KHÔNG có combo/bundle/quantity-discount/checkout-preview → KHÔNG dựng thanh combo, gắn cờ nợ BE

## 5. i18n & verify
- [x] 5.1 i18n `cart.{total,savings,itemSaving}` vi + en (mirrored, JSON hợp lệ)
- [x] 5.2 `npx tsc --noEmit` sạch + `npm run build` (webpack) xanh
