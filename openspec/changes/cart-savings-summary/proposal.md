# cart-savings-summary — Giỏ hàng hiển thị tổng tiền, số tiền tiết kiệm và % giảm (như StarCi)

## Why
Mini-cart popover hiện chỉ hiển thị một dòng "Tạm tính ₫853,000" trơ trọi + nút Thanh
toán + Xem giỏ hàng. Từng dòng sản phẩm ĐÃ có chip giảm giá (−47%, −15%) với giá gốc gạch
ngang, tức là mỗi dòng đã sẵn `unitPrice` (giá tính) và `originalPriceVnd` (giá gốc). Người
mua muốn thấy — giống StarCi — TỔNG tiền, TIẾT KIỆM bao nhiêu, và % giảm ở cấp cả giỏ, chứ
không phải tự cộng nhẩm từng dòng. Toàn bộ con số này suy ra được ngay trên client từ giá
sẵn có; KHÔNG cần backend mới.

## What Changes
- **Savings summary (cả mini-cart lẫn trang `/cart`)** — thay dòng "Tạm tính" trơ bằng khối
  tóm tắt dùng chung `CartSavingsSummary`:
  - Dòng "Tổng cộng" = giá phải trả hiện tại, kèm TỔNG giá gốc gạch ngang + chip `−X%` khi có
    giảm (render bằng block `PriceTag` sẵn có → logic giảm giá không lệch giữa các nơi).
  - Dòng xanh "Bạn tiết kiệm {amount}" (`text-success`) = tổng giá gốc − tổng phải trả, chỉ
    hiện khi > 0.
- **Per-item "Tiết kiệm {amount}"** trên `CartLineItem`: dòng caption xanh nhỏ dưới `PriceTag`
  cho những dòng có giảm giá.
- **Helper thuần `computeCartSavings(items, subtotal)`** (không React) suy ra
  `currentTotal / originalTotal / savedAmount / savedPercent / hasSavings` từ per-line list vs
  charged; dùng `subtotal` do BE trả làm current total để tóm tắt KHÔNG lệch số ở footer, và
  `originalTotal = currentTotal + savedAmount` để % khớp đúng chip của `PriceTag`.
- i18n `cart.{total,savings,itemSaving}` (vi + en, mirrored).
- **KHÔNG làm thanh combo-discount**: FTES commerce API hiện KHÔNG có giá combo/bundle/
  quantity-discount (khác StarCi có `coursesCheckoutPreview` trả `bundleBonusPercent`). Không
  bịa giảm giá combo giả — bỏ thanh combo, chờ BE. Savings summary (số THẬT) là trọng tâm.

## Capabilities
### New Capabilities
- `cart-savings-summary`: khối tóm tắt tiết kiệm cấp giỏ (tổng gốc gạch ngang, tổng phải trả,
  số tiền tiết kiệm, % giảm) + per-item saving, suy ra client-side từ giá per-line.

## Impact
FE-only, KHÔNG cần API mới. Component mới `CartSavingsSummary` + helper thuần `cartSavings.ts`;
sửa `MiniCartDrawer`, `CartShell`, `CartLineItem` (tất cả dùng lại `PriceTag` + design tokens).
Combo-discount progress là tính năng BE chưa có → gắn cờ nợ, không hiện thanh giả. Build xanh.
