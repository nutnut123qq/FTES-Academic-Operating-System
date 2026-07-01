# UX Brainstorm — "Lịch sử dùng AI" / AI usage page (`/profile/ai-usage`)

> `AiUsage/index.tsx` hiện = wrapper mỏng ghép lại 2 mảnh của **AiQuotaModal**: `QuotaLane` (credit pool) +
> `AiQuotaHistoryTab` (chart + list). KHÔNG code — brainstorm + chốt.

## Dữ liệu thật (grounded)
- **`myAiQuota`**: `mode` · `tier` · `credit{limit5h,used5h,remaining5h,limitWeek,usedWeek,remainingWeek}` ·
  `window5hResetAt` · `windowWeekResetAt`.
- **`myCreditUsageHistory(limit,offset)`** → `{ items, total }` — **offset/limit phân trang sẵn** (FE đang xin 100, BE max 200).
  item: `id · mode · recommendation · model · provider · credits · createdAt`.
- **KHÔNG có aggregate ở BE**: chart per-day bucket **client-side**; per-model **chưa tính ở đâu**.
- Ledger `credit_usage_histories` có `attemptId` (challenge gây charge) **CHƯA expose** → cơ hội link về challenge.

## Pain hiện tại
1. **Wrapper của modal**, không page-native (trang rộng hơn modal nhưng dùng y component nhỏ).
2. **Chart sai cửa sổ**: title i18n ghi "14 ngày" nhưng code bucket **7 ngày** (lệch — bug).
3. **History**: BE phân trang nhưng FE nạp cứng 100 + scroll nội bộ → **không infinite, không filter, không link** về challenge.
4. **Thiếu insight**: data có `model/provider/credits` nhưng KHÔNG có KPI tổng (đã tiêu tuần / số lần / model hay dùng) hay breakdown per-model.

## Mục tiêu trang
"Tôi đã tiêu credit vào đâu, còn bao nhiêu, khi nào reset" trong ≤30s → KPI rõ + chart đúng + lịch sử tra cứu được (filter + xem hết + link ngữ cảnh).

## IA mới
1. Header (breadcrumb + PageHeader) — giữ.
2. **Credit pool**: 2 cửa sổ 5h/tuần (used/remaining + reset) — KPI rõ ràng, có thể thành 2 `MetricCard`/ProgressMeter.
3. **Insight**: (a) chart per-day **sửa đúng cửa sổ** (chốt 14 ngày khớp title, hoặc đổi title=7); (b) **breakdown per-model/provider = `SegmentBar`** (reuse, theo rule "categorical → bar không donut") từ items đã tải.
4. **History**: list **infinite scroll** (`useSWRInfinite` offset, BE đã sẵn) + **filter** (lane auto/premium/byok · model) + mỗi dòng **link về challenge** (khi có attempt) + `ScrollShadow` (đã thêm).

## Hướng (≥3)

### Hướng A ⭐ — Page-native usage dashboard
Tách khỏi component modal → component riêng cho trang. KPI row (còn lại tuần · còn lại 5h · đã tiêu 14d · số lần) +
chart per-day (đúng cửa sổ) + `SegmentBar` per-provider + history infinite + filter + link-to-challenge.
- ✅ Đúng tầm 1 trang đầy đủ; tận dụng field chưa dùng (provider breakdown, attemptId link); phân trang BE có sẵn.
- ⚠️ Aggregate (đã-tiêu-14d, per-model) tính **client-side trên trang đã tải** → số "tổng thật" cần BE aggregate (nêu rõ, đừng fake "toàn thời gian"); link challenge cần BE expose `attemptId/displayId`.

### Hướng B — Giữ reuse modal, chỉ vá
Sửa chart window + đổi history sang infinite + thêm filter + ScrollShadow. Không thêm KPI/breakdown.
- ✅ Nhẹ, nhanh; ⚠️ vẫn "modal phóng to", bỏ phí insight.

### Hướng C — Minimal
Chỉ sửa bug chart 14↔7 + ScrollShadow (đã có). Không đụng cấu trúc.
- ✅ Cực nhẹ; ⚠️ không giải quyết "xem hết / tra cứu / insight".

## CHỐT: Hướng A
Trang đầy đủ xứng dashboard: KPI + chart đúng + breakdown bar + history infinite/filter/link. Phân trang BE sẵn nên
infinite làm ngay; chỉ 2 thứ cần BE (đừng fake): **aggregate tổng thật** (nếu muốn số "toàn thời gian" chính xác,
không chỉ trang đã tải) + **expose `attemptId`(+displayId)** để link dòng history về challenge.

## Section → dữ liệu BE/DB (+ gap)
| Phần | Nguồn | Trạng thái |
|---|---|---|
| Credit pool 5h/tuần + reset | `myAiQuota.credit.*` + `window*ResetAt` | ✅ |
| Chart per-day | bucket client-side từ items | ✅ (sửa cửa sổ cho khớp title) |
| Breakdown per-provider/model | `items[].provider/model` → SegmentBar (client) | ✅ trên tập đã tải |
| History infinite + total | `myCreditUsageHistory(limit,offset)` + `total` | ✅ (đổi FE sang useSWRInfinite) |
| Filter lane/model | `items[].mode/model` (client) | ✅ |
| Link dòng→challenge | ledger `attemptId` | ⚠️ **CẦN BE expose** `attemptId`(+content displayId) |
| KPI "đã tiêu toàn thời gian" chính xác | — | ⚠️ **CẦN BE aggregate** (nếu không, chỉ tính trên đã-tải + ghi rõ) |

## States / a11y
- AsyncContent cho từng vùng (pool/chart/list). History: skeleton ListRow mirror · empty · error retry · sentinel infinite.
- Filter = `Select`/chip; chart có `aria-label`; reset time format locale.

---
*→ Thầy duyệt → `/ux-apply`. Phần FE-only (KPI từ myAiQuota, chart fix, SegmentBar per-provider, history infinite+filter)
làm ngay; **link-to-challenge + aggregate-toàn-thời-gian cần BE** (sẽ nêu, không fake).*
