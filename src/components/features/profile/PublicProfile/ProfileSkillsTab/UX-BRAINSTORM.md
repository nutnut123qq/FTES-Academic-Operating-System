# UX Brainstorm — Tab "Kỹ năng & Lập trình" (Coding) align theo tab Challenge

> `/ux-brainstorm` 2026-06-17. KHÔNG code. Trang: `/profile/[username]?tab=skills` (`ProfileSkillsTab`).
> Mục tiêu thầy: **dựng IA giống tab Challenge** để 2 tab là anh em sinh đôi.

## 0. Mục tiêu trang (≤30s)
Tín hiệu **năng lực luyện code / phỏng vấn** (LeetCode-style): *giải bao nhiêu · sâu tới đâu (độ khó) · rộng
cỡ nào (chủ đề + ngôn ngữ) · so với cộng đồng (hạng/top) · bằng chứng (lịch sử giải)*. Recruiter-tech + self.

## 1. Dữ liệu THẬT (đã verify session này)
- `userCodingProgress` → `solved`, `attempted`, `revealedProblemIds`, `totalPoints`.
- `userCodingSkills` → `byDifficulty[{key,solved}]` (easy/medium/hard), `byLanguage[]`, **`byDomain[]`** (topic).
- `userCodingHistory` → `[{problemTitle, difficulty, languages[], domain, firstSolvedAt}]`.
- `userCodingRank` → `#N` (theo solvedCount). **Reward = `coding_problems.points`** (easy10/med15/hard20) → `totalPoints` = "Điểm code" (THẬT).
- ⚠️ **CHƯA có**: coding **percentile** ("Top đầu" như Challenge) — challenge có rồi, coding chỉ có rank. Cơ hội.

## 2. Hiện trạng + pain
Thứ tự HIỆN: Theo độ khó (bar) · Theo chủ đề (bar) · Theo ngôn ngữ (donut) · **rồi MỚI tới metric row
(8/27/89%/#2) ở DƯỚI CÙNG** · lịch sử. Pain:
- **Metric (số khoe) nằm DƯỚI** 3 card breakdown → ngược với Challenge (metric headline TRÊN ĐẦU). Người xem
  phải cuộn mới thấy "8 giải · #2 hạng".
- 3 card breakdown rời → nhiều scroll, không gom như Challenge ("Thống kê" 1 card).
- **Thiếu "Top đầu (%)"** — Challenge có percentile, coding không → 2 tab lệch.
- Lịch sử = `ListRow` meta-phải; Challenge submission = chip dưới title. (đồng bộ được nhưng nhỏ.)

## 3. IA MỚI (mirror tab Challenge) — 3 khối

| # | Khối | Nội dung | Nguồn |
|---|---|---|---|
| 1 | **Metric row (TOP)** | Đã giải · Điểm code · Tỉ lệ giải · **Top đầu %** · #Hạng | progress + rank + (mới) percentile |
| 2 | **Card "Thống kê"** | gom 3 mục, sub-label `Label`: Theo độ khó (SegmentBar 3 tông) · Theo chủ đề (SegmentBar) · Theo ngôn ngữ (donut thin) | skills.byDifficulty/byDomain/byLanguage |
| 3 | **Card "Lịch sử giải"** | rows: problemTitle + (ngày trái · chip độ khó · chủ đề · LanguageChip phải) | history; phân trang/`see-more` nếu dài |

→ Y CHANG xương Challenge: *[metric row] → [card Thống kê gộp] → [card list bằng chứng]*.

## 4. Hướng → CHỐT
- **A — Mirror Challenge (CHỐT).** Đúng 3 khối trên; gom breakdown vào 1 "Thống kê" card; metric lên đầu;
  thêm "Top đầu %". 2 tab thành sibling. Lý do: nhất quán, đỡ scroll, số khoe lên đầu.
- **B — Giữ 3 card breakdown rời + metric trên.** Ít gom, nhiều card; kém nhất quán Challenge.
- **C — Hero "Điểm code" to + radar topic.** Khác Challenge, gamified; lệch mục tiêu "giống Challenge".

## 5. Cắt / Thêm / Sửa
- **Thêm:** "Top đầu %" coding (BE: query percentile theo solvedCount/points — mirror `userChallengeStrength`,
  HOẶC tái dùng rank để suy % = round((pool−rank)/pool×100)). Metric row lên ĐẦU.
- **Gộp:** 3 card breakdown → 1 card "Thống kê" (sub-label `Label`, tách bằng spacing).
- **Sửa:** lịch sử row theo style Challenge (chip dưới title, ngày trái–chip phải, `items-center`); domain label
  tách camelCase ("binarySearch"→"Binary Search"); dọn folder `LanguageDonut` nested (dùng block).
- **Bỏ (cân nhắc):** `revealed` (tự lực) — dễ mặc cảm, đã thống nhất bỏ. "Tỉ lệ giải" giữ (acceptance có nghĩa).

## 6. State + a11y
- Mỗi khối `AsyncContent` + skeleton mirror (3 ô metric · card Thống kê · list). Empty tự ẩn từng mục.
- Bỏ `debug` khi build. Dot/label/muted đồng nhất `size-3` + `body-xs muted` (đã chuẩn ở Challenge).

## 7. Mở cho thầy chốt
1. **Top đầu % coding**: thêm BE query percentile riêng (chuẩn hơn) hay **suy từ rank** (nhanh, không cần BE)?
2. Lịch sử giải: đổi sang layout chip-dưới-title như Challenge luôn không?
3. Giữ 4 hay 5 ô metric (thêm "Top đầu" thành 5)?

→ Thầy duyệt **A** → `/ux-apply` để dựng (gom card + metric lên đầu + Top đầu + sửa row).
