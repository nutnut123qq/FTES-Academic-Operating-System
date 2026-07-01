# UX Brainstorm — 2 tab "Challenges" + "Kỹ năng & Lập trình" (profile)

> Output `/ux-brainstorm`. KHÔNG code. Grounded BE/DB thật (đọc cả trang Challenges + Practice).
> Duyệt hướng → `/ux-apply` → `/ui-apply`. Cả 2 tab HIỆN ĐÃ dựng (thầy/linter) — đây là tinh chỉnh để
> COHERENT + phân vai rõ + xài hết dữ liệu giàu, KHÔNG đập đi.

## 0. 2 tín hiệu KHÁC NHAU (đừng để trùng vai)
- **Challenges** = *"bằng chứng BUILD thật"*: nộp repo → AI chấm điểm theo rubric, có **score + percentile + rank** vs peers, theo **độ khó (4 mức incl insane)** + **ngôn ngữ**, gom theo **khóa**. → recruiter: "build được đồ thật, xếp hạng vs cộng đồng".
- **Kỹ năng & Lập trình (coding/practice)** = *"độ thành thạo ALGO/DSA"* kiểu LeetCode: solved theo **độ khó (3 mức)**, theo **20 DOMAIN/topic**, theo **ngôn ngữ**, **rank toàn cục**, lịch sử giải. → recruiter: "vững thuật toán, phủ rộng chủ đề CS".
→ GIỮ 2 tab riêng; **mỗi tab 1 section ĐỘC NHẤT làm danh tính** (Challenges=repo proof, Coding=topic mastery).

## 1. Dữ liệu THẬT
### Challenges
- `userSolvedChallenges(userId)` → `[{ title, submissionUrl, submissionType(github|googleDocs), selectedLang(ts|java|csharp|go|null), difficulty(easy|medium|hard|insane|null), score(0-100|null), courseTitle, passedAt }]`
- `userChallengeStrength(userId)` → `{ percentile(0-100|null), rank(1-based|null), xp }` (strength = Σ điểm-theo-độ-khó).
- ⚠️ Challenge KHÔNG có field category/domain/track (chỉ thuộc course). Gom theo **course** là đúng dữ liệu.
- Field CHƯA xài: `submissionType` (icon github vs docs), `score` (ở Overview), `passedAt` (relative time).

### Coding practice
- `userCodingProgress` → `{ solvedProblemIds[], attemptedProblemIds[], totalPoints }` → **acceptance = solved/attempted**.
- `userCodingSkills` → `{ byDifficulty[{key easy|medium|hard, solved}], byLanguage[{key py|js|ts|java|cpp, solved}], byDomain[{key, solved}] }` — **byDomain = 20 topic** (arrays/strings/hashing/twoPointers/slidingWindow/stack/queue/linkedList/trees/heap/graph/binarySearch/sorting/recursion/backtracking/dynamicProgramming/greedy/math/bitManipulation/matrix).
- `userCodingHistory` → `[{ problemTitle, difficulty, domain|null, languages[], firstSolvedAt }]`.
- `userCodingRank(userId)` → `number|null` (rank toàn cục theo solvedCount).
- 💎 **byDomain (20 topic) = mỏ vàng CHƯA khai thác đúng** (giờ chỉ SegmentBar top-10) → topic-mastery grid.

## 2. Điểm đau hiện tại (từ audit)
- **3 kiểu viz ngôn ngữ** lẫn lộn: LanguageDonut (Challenges tab) vs SegmentBar (Overview challenge) vs StatusChip list (coding). → loãng, thiếu nhất quán.
- **Đếm trùng**: count challenge + count coding rải Overview + 2 tab → recruiter rối "số nào quan trọng".
- **2 hệ rank** (challengeStrength.percentile/rank vs codingRank) — OK vì 2 signal khác, NHƯNG phải gắn nhãn rõ.
- **byDomain** bị cắt top-10 SegmentBar → mất flex "phủ chủ đề".
- Empty-state **chung 1 key** `publicProfile.skills.empty` cho cả 2 → nên tách.

## 3. Hướng (CHỐT A)
### A — 2 tab coherent, viz nhất quán, mỗi tab 1 section signature *(CHỐT)*
**Nguyên tắc xuyên 2 tab:** mỗi loại metric = **1 kiểu viz DUY NHẤT**:
- **Độ khó** → luôn `SegmentBar` (depth, đếm thật). Challenges 4-tone (easy/med/hard/insane), Coding 3-tone.
- **Ngôn ngữ** → luôn `SegmentBar` (bỏ LanguageDonut + StatusChip-list để hết 3-kiểu). 1 treatment 2 tab + Overview.
- **Rank/percentile** → MetricCard headline, nhãn rõ (Challenges "Top X% · #rank"; Coding "#rank · acceptance%").

**Challenges tab** (proof):
1. Headline `MetricCard` ×4: **Đã qua · XP · Top {percentile}% · #{rank}** (percentile = flex chính).
2. **Phân bố độ khó** `SegmentBar` 4-tone.
3. **Ngôn ngữ** `SegmentBar`.
4. **Bài nộp gom theo khóa** (`ChallengeCourseRow` collapsible) — mỗi dòng: tên + `DifficultyChip` + **score màu** (≥90 success/≥70 warning/<70 danger) + **repo link** (icon theo `submissionType`) + passedAt relative. ← **section ĐỘC NHẤT = bằng chứng mở được**.

**Kỹ năng & Lập trình tab** (proficiency):
1. Headline `MetricCard` ×4: **Đã giải · Điểm · #{rank} · Acceptance {%}** (acceptance thay vanity "attempted").
2. **Độ sâu theo độ khó** `SegmentBar` 3-tone.
3. **💎 Topic mastery grid** — TẤT CẢ 20 domain có solved>0, sort solved desc, mỗi topic = chip mềm `{TopicLabel} · {solved}`, **đậm nhạt theo solved** (data-driven intensity, vd `bg-accent` alpha theo tỉ lệ) → nhìn phát thấy "mạnh mảng nào". ← **section ĐỘC NHẤT = phủ chủ đề CS**.
4. **Ngôn ngữ** `SegmentBar`.
5. **Lịch sử giải gần đây** list: title + `DifficultyChip` + domain chip + langs + relative date.

### B — Gộp 1 tab "Kỹ năng" 2 sub-section *(loại)*
Gộp Challenges + Coding 1 tab + toggle. → 2 signal khác bị pha loãng; nav đã tách 2 tab. Loại.

### C — Skill-graph hợp nhất xuyên hệ *(loại — chờ BE)*
Trộn challenge-track + coding-topic thành 1 "strongest skills". Đẹp nhưng challenge KHÔNG có domain → không join sạch. Để dành (cần BE thêm category cho challenge).

## 4. Map section → dữ liệu
| Tab | Section | Query/field |
|---|---|---|
| Challenges | Headline | `userChallengeStrength` (xp/percentile/rank) + count từ `userSolvedChallenges` |
| Challenges | Độ khó / Ngôn ngữ | `userSolvedChallenges[].difficulty / .selectedLang` |
| Challenges | Bài nộp/khóa | `userSolvedChallenges` (+`courseTitle` group, `score`, `submissionUrl`, `submissionType`, `passedAt`) |
| Coding | Headline | `userCodingProgress` (solved/attempted→acceptance, points) + `userCodingRank` |
| Coding | Độ khó / Ngôn ngữ | `userCodingSkills.byDifficulty / .byLanguage` |
| Coding | **Topic grid** | `userCodingSkills.byDomain` (20 topic — dùng HẾT) |
| Coding | Lịch sử | `userCodingHistory` |

## 5. Cắt / Thêm
- **Cắt:** LanguageDonut + StatusChip-list ngôn ngữ (→ SegmentBar 1 kiểu); byDomain SegmentBar top-10 (→ topic grid đủ 20); datetime tuyệt đối (→ relative); "attempted" vanity (→ acceptance%).
- **Thêm:** **topic-mastery grid** (block mới `TopicMasteryGrid` hoặc compose chips intensity); score màu + submissionType icon ở repo link; tách empty-key (`challenges.empty` vs `coding.empty`); percentile làm headline Challenges.
- **Tận dụng chưa dùng:** `byDomain` đủ 20, `submissionType`, `passedAt` relative, `acceptance`.

## 5b. ADDENDUM — đồng bộ SNAPSHOT (Tổng quan) với TAB đầy đủ (thầy chốt 2026-06-17)
"Chả khác gì" vì `/ux-apply` mới đổi 2 tab đầy đủ (sau "Xem thêm"); 2 card snapshot ở Tổng quan
(`OverviewChallengeSkills` + `OverviewCodeSkills`) CHƯA đụng → còn lệch. **Yêu cầu: snapshot KẾ THỪA y
hệt viz/legend của tab đầy đủ** (cùng metric = cùng chart + cùng nhãn + cùng màu):
- **`OverviewCodeSkills`** (Kỹ năng qua Luyện tập): ngôn ngữ đang là **StatusChip-list** ("Python·2…") →
  đổi **`SegmentBar`** + `getLanguageLabel` (Csharp→C#, Typescript→TypeScript…) + `getLanguageColor` (brand).
  Độ khó: giữ `SegmentBar` nhưng dùng ĐÚNG màu/nhãn 3-tone như `ProfileCoding` (CODING_DIFFICULTY).
- **`OverviewChallengeSkills`** (Kỹ năng qua Challenge): ngôn ngữ `SegmentBar` đang hiện **"Csharp"/"Typescript"
  + palette mặc định** → đổi `getLanguageLabel` + `getLanguageColor` (khớp tab Challenges). Độ khó: nếu hiện
  thì dùng `buildDifficultySegments` 4-tone y tab.
- **Legend = 1 nguồn**: label ngôn ngữ qua `getLanguageLabel`, màu qua `getLanguageColor`; độ khó qua cùng
  meta (CODING_DIFFICULTY / difficultyMeta) — KHÔNG mỗi nơi tự map/tự palette.
→ Đây là phần "+ Overview" của Hướng A; chỉ là CONSISTENCY, không đổi cấu trúc snapshot (teaser vẫn gọn).

## 6. A11y/states
Mọi section qua `AsyncContent` (skeleton mirror, empty tự ẩn/CTA "vào Luyện tập"/"làm Challenge", error retry). Topic chip intensity KHÔNG chỉ dựa màu — kèm số `· {solved}` (color-not-only). Repo link reachable bàn phím + aria-label.
