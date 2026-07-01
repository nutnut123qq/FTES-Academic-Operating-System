# UX Brainstorm — "Theo chủ đề" (Skills tab → ProfileCoding)

> Câu hỏi thầy: (1) phần "Theo chủ đề" **nên render chart không?** (2) **nếu giữ chip thì để màu default được không?**
> KHÔNG code.

## Dữ liệu thật (grounded)
- `skills.byDomain` = `[{ key, solved }]` — số bài giải theo **domain** (`CodingDomain` enum: arrays, backtracking,
  binary-search, dynamic-programming, graphs, strings, trees, greedy, …). **Mỗi bài thuộc 1 domain (enum đơn)** →
  các count **exclusive**, cộng lại = tổng giải → part-to-whole **HỢP LỆ** (khác "tag chồng nhau").
- Hiện render: block `TopicMasteryGrid` — chip bo tròn, **tint accent (pink) đậm dần theo count** (8–32%), in kèm số.
  Hàng xóm cùng card: "Theo độ khó" + "Theo ngôn ngữ" = `SegmentBar`.

## Phân tích 2 câu hỏi

### Q1 — Chart hay chip?
**Quyết định = ĐẶC TÍNH SỐ HẠNG MỤC, không phải "cho đồng bộ".**
- `SegmentBar` (100% stacked) đẹp khi **ít hạng mục cố định** (độ khó = 4 bucket; ngôn ngữ = vài) → so tỉ lệ tốt.
- **Domain/chủ đề = MỞ RỘNG, có thể 10–20+** (cả enum). Stacked bar nhiều lát → mỏng như confetti, không đọc nổi
  + legend dài lê thê. → **bar KHÔNG hợp cho topic** dù part-to-whole hợp lệ.
- Mục đích section topic = **"dev mạnh mảng CS nào"** (tín hiệu recruiter), KHÔNG phải "tỉ lệ %". Pattern chuẩn
  (LeetCode/GitHub) = **chip/tag-cloud "vùng mạnh"**, scale tốt khi nhiều topic, mỗi chip kèm count.
→ **CHỐT: GIỮ chip (TopicMasteryGrid), KHÔNG đổi sang chart.** (Nếu muốn so độ-lớn rõ hơn → ranked bar-LIST 1
  thanh/topic cũng được, nhưng chip gọn hơn cho nhiều topic.)

### Q2 — Màu default?
**ĐỒNG Ý, đổi sang default/neutral.** Lý do:
- Cả trang đã **accent (pink) khắp nơi** (nav/link/primary). Chip topic cũng pink → **nhiễu**, đua màu, "tint đậm
  dần theo count" chìm nghỉm khó đọc. (Đúng tinh thần rule: hạn chế bôi accent lung tung, accent dành cho hành động.)
- Chip ngôn ngữ trong bảng lịch sử bên dưới đã dùng `StatusChip tone="neutral"` → neutral cho topic **đồng bộ** + sạch.
- **Số count vẫn gánh tín hiệu độ lớn** (đã in sẵn) → bỏ heatmap-pink không mất thông tin.
→ **CHỐT: chip topic dùng tone NEUTRAL/default.** Tuỳ chọn: giữ "tint đậm dần theo count" nhưng đổi sang token
  **`var(--default)`/neutral** thay `--accent` (heatmap mạnh-yếu vẫn còn mà không chói pink); hoặc phẳng neutral + count.

## Hướng (chốt)
**Hướng A ⭐**: giữ `TopicMasteryGrid` (chip, scale nhiều topic) + **đổi accent→neutral** (tint đậm dần theo count
bằng `--default`, hoặc `StatusChip tone="neutral"` phẳng). Lý do: topic là "vùng mạnh" mở-rộng → chip đúng bản chất;
neutral hết đua ppink, count vẫn nói độ mạnh.
- Hướng B: ranked bar-list (1 thanh/topic, neutral) — so độ lớn rõ hơn, nhưng cao + nặng hơn chip; chỉ chọn nếu thầy
  ưu tiên "xếp hạng" hơn "tag-cloud".
- Loại: stacked SegmentBar cho topic (mỏng/không đọc được khi nhiều domain).

## Section → dữ liệu
| Phần | Nguồn | Ghi chú |
|---|---|---|
| Theo chủ đề | `skills.byDomain[{key,solved}]` sorted desc | GIỮ chip; đổi màu accent→neutral |
| (độ khó / ngôn ngữ) | byDifficulty / byLanguage → SegmentBar | KHÔNG đụng |

## a11y / states
- `TopicMasteryGrid` giữ `role="img"` + ariaLabel; count in rõ (không dựa màu). Empty → section tự ẩn (`orderedDomain.length>0`).

---
*→ Thầy duyệt → `/ux-apply`: đổi `TopicMasteryGrid` tint `--accent`→`--default` (hoặc StatusChip neutral). Sẽ ghi
draft rule "categorical MỞ-RỘNG (topic/tag) = chip tag-cloud neutral, KHÔNG stacked-bar; bar chỉ cho ít-bucket cố định".*
