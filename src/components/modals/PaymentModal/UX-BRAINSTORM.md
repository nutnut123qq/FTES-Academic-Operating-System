# UX-BRAINSTORM — PaymentModal: từ "chọn cổng" → "xác nhận MUA GÌ + GIÁ + chọn cổng" (2026-06-21)

> KHÔNG code — brainstorm + chốt hướng. MAX effort. Target: `components/modals/PaymentModal/index.tsx`
> (modal chọn phương thức thanh toán, dùng chung 3 flow: CourseEnroll · Membership · AI subscription).
> Legacy = inventory. Tư duy từ `main.md` §1 + Baymard checkout UX + Stripe/Gumroad pattern.

---

## 0. TL;DR
- **Bug lớn nhất:** modal CHỈ liệt kê 5 cổng thanh toán — **KHÔNG hiện MUA GÌ, GIÁ BAO NHIÊU, giảm bao nhiêu**.
  Người dùng chọn cổng **trong mù** (Baymard: review/checkout phải là "tóm tắt sự thật đã biết"; giá hiện bất ngờ
  sau đó = phá niềm tin). Đây là vi phạm nguyên tắc #1 của checkout.
- **Goldmine bỏ phí:** BE đã có **giảm giá loyalty** (`discountPercent` 0–30% + `discountReason`: sở-hữu-N-khóa /
  chăm-chỉ / cả-hai) — modal hiện **0 chữ** về nó. Đây là động lực mua mạnh ("bạn được giảm 15% vì đã có 2 khóa")
  mà đang giấu.
- **Sự thật về cổng:** cả 5 cổng (PayOS · Sepay · Stripe · PayPal · Crypto) **đều wired thật**, KHÔNG phải stub.
  NHƯNG **nội địa = VND, quốc tế = USD**; khoá Regular **không có giá USD → cổng quốc tế NÉM lỗi** cho khoá đó.
  → phải hiện đúng tiền tệ theo nhóm + ẩn/khoá quốc tế khi không có USD.
- **Chốt hướng: A — "Summary-first" (tóm tắt mua gì + giá + giảm ở TRÊN, rồi chọn cổng, trust ở dưới)** ✅.

---

## 1. Khoanh vùng (route + component)
| | |
|---|---|
| Component | `components/modals/PaymentModal/index.tsx` (266 dòng) — overlay zustand `usePaymentOverlayState` |
| Mở từ | nút Enroll (CourseDetail), Membership, AiSubscription TierCard → `.open(context)` |
| Context | `PaymentContext = { flow: CourseEnroll|Membership|AiSubscription, tier? }` |
| Hành vi | click 1 cổng → mutation (`courseEnroll`/`purchaseMembership`/`purchaseAiSubscription`) → redirect gateway / `/checkout/sepay` |
| Liên quan | `layouts/checkout/SepayCheckout/**` = trang QR+bank SAU khi chọn Sepay (đã có OrderSummary hiện amount) |

## 2. Dữ liệu THẬT (grounded — Explore BE)
| Cần hiện | Nguồn BE | Ghi chú |
|---|---|---|
| **Tên sản phẩm** | course `title` (redux) · "Membership" (config) · AI `tier.displayName` (`aiSubscriptionTiers` query) | |
| **Giá gốc → giảm → cuối** | course: `originalPrice(Usd)` + `pricingPhases[]` + **loyalty** (`CoursePricingService.resolveAmountVnd/Usd`); AI: `aiSubscriptionTiers.{priceVnd,priceUsd}`; membership: config `{priceVnd,priceUsd}` | course cần expose **price-preview** (xem §8 gap) |
| **% giảm + lý do** | `discountPercent` (0–30) + `discountReason` (`none|enrolledCount|diligent|both`) — pattern `recommendedCourses` | chip "Giảm 15% · đã sở hữu 2 khóa" |
| **Số tiền cuối** | mutation trả `amount` (VND) + `referenceId` + `transactionId` | có sau khi chọn cổng |
| **Tiền tệ** | nội địa VND (PayOS/Sepay) · quốc tế USD (Stripe/PayPal/Crypto) | Regular thiếu USD → `MissingUsdPriceException` |

## 3. Điểm đau (so Baymard/Stripe + `main.md`)
1. **Không "order summary"** — không product/price/discount trước khi chọn cổng (Baymard: order summary sticky,
   itemized, không phí bất ngờ). Đây là lỗi chí mạng của 1 modal thanh toán.
2. **Giấu giảm giá loyalty** — `discountReason`/`discountPercent` không hiện → mất 1 nudge mua mạnh.
3. **5 cổng phẳng, không tiền tệ** — không biết cổng nào VND/USD; quốc tế có thể NÉM lỗi (Regular thiếu USD)
   nhưng vẫn `disabled:false` → click rồi mới fail.
4. **0 trust signal** — Baymard: badge bảo mật cạnh CTA +10–32% conversion; modal không có "thanh toán an toàn/mã hoá".
5. **Legacy code smell:** `Card` + `onClick` (phải `PressableCard`/`onPress`); `gap-1.5` (lệch grid 0/2/3/4/6);
   text qua `<div>`+class thay vì `Typography`; không loading/empty/error cho giá.
6. **Vanity nhóm quốc tế** cho audience VN — PayPal/Crypto hiếm dùng; nên gập sau "Thanh toán quốc tế" thay vì
   bày ngang hàng nội địa (local methods = trust signal mạnh nhất với người Việt — Baymard).

## 4. Mục tiêu (≤10s, trong modal)
Người mua mở modal → thấy NGAY: **(a) mua gì**, **(b) tổng tiền + được giảm bao nhiêu/vì sao**, **(c) chọn 1 cổng
an toàn**. 1 primary = "chọn cổng → đi thanh toán". Cắt mọi thứ không phục vụ quyết định mua.

## 5. Ba hướng + CHỐT
### H-A — "Summary-first single column" ✅ **CHỐT** (hợp modal nhất)
TRÊN: **order summary** (icon/thumb + tên sản phẩm + dòng giá: tổng lớn · giá gốc gạch · **chip giảm %+lý do**).
GIỮA: **chọn cổng** — nhóm **Nội địa (VND)** nổi (PayOS/Sepay) + **Quốc tế (USD)** gập gọn; mỗi hàng `PressableCard`
logo+tên+tiền tệ, spinner khi chọn. DƯỚI: **trust line** ("Thanh toán an toàn · mã hoá SSL · hỗ trợ hoàn tiền").
- ✅ Đúng Baymard (summary + trust cạnh action), gọn trong modal, lộ giảm giá loyalty, sửa hết legacy. Tái dùng
  pattern giá của `OrderSummary`.
- ⚠️ cần giá pre-checkout cho course (§8 gap); ẩn/khoá quốc tế khi thiếu USD.
- Ref: Gumroad/LemonSqueezy checkout modal · Baymard order-summary · Stripe.

### H-B — "Two-pane Stripe-style" (summary trái · cổng phải)
- ✅ Cảm giác "checkout xịn". ❌ NẶNG cho modal xs; **trang full `/checkout/sepay` đã làm vai này**. Để north-star
  cho trang checkout, không nhồi vào modal.

### H-C — "Minimal: thêm header giá vào list hiện tại"
- Giữ list cổng, thêm 1 dòng "sản phẩm · tổng · −X%" + trust line. ✅ ít churn. ❌ chưa đủ "summary", giá vẫn phụ.

**Chốt A:** modal = xác nhận mua + chọn cổng; B là trang full (đã có); A vừa tầm + đúng nguyên tắc.

## 6. Section → dữ liệu (hướng A)
| Khối | Hiển thị | Nguồn |
|---|---|---|
| Header | "Thanh toán" + tên sản phẩm | context.flow → course.title / membership / tier |
| **Order summary** | tổng (lớn) · giá gốc (gạch nếu có giảm) · **chip "−X% · <lý do>"** | price-preview (course) / `aiSubscriptionTiers` / membership config + `discountPercent`/`discountReason` |
| Cổng nội địa | PayOS · Sepay (VND) — `PressableCard` logo+tên+`onPress` | `PaymentType` + `assetConfig` |
| Cổng quốc tế (gập) | Stripe · PayPal · Crypto (USD) — ẩn/khoá nếu thiếu USD | cùng trên + cờ `hasUsd` |
| Trust footer | "Thanh toán an toàn · mã hoá" + logo cổng | tĩnh |

## 7. Cắt / Thêm
- **THÊM:** order summary (sản phẩm + giá + **chip giảm loyalty**) · tiền tệ theo nhóm · trust line · loading/error
  cho giá · gập nhóm quốc tế.
- **CẮT:** list cổng phẳng không context · `gap-1.5` · `Card`+`onClick` (→ `PressableCard`/`onPress`) · `<div>`+text
  class (→ `Typography`).
- **GIỮ:** 3-flow dùng chung 1 modal · spinner per-row khi mutating · redirect `submitCheckout`.

## 8. Ranh giới / gap / a11y
- **BE gap (course):** modal cần **giá đã-giảm pre-checkout cho 1 course** (membership/AI đã có qua config/query).
  Đề xuất: field/query nhẹ **`coursePricePreview(courseId)`** → `{originalVnd,discountedVnd,discountPercent,discountReason,originalUsd?,discountedUsd?}`
  reuse `CoursePricingService`+`LoyaltyDiscountService` (KHÔNG bịa giá ở FE). Nếu chưa có BE: tạm hiện giá gốc từ
  `pricingPhases` + "giảm thêm ở bước sau" (kém hơn) — ưu tiên thêm query.
- **Quốc tế thiếu USD:** course Regular không có USD → **khoá** cổng quốc tế + tooltip "Chỉ thanh toán nội địa cho
  khoá này", KHÔNG để click rồi mới lỗi.
- **States:** `AsyncContent` cho giá (skeleton dòng giá); error → vẫn cho chọn cổng (giá hiện sau); mỗi cổng có
  hover/cursor ([[interactive-needs-hover]]).
- **a11y/i18n:** logo cổng có `alt`; tiền tệ + số đọc được; mọi text qua `Typography`/`t()`; primary action rõ.
- Ref: [Baymard checkout UX](https://baymard.com/learn/checkout-flow-ux-optimization) · Stripe · Gumroad modal.

→ Thầy chọn hướng (widget) → `/starci-fe-ux-apply`. Feedback bất kỳ lúc nào → `.claude/rules/drafts/<temp>.md`.

---

## ✅ ĐÃ DỰNG 2026-06-21 (thầy duyệt — H-A, cả BE + FE)
- **BE — query mới `coursePricePreview(courseId)`** (`queries/courses/course-price-preview/**`, đăng ký ở
  `courses.module.ts`): trả `{originalPriceVnd, discountedPriceVnd, discountPercent, originalPriceUsd,
  discountedPriceUsd, discountReason, enrolledCount}`, **reuse `CoursePricingService` + `LoyaltyDiscountService`**
  (giá hiện = giá charge thật, KHÔNG bịa ở FE). KHÔNG đụng `currentTask`/mutation cũ.
- **FE — query fn + type + hook** `coursePricePreview` (`query-course-price-preview.ts` · `types/course-price-preview.ts`
  · `useQueryCoursePricePreviewSwr`), + barrels.
- **FE — viết lại `PaymentModal`** theo H-A: **order summary** (tên sản phẩm + giá đã giảm lớn + giá gốc gạch +
  **chip "−X% · lý do loyalty"**) → **2 nhóm cổng** (Nội địa VND · Quốc tế USD, **khoá khi không có USD** + note) với
  **`PressableCard`/`onPress`** (bỏ `Card`+`onClick`), **số tiền per-cổng** (VND/USD) trên từng hàng, spinner per-row →
  **trust line** ("Thanh toán an toàn · mã hoá SSL"). Giá theo flow: course=`coursePricePreview`, AI=`aiSubscriptionTiers`
  (fetch modal-local vì hook cũ gate theo trang), membership=i18n. `AsyncContent` cho giá. Dọn `gap-1.5`/`<div>`+class.
- **i18n:** `payment.{discount.{enrolledCount,diligent,both}, intlNoUsd, secure, priceError, aiPlanName, membershipName}` (vi/en).
- tsc + lint + JSON sạch (FE + BE). Chưa verify mắt (modal gate auth + cần mở từ flow mua).

---

## Follow-up 2026-06-24 — thumbnail summary + Interactive List Card + p-4 (CHƯA apply)
> Thầy feedback qua screenshot (đỏ = list cổng, xanh = summary). KHÔNG đổi BE (field đã có từ §8). Chốt đỏ; summary chờ chọn A/B.

### Đỏ — "Thanh toán trong nước" → **Interactive List Card** (CHỐT)
- Hiện N `PressableCard` rời (`bg-surface` + `gap-2` + hover `bg-surface-secondary`) → rời rạc.
- Mới: **1 khối bounded** `overflow-hidden rounded-3xl border border-default bg-surface` (da §3b List Card); mỗi cổng = `<button>` row
  `relative flex w-full items-center gap-3 px-4 py-4 text-left outline-none transition-colors hover:bg-default focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60`
  + separator inset accordion `after:absolute after:bottom-0 after:left-[3%] after:h-px after:w-[94%] after:bg-surface-foreground/6 after:content-[''] last:after:hidden`.
- = render như Accordion Card NHƯNG click được + hover từng row đổi nền `bg-default` (copy `.accordion--surface .accordion__trigger:hover`). Giữ icon/name/desc/amount/arrow/spinner/onPress/disabled.
- Ref: Stripe Payment Element (list mode) · Shopify checkout payment list (picker = 1 list bounded, row highlight).

### Xanh — order-summary card (chờ thầy chọn A/B)
Cả 2 đều: **bỏ veil `bg-white/5` → border + INHERIT bg** (đính chính [[surface-in-surface-inner-has-border]] theo chốt mới); loyalty divider `border-white/10` → `border-default`; giá đúng (discounted bold + struck original + `−%` chip success); loyalty breakdown (icon + lý do); **thêm thumbnail** `course.entity.coverImageUrl` qua `CoverImage`.
- **A — media object (thumbnail nhỏ ~84px trái) — ĐỀ XUẤT:** card `border border-default rounded-2xl px-4 py-3`, `[thumb 16:9] | [name + price-row + loyalty]`. Gọn, modal ngắn (giá+cổng trong tầm mắt). Ref Stripe/Shopify/Gumroad dùng thumbnail nhỏ trong summary.
- **B — cover full-width trên đỉnh:** `CoverImage` 16:9 full → name+price+loyalty dưới. Khớp `CoursePricingRail` nhưng tốn dọc + lặp cover đang thấy sau lưng modal.
- **Guard:** thumbnail chỉ flow course (AI/membership không cover) → `coverImageUrl ?` mới render `CoverImage`; flow khác media-object tự co về text.

### Phụ — gutter modal p-6 → p-4 (global)
- `globals.css`: `.modal__dialog { padding: 1rem !important; }` (đính chính [[modal-body-no-padding-override-heroui-idiom]] — gutter chuẩn giờ p-4). Áp MỌI modal.

### Đã làm sẵn (copy fix, không defer)
- i18n `payment.noCardStored` "StarCi" → "StarCi Academy" (vi + en).

→ Thầy chọn A/B → `/starci-fe-ux-apply`. Plan kỹ thuật cũng ở BE `.claude/rules/debts/2026-06-24-header-rhythm-followups.md` §F.

---

## Follow-up 2026-06-24 (3) — Tooltip breakdown giá + công tắc tiền tệ VND/USD (CHƯA apply)
> Thầy: hover giá → tooltip giải thích vì sao giảm (phase bao nhiêu + loyalty bao nhiêu); và muốn **chọn thanh toán cả VND lẫn USD** (option lựa chọn).

### Vấn đề / dữ liệu
- Sau tweak: coursePricePreview trả `originalPriceVnd` = LIST, `discountedPriceVnd` = phase×(1−loyalty) = charge, + USD tương ứng, `discountPercent` = loyalty, `discountReason`, `enrolledCount`. **Thiếu giá PHASE giữa** (list→phase→charge) để tách "giảm do phase" vs "do loyalty".
- USD đã có (`originalPriceUsd`/`discountedPriceUsd`) nhưng hiện bị giấu sau drawer "Thanh toán quốc tế".

### Hướng CHỐT
- **Tooltip breakdown (cần 3 số):** thêm BE field **`phasePriceVnd` + `phasePriceUsd`** = `resolveAmountVnd/Usd({course})` (giá phase, chưa loyalty — đúng giá trị cũ trước tweak) → FE có list/phase/charge → tooltip tách CHÍNH XÁC: `Giá gốc → Giai đoạn [phase] −A% → Ưu đãi thành viên −B% (lý do) → Bạn trả`. (Hướng B suy `phase=charge/(1−loyalty)` có sai số — bỏ.) Tooltip HeroUI bọc PriceTag, affordance = viền dashed + icon ⓘ + `cursor-help`.
- **Công tắc tiền tệ (segmented) "🇻🇳 Trong nước · VND | 🌐 Quốc tế · USD"** ở đầu modal → đổi: (1) giá summary + tooltip theo tiền tệ chọn, (2) danh sách cổng (domestic PayOS/Sepay ↔ international Stripe/PayPal/Crypto). **Thay link drawer cũ** (đính chính [[when-drawer]]/[[payment-modal-flat-summary-listcard-drawer]]: quốc tế giờ là 1 nhánh công tắc, không drawer). Mặc định VND (audience VN). Tab USD **disabled** khi `!hasUsd` (course chỉ VND) + tooltip "chỉ thanh toán nội địa".
- **PriceTag** thêm prop **`currency: "VND" | "USD"`** (format theo tiền tệ; % compute giữ nguyên agnostic). Tooltip breakdown cũng theo currency đang chọn.

### Ảnh hưởng
- BE: +2 field `phasePriceVnd`/`phasePriceUsd` vào `CoursePricePreviewData` (reuse `resolveAmountVnd/Usd`, 0 logic mới).
- FE: PriceTag + `currency`; PaymentModal thêm state `currency` (VND/USD) drive summary+gateways (bỏ drawer + intl link); tooltip breakdown block (dùng chung). PremiumGate/Paywall/Rail: tooltip breakdown VND (chưa cần công tắc — chỉ PaymentModal là nơi thật sự chọn cổng).
- Ref: Stripe/Shopify currency switcher · Booking.com price-details tooltip · Amazon "price breakdown".

→ Widget (toggle VND/USD + tooltip) đã vẽ trong chat. Thầy duyệt → `/starci-fe-ux-apply`.
