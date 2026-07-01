# PaymentModal — UX brainstorm V2 (2026-06-24)

> Nối tiếp `UX-BRAINSTORM.md` (2026-06-21, đã ra bản summary-first hiện tại). V2 sửa 4 pain còn lại. KHÔNG code.

## Dữ liệu THẬT (BE — đào lại 2026-06-24)
- `coursePricePreview(courseId) -> { originalPriceVnd, discountedPriceVnd, discountPercent, originalPriceUsd|null, discountedPriceUsd|null, discountReason, enrolledCount }`.
- `discountReason`: `none | enrolledCount | diligent | both`. Loyalty = **+5%/khóa sở hữu** (cap 30%) **+5% nếu chăm** (streak≥7 HOẶC totalPoints≥1000), cap 30%.
- Checkout: `courseEnroll`/`purchaseAiSubscription`/`purchaseMembership` → `{ checkoutUrl, referenceId, transactionId, amount, checkoutFields? }` (transaction `pending` → redirect/form-POST).
- `PaymentType`: `payos|sepay` (VND nội địa) · `stripe|paypal|crypto` (USD quốc tế). **USD chỉ có khi phase có `priceUsd`; `Regular` (đa số khóa) KHÔNG có** → quốc tế vô dụng.
- Membership ~$5/mo (giá hardcode service, **không có field `membership.price`**).

## Pain còn lại
1. **Nhóm "Quốc tế" hiện cả khi KHÓA** (no-USD) → 3 hàng disabled + dòng `intlNoUsd` = rác, mặc định đa số khóa dính.
2. **Discount mỏng**: có `discountReason`+`enrolledCount` nhưng FE chỉ 1 chip `−%` — không nói VÌ SAO.
3. **Nút generic** — Baymard: nhãn redirect rõ "Tiếp tục với X →" giảm do dự trước khi rời site.
4. **Trust mỏng** — high-ticket VND cần trấn an mạnh (Baymard: trust inline +18% completion).

## Refs
- [Baymard checkout](https://baymard.com/learn/checkout-flow-ux-optimization) · [Evil Martians payment form](https://evilmartians.com/chronicles/payment-form-best-coding-practices-that-dont-drop-sales) · [DesignStudio checkout UX](https://www.designstudiouiux.com/blog/ecommerce-checkout-ux-best-practices/) · Stripe Checkout (1 currency/lần).

## Hướng
- **A — Minimal:** ẩn quốc tế khi no-USD + nhãn redirect. Ít rủi ro, bỏ phí data discount.
- **B — Two-step (review→pay):** thừa 1 click cho 1-SKU.
- **C — Single-screen + loyalty panel (CHỐT):** (1) breakdown loyalty đọc `discountReason`+`enrolledCount` ("Sở hữu 3 khóa −15% · Học chăm −5%"); (2) chỉ render cổng hợp lệ (no-USD ẩn hẳn quốc tế; có USD → toggle VND/USD, 1 currency/lần); (3) nút redirect rõ; (4) trust row mạnh (mã hoá · không lưu thẻ · badge cổng).

## Section → data
| Section | Field | Ghi chú |
|---|---|---|
| Order summary | course.title · `discountedPriceVnd` · `originalPriceVnd` · `discountPercent` | struck khi discount |
| Loyalty breakdown (MỚI) | `discountReason` · `enrolledCount` | enrolled −N×5% · diligent −5% |
| Method list | `PaymentType` lọc theo `priceUsd!=null` | no-USD → chỉ payos/sepay |
| Currency toggle (có USD) | `discountedPriceVnd`/`discountedPriceUsd` | 1 currency/lần |
| Trust row | tĩnh | lock + "không lưu thẻ" |

## Cắt / thêm
- **Cắt:** nhóm quốc tế khoá-mờ + `intlNoUsd` (no-USD ẩn cả nhóm).
- **Thêm:** loyalty breakdown · nhãn redirect · trust mạnh. KHÔNG cần field BE mới.
- Membership: cân nhắc thêm field giá ở query (hỏi thầy) thay vì i18n hardcode.

→ Widget đã vẽ trong chat. CHỐT hướng → `/starci-fe-ux-apply`.
