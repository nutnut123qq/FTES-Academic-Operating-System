# checkout-savings-no-quantity — Modal thanh toán hiện giá gốc/tiết kiệm + bỏ số lượng khỏi giỏ

## Why
Modal thanh toán chung (`PaymentModal`) hiện chỉ in tiêu đề sản phẩm + số tiền phải trả. Ở
giỏ hàng thì mỗi dòng ĐÃ hiện giá gốc gạch ngang + chip `−X%` (qua `PriceTag`) và
`CartSavingsSummary` đã tổng kết tiết kiệm — nhưng đến bước checkout, người mua lại KHÔNG thấy
mình đang được giảm bao nhiêu. Cần đưa "giá gốc gạch ngang + Tiết kiệm {số tiền} (−{phần
trăm}%)" vào ô tóm tắt của modal cho đơn VND có giảm giá, dùng lại đúng block `PriceTag` +
`text-success` như giỏ hàng để logic giảm giá không lệch giữa các nơi.

Đồng thời, hệ thống thêm mỗi khóa học vào giỏ ĐÚNG MỘT LẦN (quantity luôn = 1). Dòng caption
"Số lượng: N" và các phép `× quantity` trong giỏ là dư thừa và dễ gây hiểu nhầm (khóa học
không mua theo số lượng). Bỏ số lượng khỏi HIỂN THỊ và PHÉP TÍNH, nhưng GIỮ field `quantity`
trong REST types và vẫn gửi `quantity: 1` khi add-to-cart (đúng hợp đồng BE).

## What Changes
- **Giá gốc / tiết kiệm trong ô tóm tắt của `PaymentModal`** (chỉ nhánh VND, chỉ khi có giảm):
  - Cặp giá (giá phải trả + giá gốc gạch ngang + chip `−X%`) render bằng block `PriceTag` sẵn
    có → khớp look của `CartSavingsSummary`.
  - Dòng xanh `text-success` "Tiết kiệm {amount} (−{percent}%)".
  - `saved = originalAmountVnd − amountVnd`, `percent = round(saved/originalAmountVnd×100)`,
    chỉ tính khi `originalAmountVnd > amountVnd` và phương thức là VND. Nhánh Xu (COIN) KHÔNG
    có giá gốc → không hiện tiết kiệm.
- **Truyền giá gốc qua `PaymentContext.originalAmountVnd`** (optional; bỏ khi không có giảm):
  - `CartShell` + `MiniCartDrawer`: `computeCartSavings(items, subtotal).originalTotal` (bỏ khi
    `!hasSavings`).
  - `CourseDetail.onBuyPackage`: giá gốc của gói (`selectedPackage.originalPrice`) khi > số tiền
    charged.
  - `useCourseEnrollment.onEnroll` (mua-ngay khóa lẻ): `course.price.originalVnd` (thêm
    `originalPriceVnd` vào buy-context) khi > số tiền charged.
- **Bỏ số lượng khỏi giỏ (hiển thị + phép tính)**:
  - `CartLineItem`: bỏ caption "Số lượng: N"; per-line saving = `original − unitPrice` (bỏ
    `× quantity`).
  - `cartSavings.ts`: `lineCharged = unitPrice` và `lineSaving = original − unit` (bỏ
    `× quantity`).
  - GIỮ `quantity` trong `commerce/types.ts` và `addCart.trigger({ productId, quantity: 1 })`.
  - Gỡ key i18n `cart.quantity` (không còn tham chiếu) khỏi vi + en.
- i18n `payment.checkout.savings` (vi + en, mirrored, cùng cách đặt ₫ như `amountVnd`).

## Capabilities
### New Capabilities
- `checkout-savings-no-quantity`: modal thanh toán hiện giá gốc gạch ngang + số tiền/% tiết kiệm
  cho đơn VND có giảm giá; giỏ hàng bỏ số lượng khỏi hiển thị và phép tính (khóa mua 1 lần).

## Impact
FE-only, KHÔNG cần API mới. Sửa: `modules/types/payment.ts`, `PaymentModal`, `CartShell`,
`MiniCartDrawer`, `CourseDetail`, `useCourseEnrollment`, `CartLineItem`, `cartSavings.ts`, 2
file i18n; thêm `cartSavings.test.ts`. Dùng lại `PriceTag` + `computeCartSavings` + design
tokens (`text-success`). `tsc --noEmit` sạch + vitest xanh (Vercel CI chạy webpack build thật).
