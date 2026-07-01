# `/practice` (Luyện code, LeetCode-style) → cockpit + catalog lọc được (UX brainstorm)

> `/ux-brainstorm` · `/[locale]/practice` (list) + `/practice/[slug]` (solve) · 2026-06-18 · MAX effort
> Trang hiện ở **`components/layouts/learn/Practice` = tầng LEGACY** (chưa blocks/features). **Legacy = inventory.**

## Mục tiêu trang (≤30s)
User vào `/practice` để: **(1) biết mình đang ở đâu** (đã giải bao nhiêu, mạnh/yếu độ-khó/chủ-đề nào) và
**(2) chọn nhanh bài tiếp theo** để giải. 1 primary = **mở 1 bài để giải**. Hiện trang chỉ là danh sách gom theo
chủ đề + lọc độ khó — thiếu tiến độ cá nhân nổi bật, thiếu tìm/lọc/sort, status mờ.

## Inventory hiện tại + pain
**List (`PracticeList`):** header (title + chip tổng điểm) · legend độ khó 4 chip (All/Easy/Medium/Hard + điểm 10/15/20) ·
"X solved of Y" (góc phải, dễ miss) · **gom theo DOMAIN** (Arrays→…→Matrix), mỗi domain header + count, card bài =
title + ✓(nhỏ) + chip độ khó + chip điểm + tags (≤4, xám).
- **Pain:** (1) **lọc mỏng** — chỉ độ khó, KHÔNG search, KHÔNG lọc domain/tag/status/ngôn-ngữ; (2) **không sort**
  (điểm/độ khó/đã-giải); (3) **status mờ** — ✓ tí xíu, KHÔNG có "đang làm/attempted", không acceptance%; (4)
  **tiến độ cá nhân chìm** (1 dòng text); (5) **THIẾU error state** (data null + !loading → trang trắng, không retry);
  (6) **không phân trang** (load limit 100, giả định vừa hết); (7) ở tầng **legacy** (không dùng blocks/features).

**Detail (`PracticeProblem`):** 2 pane (statement+samples+hint+solution | Monaco editor+submit+verdict realtime
Socket.IO+history). Pain phụ: reveal-solution dùng `window.confirm()` (nên modal); history table không header cột;
không prev/next bài; thiếu error "không tìm thấy bài".

## Dữ liệu THẬT (BE/DB)
- **List item** (`codingProblems`, ES per-locale): `id, slug, title, difficulty(easy/medium/hard), domain(20 loại),
  tags[], points, sortIndex`. Filter nhận: `difficulty, tag(ĐƠN), page, limit`. **KHÔNG** trả status/acceptance/đếm.
- **Status cá nhân** (`myCodingProgress`): `solvedProblemIds[], attemptedProblemIds[], revealedProblemIds[], totalPoints`
  → **overlay được** ✓đã giải / ◐đang làm(attempted) / 👁đã xem-lời-giải lên từng card. (Đang dùng mỗi solvedIds.)
- **Tiến độ/kỹ năng cá nhân** (đã có, CHƯA dùng ở /practice): `userCodingRank`(rank+percentile), `userCodingSkills`
  (byDifficulty/byDomain/byLanguage), `userCodingHistory`, `codingLeaderboard`. **codingProblemSuggestions** =
  autocomplete tìm bài (CHƯA dùng).
- **Field CÓ nhưng CHƯA expose** (cơ hội/đề xuất BE): `acceptanceRate`, `totalSubmissions`/đếm-người-giải (signal độ
  phổ biến) — chưa tính trong ES; **multi-tag facet** (query chỉ nhận `tag` đơn, dù item có `tags[]`); editorial/related.

## Information architecture MỚI
**`/practice` = COCKPIT cá nhân + CATALOG lọc được** (kiểu LeetCode), dùng LẠI design-language tab Coding profile
(MetricCard/SegmentBar/StatusChip/LanguageChip/TopicMasteryGrid, thang độ khó easy=success/medium=warning/hard=danger):
1. **Strip tiến độ cá nhân** (đầu trang): MetricCard hàng (Đã giải · Điểm · Hạng · percentile) + SegmentBar theo độ
   khó (easy/medium/hard, đã giải/tổng) — biến "X of Y" chìm thành cockpit. (Nguồn: `myCodingProgress` + `userCodingRank`
   + `userCodingSkills.byDifficulty`.)
2. **Thanh tìm + lọc** (sticky): **search** (`codingProblemSuggestions`) · chips **độ khó** · **domain** · **status**
   (Tất cả / Chưa giải / Đang làm / Đã giải) — status overlay từ `myCodingProgress`, domain group sẵn trên item.
3. **Danh sách bài**: mỗi row = **status nổi bật** (✓ xanh đã giải / ◐ vàng đang làm / ○ chưa) + title + chip **độ khó**
   (StatusChip tone) + chip **domain** + điểm; tags phụ. **Toggle "gom theo chủ đề" ⇄ "danh sách phẳng + sort"**
   (sort: độ khó / điểm / mới). Phân trang = `useSWRInfinite` + sentinel (thay load-100).
4. **Empty/Error THẬT** (AsyncContent): rỗng-do-lọc vs chưa-có-bài; error → retry.

## 3 hướng → CHỐT
- **A (CHỐT): Cockpit + catalog lọc được.** Tiến độ cá nhân lên đầu (dùng lại block Coding profile) + search/lọc/status
  + list status-nổi-bật. → đúng mục tiêu "biết mình ở đâu + chọn bài tiếp", vá hết pain lọc/status/tiến-độ, đồng bộ
  design với profile (§14), 0 cần BE bắt buộc (status/skills/rank đã có).
- **B: List-first tối giản.** Chỉ list lọc/search mạnh + 1 dải tiến độ mỏng. Nhẹ nhưng bỏ phí dữ liệu skills/rank → chìm.
- **C: Recommend-first.** Hero "bài gợi ý cho bạn" + section theo chủ đề/tiếp-tục. Hay nhưng **cần query gợi-ý CHƯA có**
  (chỉ có attempted/skills để suy FE) → để pha 2.
→ **A** vì tận dụng tối đa dữ liệu đang có, vá pain trực diện, không chờ BE.

## Section → dữ liệu BE
| Section | Nguồn | Ghi chú |
|---|---|---|
| Strip MetricCard (đã giải/điểm/hạng/percentile) | `myCodingProgress` + `userCodingRank` | đã có |
| SegmentBar độ khó (đã giải/tổng) | `userCodingSkills.byDifficulty` (+ tổng từ list) | đã có |
| Search bài | `codingProblemSuggestions` | CHƯA dùng |
| Lọc độ khó / domain | `codingProblems(difficulty)` + domain trên item (client group) | có |
| Lọc status (chưa/đang/đã giải) | overlay `myCodingProgress` (solved/attempted) | có |
| Row: status·độ khó·domain·điểm·tags | `codingProblems` item + progress | có |
| Phân trang | `codingProblems(page,limit)` + `useSWRInfinite` | có |
| (đề xuất) acceptance%/đếm người giải | **CHƯA expose** | cần BE thêm field ES |
| (đề xuất) multi-tag facet | query chỉ `tag` đơn | cần BE đổi sang `tags[]` |

## Empty / Loading / Error / A11y
- **Empty**: lọc-không-ra → "Không có bài khớp bộ lọc" + nút xoá lọc; chưa-có-bài → text khác. **Loading**: skeleton
  mirror (strip metric + vài row). **Error**: `AsyncContent` + retry (đang THIẾU). **A11y**: search có label; chips lọc
  `role=group`/`aria-pressed`; status không-chỉ-bằng-màu (icon ✓/◐/○ + aria-label); `prefers-reduced-motion` cho
  collapse domain.

## Cắt / Thêm
- **Cắt**: "X of Y" text chìm (→ cockpit MetricCard); load-100 (→ infinite). **Thêm**: strip tiến độ · search · lọc
  domain/status · status nổi bật · sort · error state. **Move**: `layouts/learn/Practice` → **`features/practice` +
  blocks** (đúng kiến trúc; tái dùng SegmentBar/MetricCard/StatusChip/LanguageChip/TopicMasteryGrid).
- **Detail (pha sau)**: `window.confirm`→modal · header cột history · prev/next bài · error "không tìm thấy".

## ✅ Thầy đã CHỐT (2026-06-18) — khoá cho /ux-apply
1. **Dời sang `features/practice` + blocks** (rebuild đúng tầng; feature chỉ ghép, tái dùng SegmentBar/MetricCard/
   StatusChip/LanguageChip/TopicMasteryGrid; KHÔNG để ở `layouts/learn/Practice`).
2. **Pha 1 = List cockpit** (strip tiến độ + search/lọc/status + list status-nổi-bật + infinite + error/empty thật).
   **Detail (solve page) = pha sau** (không đụng đợt này).
3. **BE extras để PHA 2** — pha 1 chỉ dùng dữ liệu sẵn có (`codingProblems`, `myCodingProgress`, `userCodingRank`,
   `userCodingSkills`, `codingProblemSuggestions`). KHÔNG thêm acceptance%/đếm-người-giải/multi-tag đợt này.

→ Sẵn sàng `/ux-apply practice` (pha 1, hướng A). KHÔNG code ở bước brainstorm này.
