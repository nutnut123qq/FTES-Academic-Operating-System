# UX Brainstorm — 3 trang AI (Cài đặt AI · Gói AI · Hạn mức & lịch sử) — 2026-06-18

> `/ux-brainstorm` · KHÔNG code, chỉ chốt hướng → `/ux-apply` dựng.
> Args thầy: **(1)** Cài đặt AI = chỉ set BYOK key · **(2)** Gói AI = grid 2×2 · **(3)** seed data render thử.

## 0. Bối cảnh data (BE thật)

BE đã redesign sang **1 pool credit thống nhất** (memory `ai-credits-unified-pool`):
- `myAiQuota` trả **1** object `credit { limit5h, used5h, remaining5h, limitWeek, usedWeek, remainingWeek }` + `mode`, `tier`, `window5hResetAt`, `windowWeekResetAt`. **Không còn 2 cột auto/premium riêng.** Limit = base free (50/5h · 500/tuần) **+** tier additive (Plus +250/+2500 …).
- `mode` (auto/premium/byok) giờ **tự suy** theo natural order `byok → premium → auto`: có BYOK key → byok; có tier active → premium; còn lại → auto. `preferredMode` chỉ là override.
- `myAiSettings`: `effectiveMode`, `preferredMode`, `canPremium`, `canByok`, `hasByokKey`, `byokProvider`, `tier`.
- `myCreditUsage` + `myCreditUsageHistory` (`items[]`: mode/recommendation/model/provider/credits/createdAt, +total, phân trang) — nguồn cho lịch sử + chart. Bảng `credit_usage_histories`.
- Tiers từ `aiSubscriptionTiers` (config app.yaml): Plus/Pro/Max + (Free là card tĩnh FE).

**Hệ quả thiết kế:** vì mode đã tự-suy theo tier + key, **việc cho user bấm chọn lane Auto/Premium/BYOK là thừa** → đúng hướng args (1).

---

## 1. Cài đặt AI (`/profile/ai-settings`) — CHỈ set BYOK key

### Pain hiện tại
- `LaneSelector` 3 card (Auto/Premium/BYOK) cho user "chọn lane" — nhưng lane thật do tier+key quyết định, chọn tay gây mâu thuẫn (chọn Premium khi `!canPremium` → khoá; chọn BYOK rồi chưa nhập key → save bị chặn).
- BYOK key (`ByokForm`) tách rời khỏi lựa chọn lane → rối, 2 khái niệm chồng nhau.

### Hướng CHỐT — trang = **1 việc duy nhất: BYOK key**
Mục tiêu ≤10s: "Tôi có muốn dùng API key riêng không? Nếu có, nhập key." Cắt toàn bộ mode-selection.

IA mới (1 cột, primary = nút Lưu):
1. **PageHeader** — title "Cài đặt AI", desc đổi thành nói về BYOK: "Dùng khoá API riêng của bạn để chấm bài — không trừ hạn mức hệ thống."
2. **EffectiveLane (read-only, giữ)** — chip "Đang dùng: {effectiveMode}" + tier chip. Để user hiểu hệ thống đang chạy lane nào (auto/premium/byok tự suy). 1 dòng, muted. → đây là chỗ DUY NHẤT còn nhắc tới "lane", và nó chỉ để ĐỌC.
3. **BYOK section (primary, luôn hiện — KHÔNG còn ẩn sau LaneSelector):**
   - Trạng thái key: nếu `hasByokKey` → dòng "✓ Đã lưu khoá ({providerLabel})" + nút **Gỡ khoá** (`clearByok: true`).
   - Provider picker (OpenAI / Gemini / Claude / OpenRouter) — segmented/button group.
   - Input key (`type=password`), placeholder "Nhập khoá" / "Thay khoá mới" (khi đã có key).
   - Hint: "Khoá được mã hoá, chỉ dùng phía máy chủ, không bao giờ hiển thị lại."
4. **StatusLine** (giữ) + nút **Lưu thay đổi** (primary, full-width). Submit = `updateMyAiSettings({ byokProvider, byokApiKey })` (KHÔNG gửi `mode` nữa — để BE tự đặt natural order; có key → byok tự thắng).
5. **Cross-link nhẹ:** dưới cùng 1 dòng muted "Muốn dùng model cao cấp mà không cần khoá riêng? → Xem [Gói AI]" (vì bỏ Premium card nên cần lối sang subscription).

### Cắt
- ❌ `LaneSelector` + `LaneCard` (3 card chọn mode) — xoá.
- ❌ Việc gửi `mode` trong mutation từ trang này (BE tự suy). `preferredMode` override = tính năng nâng cao, **không cần UI** ở MVP.

### Section → data
| Section | Field BE |
|---|---|
| EffectiveLane chip | `myAiSettings.effectiveMode`, `.tier` |
| Trạng thái key | `.hasByokKey`, `.byokProvider` |
| Provider picker + input | `updateMyAiSettings({ byokProvider, byokApiKey, clearByok })` |

### States
- Loading: skeleton 1 chip + 1 card (mirror BYOK section).
- Empty: không có (luôn render form). Chưa có key = placeholder "Nhập khoá".
- Error: StatusLine đỏ.

---

## 2. Gói AI (`/profile/ai-subscription`) — grid **2×2**

### Pain
- `grid sm:grid-cols-2 lg:grid-cols-4` → 4 card (Free/Plus/Pro/Max) dồn 1 hàng trên desktop → hẹp, desc bị `line-clamp-3`, price + USD hint chật, phải chèn spacer ẩn để canh footer (screenshot 2: chữ "enough AI credit…" bị cắt).

### Hướng CHỐT — **2×2** (args 2)
- Đổi grid: `grid grid-cols-1 sm:grid-cols-2` (bỏ `lg:grid-cols-4`). 4 card → 2 hàng × 2 cột. Mỗi card rộng gấp đôi → desc đọc đủ, price thoáng, bớt cần spacer-ẩn để canh.
- Thu `max-w-5xl` → `max-w-3xl` (hoặc `max-w-4xl`) cho 2 cột không quá rộng/loãng.
- Thứ tự giữ: Free → Plus → Pro(Phổ biến, accent ring) → Max. 2×2 = hàng trên [Free, Plus], hàng dưới [Pro, Max].
- Card structure giữ nguyên (icon/title/desc/price/credits/CTA) — chỉ đổi layout grid + max-w. Vì rộng hơn: bỏ `line-clamp-3` desc, bỏ các spacer-ẩn canh-dòng nếu không còn cần (card cùng hàng cao bằng nhau qua `h-full` + grid stretch).

### Section → data
`aiSubscriptionTiers.tiers[]` (Plus/Pro/Max) + Free card tĩnh; `isCurrent` từ `myAiSettings.tier`; CTA `openPaymentModal`.

### States: skeleton 4 card-shaped (đã có `AiSubscriptionSkeleton` — chỉnh thành 2×2).

---

## 3. Hạn mức & lịch sử AI (`/profile/ai-usage`) — fix stale 2-lane + seed

### Pain (QUAN TRỌNG — lệch BE)
- FE render **2 lane riêng**: "Tự động" (QuotaLane Auto, đọc `myCreditUsage`) + "Gói trả phí" (QuotaLane Premium, đọc `myAiQuota`). **Sai với BE unified-pool** — BE chỉ còn 1 pool. Hiện ra "0/50, 0/500" cho auto rồi lại 1 khối premium → trùng lặp, khó hiểu.
- Empty: "Chưa có lượt dùng AI nào" + chart trống (screenshot 3) → cần seed để thấy thật.

### Hướng CHỐT — **1 pool, 2 window**
1. **Header** — title "Hạn mức & lịch sử AI", desc "Hạn mức credit và lịch sử chấm bài bằng AI."
2. **1 khối hạn mức (bỏ 2 lane):** dùng `myAiQuota.credit`:
   - QuotaBar "Trong 5 giờ" — `used5h / limit5h`, reset `window5hResetAt`.
   - QuotaBar "Trong 7 ngày" — `usedWeek / limitWeek`, reset `windowWeekResetAt`.
   - Phụ đề nhỏ: chip tier hiện tại (`tier` hoặc "Miễn phí") + "Nâng cấp" link → Gói AI nếu free.
3. **Lịch sử (giữ `AiQuotaHistoryTab`):**
   - Chart 14 ngày (credit/ngày) từ `myCreditUsageHistory` group-by-day.
   - List `items[]`: model (null → "Model cơ bản") · thời gian (format `HH:mm MMM DD, YYYY` theo `time-rendering.md`, KHÔNG icon đồng hồ) · chip credits.
   - Empty: "Chưa có lượt dùng AI nào" (giữ, nhưng sau seed sẽ có data).

### Cắt
- ❌ 2 `QuotaLane` (Auto + Premium) → gộp 1 khối đọc `myAiQuota.credit`. QuotaLane/QuotaBar block giữ, chỉ feed 1 nguồn.
- ❌ Khối "Gói trả phí / Bạn chưa có gói…" → thay bằng chip tier + link Gói AI (gọn).

### Seed data (args 3) — làm ở /ux-apply (BE psql)
Insert `credit_usage_histories` cho starci183 (`user_id`), ~14 ngày gần nhất, vài chục row:
- `mode`: auto/premium trộn; `model`/`provider` (claude-sonnet-4-5/claude, gpt-4o/openai…); `recommendation` low/medium/high cho premium; `credits` 1–8; `created_at` rải đều 14 ngày.
- Cũng set `ai_subscriptions.credit_5h_used`/`credit_week_used` > 0 + `window_*_reset_at` future để QuotaBar có fill (không full 0).
- Mục tiêu: chart có cột, list có dòng, bar có mức → render thử đẹp.

---

## Tổng kết section → data

| Trang | Khối | Field BE / hook |
|---|---|---|
| Cài đặt AI | EffectiveLane | `myAiSettings.effectiveMode/.tier` |
| | BYOK form | `.hasByokKey/.byokProvider` + `updateMyAiSettings` |
| Gói AI | 4 card 2×2 | `aiSubscriptionTiers.tiers[]` + `myAiSettings.tier` |
| Hạn mức | 2 QuotaBar (1 pool) | `myAiQuota.credit` + `window*ResetAt` |
| | Chart + list | `myCreditUsageHistory.items[]` |

## Điều cắt / thêm
- **Cắt:** LaneSelector 3-mode (ai-settings); 2-lane QuotaLane (ai-usage); grid 4-across (ai-subscription).
- **Thêm:** cross-link Cài đặt AI → Gói AI; chip tier ở ai-usage; seed history.
- **Rule rút ra (ghi draft):** UI hạn mức/credit phải bám **unified-pool** (1 pool 2 window), không tách lane theo nguồn — nguồn (auto/premium/byok) chỉ là cách BE tính, không phải trục hiển thị cho user.
