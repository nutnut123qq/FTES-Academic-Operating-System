# Tasks — cart-currency-suffix

## 1. Shared VND formatter
- [x] 1.1 Export `formatVnd(amount)` từ `PriceTag` = `${amount.toLocaleString("vi-VN")}₫` (ký hiệu sau số, dấu chấm ngăn nghìn, không phụ thuộc locale)
- [x] 1.2 `PriceTag.formatPrice` nhánh VND dùng lại `formatVnd` → một nguồn sự thật cho định dạng giá

## 2. Reuse trong dòng tiết kiệm
- [x] 2.1 `CartSavingsSummary`: "Bạn tiết kiệm {amount}" dùng `formatVnd(savedAmount)`, bỏ `useFormatter` + helper `money`/key `priceVnd`
- [x] 2.2 `CartLineItem`: caption "Tiết kiệm {amount}" dùng `formatVnd(saving)`, bỏ `useFormatter`

## 3. i18n
- [x] 3.1 `cart.savings` / `cart.itemSaving` nội suy chuỗi tiền đã format (không hardcode `₫` trước số) — giữ nguyên `text-success`
- [x] 3.2 Gỡ key chết `cart.priceVnd` khỏi `en.json` (`₫{amount}`) và `vi.json` (`{amount}₫`); JSON hợp lệ, `marketplace.priceVnd` không đụng

## 4. Verify
- [x] 4.1 `npx tsc --noEmit` sạch (0 lỗi)
- [x] 4.2 `npm run build` (webpack) xanh
