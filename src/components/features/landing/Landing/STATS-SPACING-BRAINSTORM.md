# UX Brainstorm — Landing: giãn section (gap-24+) + redesign dải số liệu editorial (2026-06-25)

> `/starci-fe-ux-brainstorm`. Trang: `/[locale]` landing. Thầy: *"gap giữa stats xa hơn; rule gap-24 trở lên (research để lấy gap); redesign section này"* + ref ảnh editorial stats (số to + divider). KHÔNG code (chờ duyệt). **Có widget A/B.**

## Hiện trạng (inventory)
- `Landing/index.tsx` root: `flex flex-col gap-12 px-4 py-12` → 10 section cách nhau **gap-12 (48px)** — chật cho landing.
- `StatStrip` → 4 `MetricCard` trong `grid grid-cols-2 md:grid-cols-4 gap-3`. Mỗi card = `SectionCard` (rounded-3xl border bg-surface) + icon accent + số `h4` (nhỏ) + label `body-xs muted`.
- Data: `platformStats` (`useQueryPlatformStatsSwr`) → totalLearners/Lessons/Courses/BadgesEarned. Gate error → ẩn cả strip.

## Pain
1. **Section chật** (gap-12/48px) → landing không "thở", các vùng dính nhau.
2. **Stats = 4 card dark nhỏ** → nặng, con số `h4` bé, kém sang. Ref thầy = editorial (số RẤT to + label nhỏ + divider, no card).

## Mục tiêu
Landing phải "thở" + sang như landing đầu ngành (Stripe/Linear/Vercel): section cách xa, số liệu để **con số tự gánh** (editorial), không nhồi card.

## Hướng (research-grounded)
### Gap section (research → chốt số)
Research (8pt grid · Material/Apple HIG · marketing whitespace): section spacing desktop **64–128px**, lean lớn cho landing. → **base `gap-24` (96px)** (đúng "gap-24 trở lên" thầy chốt); **hero→nội dung `gap-32` (128px)**; mobile `gap-16 sm:gap-24`. Đây là thang RIÊNG marketing (khác thang app [[gap]] 6/8).

### Stats redesign — editorial strip (widget A/B)
| Hướng | Là gì | ✅ |
|---|---|---|
| **A — strip phẳng** ✅ đề xuất | số `text-4xl/5xl` + label `text-xs muted` + **divider dọc** `border-l`, đặt phẳng trên nền (no card) | nhẹ nhất, số tự nói, sang; hợp dark landing |
| **B — trên band** | cùng editorial nhưng bọc band `bg-surface border-y` (full-width feel) | tách hẳn "vùng số liệu", **giống y ref** (band có viền trên/dưới) |
→ **A** (phẳng) cho dark landing — nhưng **B giống ref thầy gửi hơn**. Thầy chọn.

## Section → dữ liệu
| Phần | Nguồn |
|---|---|
| 4 số | `platformStats` (giữ nguyên) |
| Layout | `grid grid-cols-2 md:grid-cols-4` + `border-l` divider |
| Số | `text-4xl md:text-5xl font-medium tracking-tight` (thay `h4` card cũ) |
| Label | `text-xs text-muted` sentence-case ([[no-uppercase-text]]) — uppercase chỉ khi thầy duyệt |

## Cắt / Thêm
- **CẮT:** `MetricCard` wrapper (card) + icon mỗi ô + gap section gap-12.
- **THÊM:** editorial strip (số to + divider) + gap section gap-24/32 + (tuỳ) band.
- **GIỮ:** data `platformStats`, gate error (ẩn khi fail — không show 0 làm proof), skeleton (mirror strip mới).

## Refs
- [Web spacing best practices](https://www.conceptfusion.co.uk/post/web-design-spacing-and-sizing-best-practices) · [Red Hat spacing](https://ux.redhat.com/foundations/spacing/) · [Unbounce white space](https://unbounce.com/landing-page-design/white-space/). Editorial stats: Stripe/Linear/Vercel landing.

## ✅ ĐÃ ÁP (2026-06-25, thầy "xúc")
- Stats → editorial strip phẳng (A): số `text-4xl md:text-5xl` + label `body-xs muted` + divider dọc (md), bỏ card/icon. Skeleton mirror.
- Root landing `gap-12`→`gap-16 sm:gap-24`, `py-12`→`py-16 sm:py-24`.

## VÒNG 2 — icon + count-up (2026-06-25)
> Thầy: *"thêm cái logo thì sao, với hiệu ứng chữ tự chạy từ 0 lên"*.

### Quyết định
1. **Icon nhỏ phía TRÊN mỗi số** (bring back 4 icon Users/BookOpen/Stack/Medal): `size-5`, đặt trên con số, căn giữa. Màu: **`text-accent`** (brand pop, 4 icon nhỏ nên OK) — hoặc `text-muted` nếu muốn trầm. Đề xuất accent.
2. **Count-up 0 → giá trị khi cuộn tới** (như Stripe/landing): hook **`useCountUp`** = `IntersectionObserver` (threshold ~0.4, fire 1 LẦN) + `requestAnimationFrame` ease-out cubic (~1500ms) + format `toLocaleString(locale)`. **Tôn trọng `prefers-reduced-motion`** → snap thẳng giá trị (không animate). Số nhỏ (4/7/12) đếm rất nhanh, vẫn có "nhảy" nhẹ; 343 thấy rõ.
   - Không thêm dep (rAF thuần, dù app có framer-motion). Reset state khi value đổi.
3. Skeleton giữ (count-up chỉ chạy sau khi có data).

### Áp
- Tách `useCountUp` (hook) + `CountUp` (component render số đã đếm) hoặc inline trong `Stat`. `Stat` thêm `icon` prop (size-5 accent, trên số) + dùng `CountUp` cho value (truyền số RAW, không format sẵn — CountUp tự format theo locale).
- StatStrip truyền `value` là number (raw) + `icon` cho 4 stat.

### Hỏi
- Icon màu **accent** (đề xuất) hay **muted**?
