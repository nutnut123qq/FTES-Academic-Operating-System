# AiSettings — "Set trần (ceiling) AI theo hạng mục" · UX-BRAINSTORM (2026-06-29)

> Brainstorm (KHÔNG code). Legacy = inventory; thiết kế từ mindset + ref thật.
> Route: `/profile/settings/ai-settings` (`src/components/features/profile/AiSettings/index.tsx`).

## Mục tiêu trang (≤30s)
Cho học viên **đặt TRẦN** mức model mà Auto được phép leo tới, **để kiểm soát credit** — KHÔNG đụng:
- **Floor** (hệ tự đặt theo surface/difficulty: chatbot=Free, dễ=Economy, vừa=Balanced, khó=Premium, insane=Frontier).
- **Trần plan** (free=`[Free,Economy]`; Plus/Pro/Max=cả 5).
→ `ceil` chỉ **hạ THẤP** trong khoảng plan cho phép. **Chỉ thật sự có nghĩa với user ĐÃ NẠP** (free user trần plan = Economy → gần như không có gì để cap → hiện upsell).

## Grounded data (BE — đã verify)
- Ladder `CATEGORY_LADDER` = Free < Economy < Balanced < Premium < Frontier (`resolve-grading-chain.ts:9`).
- `resolveGradingChain({floor, tierCategories, ceil})` đã cap chuỗi climb tại `ceil`; floor>ceil → clamp xuống mức entitled cao nhất ≥Economy (`resolve-grading-chain.ts:57`). **HARD STOP** (leo tới ceil rồi dừng — không vượt).
- Credit/lượt `CATEGORY_CREDIT_COST`: Free 0 · Economy 5 · Balanced 20 · Premium 50 · Frontier 100 (`ai-entitlement.constants.ts:11`). Pool 5h + tuần.
- Trần plan `TIER_ALLOWED_CATEGORIES` (`ai-entitlement.constants.ts:37`).
- **Chưa persist `ceil`**: param runtime, chưa caller nào đọc từ setting.
- Persist candidate: `ai_subscriptions` (1 row/user, có `tier` + credit) → thêm `jsonb ceil_overrides {surface→category}` (hoặc bảng nhỏ). GraphQL: `myAiQuota` (FE đọc tier) + mutation mới `setAiCeil` mirror `purchaseAiSubscription`.

## Hạng mục (surfaces) — grounded từ AI touchpoints thật
1. **Hỏi AI khi đọc bài** (chatbot · `ask-content-ai` + `content-ai.gateway`) — floor Free.
2. **Chấm bài** (challenge + capstone · grade-step) — floor THEO difficulty (Economy→Frontier).
3. **Phỏng vấn thử** (`interview-grading.service`) — floor Economy.
→ ceil per-surface = "cap chi tiêu surface này tại tier X dù difficulty floor cao hơn" (clamp logic đã hỗ trợ).

## 3 hướng (đã vẽ widget) — neo ref
| | Hướng | Control | Neo ref | Trade-off |
|---|---|---|---|---|
| A | Thang trần MỖI hạng mục | `SegmentedControl` 5-mức/surface, trên-plan disabled | Cursor "Auto" + ordinal tier | Dễ thấy "đang ở đâu trên thang + khoá gì"; nặng khi nhiều surface × 5 mức |
| **B ✅** | **Mặc định chung + ghi đè/surface** | 1 thang mặc định + mỗi surface "Theo mặc định (X)" / dropdown ghi đè | **Copilot two-layer** (trần→auto-pick) + Cursor subagent `inherit` | Tải nhận thức thấp nhất (đặt 1 lần, chỉnh ngoại lệ); "inherit plan max" honest; per-surface phải mở dropdown |
| C | Thẻ surface + thanh chi phí | Card/surface + dropdown trần + meter credit | Kinde budget UX + OpenRouter `max_price` | Minh bạch chi phí nhất; nặng UI, dễ rối nếu surface nào cũng meter |

### CHỐT đề xuất: **B** (mặc định chung + ghi đè), mượn của A + C
- **B làm xương** (đúng mental model "trần vs auto-pick-trong-trần" Copilot đã chứng minh; default = "theo mặc định" honest).
- **Mượn A**: control ghi đè = thang `SegmentedControl`, **mức trên plan = disabled** (không lock — [[disable-vs-lock-and-perrow-autosave]]) + gợi ý nâng gói.
- **Mượn C**: 1 dòng caption credit/lượt cạnh mỗi mức (KHÔNG full meter — tránh clutter; [[progress-block-growing-quantity-headline-not-vanity-strip]]).
- **BẮT BUỘC nói rõ HARD STOP**: "Auto leo tới `<mức>` rồi dừng, không vượt" — tránh bẫy soft-limit của OpenAI (anti-pattern #1 từ web research).

## IA mới (trang AiSettings)
1. **PageHeader** (breadcrumb `SettingsBreadcrumb` + title "Cài đặt AI" + desc) — [[settings-pages-breadcrumb-and-pageheader]].
2. **Plan context strip** (`myAiQuota`): gói hiện tại + trần plan tối đa + credit pool (5h·tuần). Cho biết "trần của bạn tới đâu" trước khi chỉnh. Ẩn/đổi cho free → upsell.
3. **Mức trần mặc định** (`<Label>` + `SegmentedControl` 5-mức; trên-plan disabled).
4. **Ghi đè theo hạng mục** (`<Label>` + rows: Hỏi AI / Chấm bài / Phỏng vấn; mỗi row "Theo mặc định (X)" hoặc ghi đè).
5. **State**: loading skeleton mirror · error retry · free-user = thang chỉ Free/Tiết kiệm + dải upsell (KHÔNG ẩn trang — [[labeled-section-render-empty-not-self-hide]]).
6. **Lưu**: auto-save per-thay-đổi (mutation `setAiCeil`), per-field (không gate toàn form) — [[disable-vs-lock-and-perrow-autosave]].

## Section → dữ liệu BE/DB
| Section | Nguồn |
|---|---|
| Plan strip (tier, trần, credit) | `myAiQuota` (hook `useQueryMyAiQuotaSwr`) |
| Thang mặc định + ghi đè (đọc) | `ai_subscriptions.ceil_overrides` (jsonb MỚI) qua `myAiQuota` hoặc query mới |
| Lưu ceil | mutation MỚI `setAiCeil({surface?, category})` (mirror `useMutatePurchaseAiSubscriptionSwr`) |
| Disabled mức trên plan | `TIER_ALLOWED_CATEGORIES[tier]` (đã có ở BE; FE suy từ tier trong `myAiQuota`) |

## Cắt / Thêm
- **Cắt**: trang AiSettings hiện chỉ 1 dòng link nâng gói (sau khi gỡ BYOK) → thay bằng control trần thật.
- **Thêm BE**: cột `ceil_overrides jsonb` trên `ai_subscriptions` + đọc trong `run()` caller (grade-step/chatbot/interview truyền `ceil` từ setting) + mutation `setAiCeil`.
- **Thêm FE**: blocks có sẵn `SegmentedControl` (mặc định) + dropdown/`SegmentedControl` ghi đè + `<Label>` nhóm control ([[control-group-label-uses-label-block]]).
- **Granularity quyết định cuối (hỏi thầy)**: chỉ **1 trần GLOBAL** (đơn giản nhất) hay **global + per-surface override** (B đầy đủ)? Mặc định đề xuất B nhưng có thể ship v1 chỉ global rồi thêm override sau.

## ĐÃ ÁP DỤNG 2026-06-29 (hướng B, FlexWrapButtonRadio)
- **BE** (`starci-academy-backend`): enum `AiCeilSurface` (chatbot/grading/interview) + `ai_subscriptions.ceil_overrides` jsonb (`{default?,chatbot?,grading?,interview?}`) + migration `1720200000000`; `AiEntitlementService.resolveCeil/setCeil` + `toSnapshot` carries `allowedCategories`+`ceil`; `AiInvokeService.run({surface})` resolves ceil từ settings; callers truyền surface (git+gdocs+milestone grade-step = Grading, ask-content-ai + content-ai.gateway = Chatbot, interview-grading = Interview); `myAiQuota` mở rộng (allowedCategories+ceil); mutation `setAiCeil`. tsc 0 lỗi mới · eslint sạch.
- **FE** (`starci-academy`): `AiModelCategory` thêm `Frontier` (+ `AiCategoryChip` map); `query-my-ai-quota` + types thêm allowedCategories/ceil; mutation `setAiCeil` doc+types+hook `useMutateSetAiCeilSwr`; **AiSettings page** = PageHeader + plan strip (myAiQuota) + `<Label>` + **`FlexWrapButtonRadio`** mặc định + 3 rows ghi đè/surface (option "Theo mặc định" + ladder, trên-plan disabled) + caption credit + HARD STOP + upsell free; auto-save per-change (mutate revalidate). i18n vi+en `aiSettings.ceil.*` + `categories.frontier` + premium→"Cao cấp". tsc/eslint sạch.
- **Defer**: reject-vs-clamp khi unpaid set trên plan (hiện clamp graceful); toast saved/error (hiện revalidate im).
- ⚠️ **Deploy cần DB-prep prod TRƯỚC** (synchronize ON): `ALTER TABLE ai_subscriptions ADD COLUMN IF NOT EXISTS ceil_overrides jsonb;`

## Refs (web research)
- Cursor Max Mode / model selection · GitHub Copilot auto + admin models policy (two-layer) · OpenAI/Anthropic spend caps (cảnh báo soft-limit) · OpenRouter `max_price`/`provider.order` · Vercel AI Gateway `only`/fallback · Kinde billing-cap UX.

## CHỐT (2026-06-29 — thầy duyệt)
- **Hướng B** (mặc định chung + ghi đè/hạng mục), mượn A (thang ghi đè, mức trên-plan disabled + upsell) + C (caption credit/lượt, không meter).
- **Granularity: global + per-surface override** (đầy đủ B): 1 trần mặc định + ghi đè riêng Hỏi AI / Chấm bài / Phỏng vấn.
- HARD STOP copy bắt buộc; free-user = thang chỉ Free/Tiết kiệm + upsell (không ẩn trang).

## Bước sau → `/starci-fe-ux-apply`
- **BE**: cột `ceil_overrides jsonb` (`{default?, chatbot?, grading?, interview?}` → category) trên `ai_subscriptions` + migration; mutation `setAiCeil`; đọc `ceil` từ setting trong các caller `run()` (grade-step challenge/capstone, ask-content-ai + content-ai.gateway, interview-grading) — map surface→override (fallback default). `resolveGradingChain` đã cap sẵn.
- **FE**: dựng AiSettings (PageHeader + plan strip từ `myAiQuota` + `<Label>` + `SegmentedControl` mặc định + rows ghi đè/surface + caption credit + disabled mức trên-plan + upsell free); hook mutation mới mirror `useMutatePurchaseAiSubscriptionSwr`; auto-save per-field.
- ⚠️ Migration `ai_subscriptions` thêm cột jsonb → prod cần DB-prep (`ADD COLUMN IF NOT EXISTS ceil_overrides jsonb`) trước deploy (synchronize ON) — pattern như đợt enum/credit/weight.
