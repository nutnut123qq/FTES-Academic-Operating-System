# PremiumGateModal — UX brainstorm (2026-06-24)

> KHÔNG code — brainstorm + chốt hướng. Target: `components/modals/PremiumGateModal/index.tsx`.

## Inventory hiện tại
- Gate hiện khi click feature premium trên bài "đọc thử". Dismissable (giữ teaser).
- Nội dung: lock icon (warning) + `course.paywall.title` + `course.paywall.description` + 1 nút "Mua" → `close()` + mở PaymentModal (CourseEnroll).
- **Rất mỏng** — chỉ tiêu đề + 1 dòng + nút.

## Pain
1. **Không bán giá trị** — gate là **conversion surface** nhưng không nói mở khoá ĐƯỢC GÌ, không neo giá. Chỉ "Mua".
2. Bỏ phí data sẵn có: `myCourseOutline` (số bài/challenge/capstone) + `coursePricePreview` (giá + loyalty discount) → có thể làm value list + price anchor mà KHÔNG cần BE mới.
3. **Vi phạm rule:** icon `@gravity-ui` (`Lock`, `ShoppingCart`) → **phosphor** (`LockIcon`, `ShoppingCartIcon`). `gap-1.5` ở header → cấm (→ `gap-2`).

## Refs ngành (paywall / upgrade modal)
- SaaS upgrade modal value-first (Notion/Linear/Figma "what you unlock"); [Baymard](https://baymard.com/learn/checkout-flow-ux-optimization) (anchor giá + 1 CTA rõ); giá có discount = đòn bẩy mua ngay.

## Hướng
- **A — Polish:** đổi icon phosphor + fix gap. Tối thiểu, vẫn không bán giá trị.
- **B — Value-first paywall (CHỐT):** lock header → 1 dòng value prop ("đang đọc thử, mở khoá để học trọn") → **bullet "bạn mở khoá"** (N bài · M challenge · dự án cá nhân — đọc từ outline) → **price anchor** (`discountedPriceVnd` struck `originalPriceVnd` + chip `−% loyalty` từ `coursePricePreview`) → 1 CTA "Mở khoá khóa học" → PaymentModal. Giữ dismissable.
- **C — Bảng so sánh free vs premium:** nặng cho 1 modal; để dành landing page.

## Section → data
| Section | Field BE | Ghi chú |
|---|---|---|
| Header | `course.paywall.title` (i18n) | + lock phosphor |
| Value prop | `course.paywall.description` | giữ |
| Unlock bullets (MỚI) | `myCourseOutline` (counts bài/challenge/milestone) | reuse query |
| Price anchor (MỚI) | `coursePricePreview` (`discountedPriceVnd`/`originalPriceVnd`/`discountPercent`) | đòn bẩy mua |
| CTA | mở PaymentModal CourseEnroll | giữ |

## Cắt / thêm
- **Cắt:** `@gravity-ui` import · `gap-1.5`.
- **Thêm:** unlock bullets · price anchor (loyalty). KHÔNG cần BE mới (đều reuse query có sẵn).
- Lưu ý: cần `course` trong store để lấy id cho `coursePricePreview` (PaymentModal đã đọc `state.course.entity` → cùng nguồn).

→ Widget đã vẽ trong chat. CHỐT hướng → `/starci-fe-ux-apply`.

---

## Follow-up 2026-06-24 — PriceTag dùng chung + lock ghi đè icon tab (CHƯA apply)
> Thầy chỉ: giá phải đúng-đã-giảm + dùng CHUNG component với PaymentModal; tab khoá thì lock GHI ĐÈ icon gốc.

### Vấn đề
1. **Giá sai/thiếu giảm** (cùng bug PaymentModal): `PremiumGateModal` gate struck+chip theo `price.discountPercent > 0` (LOYALTY only = 0 hầu hết) → khoản giảm thật (`originalPriceVnd > discountedPriceVnd`) không hiện. `PremiumPaywall` inline **không hiện giá** gì.
2. **Lặp render giá ≥3 nơi** (`CoursePricingRail`, `PaymentModal`, `PremiumGateModal`) → sửa bug phải sửa N chỗ.
3. **Tab "Thử thách" khoá hiện 2 icon** — `TabTrigger` render `<TabIcon/>` (puzzle) + `<LockIcon/>` riêng. Thầy: lock GHI ĐÈ (chỉ lock khi khoá).

### Hướng CHỐT (refactor + fix, ref Udemy/Coursera/Medium: giá mới đậm + giá gốc gạch + badge %)
- **A. Block dùng chung `PriceTag` (`blocks/commerce/PriceTag`):** render discounted bold + struck original + −% chip, gate theo **chênh lệch giá thật** (`originalVnd > discountedVnd`), % = `discountPercent` nếu >0 else `round((1-discounted/original)*100)`. Props `{discountedVnd, originalVnd?, percent?, size?, className?}`. Dùng ở **PaymentModal summary** (thay block inline), **PremiumGateModal**, **PremiumPaywall**, (khuyến nghị) **CoursePricingRail** VND. → 1 nguồn render giá, hết tái diễn bug.
- **B. PremiumGateModal:** khối giá → `<PriceTag size="lg">` (bỏ gate loyalty). **BỎ lock icon ở header** (chỉ còn tiêu đề). **CTA "Đăng ký khóa học"** (enroll) — đổi i18n `course.paywall.buy` "Mở khoá khóa học" → "Đăng ký khóa học" (vi) / "Enroll in course" (en); desc dùng "Đăng ký để học trọn khóa".
- **C. PremiumPaywall inline:** THÊM `<PriceTag>` (đang thiếu giá) — fetch `coursePricePreview` như modal.
- **D. TabTrigger:** `const Icon = locked ? LockIcon : TabIcon` → 1 icon; bỏ `<LockIcon/>` trailing. Thêm `aria-label` "đã khoá".

### Rules sẽ ghi (sau khi apply)
- `elements/` — block `PriceTag` (1 nguồn render giá khuyến mãi).
- `concepts/` — "1 đại lượng = 1 component render dùng chung" (đừng copy logic hiển thị ra N nơi → bug lệch); "icon TRẠNG THÁI ghi đè icon gốc, KHÔNG cộng dồn" (locked → lock thay icon, không icon+lock).

→ Widget follow-up đã vẽ trong chat. Thầy duyệt → `/starci-fe-ux-apply`.
