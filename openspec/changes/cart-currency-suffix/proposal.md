# cart-currency-suffix — Số tiền tiết kiệm trong giỏ dùng ĐÚNG định dạng ₫-hậu-tố như giá

## Why
Trong card giỏ hàng, GIÁ render qua block `PriceTag` theo định dạng nhà `299.000₫` /
`350.000₫` — ký hiệu `₫` ĐỨNG SAU số, ngăn cách nghìn bằng dấu chấm. Nhưng dòng tiết kiệm
lại render `Save ₫102,000` / `You save ₫267,000` — ký hiệu ₫ ĐỨNG TRƯỚC số và ngăn cách bằng
DẤU PHẨY. Cùng một card mà hai kiểu tiền → lệch, khó đọc.

Gốc rễ:
- Key i18n `cart.priceVnd` ở `en.json` là `₫{amount}` (tiền tố) trong khi `vi.json` là
  `{amount}₫` (hậu tố) → lệch giữa hai locale.
- `CartSavingsSummary` và `CartLineItem` format số bằng `useFormatter().number(amount)` (theo
  locale → dấu phẩy ở `en`) rồi bọc bằng `cart.priceVnd`, thay vì dùng đúng định dạng nhà mà
  `PriceTag` dùng cho GIÁ (`toLocaleString("vi-VN")` + hậu tố `₫`).

## What Changes
- **Tách helper tiền dùng chung `formatVnd`** — export từ block `PriceTag`
  (`src/components/blocks/commerce/PriceTag`), đúng định dạng nhà `${amount.toLocaleString("vi-VN")}₫`
  (ký hiệu SAU số, dấu chấm ngăn nghìn, không phụ thuộc locale). `PriceTag.formatPrice` nhánh VND
  dùng lại chính helper này → một nguồn sự thật.
- **`CartSavingsSummary`** — dòng "Bạn tiết kiệm {amount}" format qua `formatVnd(savedAmount)`
  thay vì `t("priceVnd", { amount: format.number(...) })`. Bỏ `useFormatter` thừa.
- **`CartLineItem`** — caption "Tiết kiệm {amount}" format qua `formatVnd(saving)`. Bỏ
  `useFormatter` thừa.
- **i18n** — `cart.savings` / `cart.itemSaving` nội suy CHUỖI TIỀN đã format sẵn (không hardcode
  `₫` trước số). Gỡ key `cart.priceVnd` (giờ chết) khỏi cả `en.json` lẫn `vi.json`. Giữ nguyên
  màu xanh `text-success`. `marketplace.priceVnd` là key KHÁC (namespace khác) → không đụng.

## Impact
FE-only, KHÔNG cần API mới. Sửa `PriceTag` (thêm export `formatVnd`), `CartSavingsSummary`,
`CartLineItem`, `messages/en.json`, `messages/vi.json`. Số tiền tiết kiệm giờ đọc `267.000₫` /
`102.000₫` — khớp hệt giá trên card ở mọi locale (VND là tiền tệ bất kể locale). Build xanh.
