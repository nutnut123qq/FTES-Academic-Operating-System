# UX Brainstorm — Tách "Challenges" + "Coding Practice" thành 2 tab (public profile)

> `/ux-brainstorm` output. KHÔNG code. Thầy duyệt hướng → `/ux-apply`.
> Ngày: 2026-06-17. Trang: `/profile/[username]` (`PublicProfile`).

## 0. Phát hiện quan trọng (đính chính giả định)

Soi BE + FE thì **tab "Kỹ năng & Lập trình" hiện tại CHỈ chứa coding-practice (judge)** — KHÔNG gộp
challenges. Dữ liệu **Challenges (challenge chấm điểm)** hiện chỉ là **1 card nhỏ trong tab Tổng quan**
(`OverviewChallengeSkills`). Vậy việc thực chất:
- **Nâng Challenges** từ card preview → **tab riêng, đầy đủ**.
- **Giữ Coding Practice** thành **tab riêng** (đang là `ProfileSkillsTab`), gắn nhãn lại cho rõ.
- 2 card ở Overview giữ vai **preview** → "Xem thêm" trỏ sang tab tương ứng.

Kết quả: tabs đi từ 4 → **5**: `Tổng quan · Dự án · Challenges · Coding · Hoạt động`.

## 1. Mục tiêu 2 tab (≤30s người xem cần gì)

| Tab | Người xem chính | Tín hiệu cốt lõi (cắt vanity) |
|---|---|---|
| **Challenges** | **Recruiter** | "Người này ĐÃ build & PASS bài chấm điểm thật — đây là **repo** để soi code." Repo link = bằng chứng mạnh nhất. |
| **Coding** | Recruiter kỹ thuật / self | "Năng lực phỏng vấn: **độ sâu khó**, **ngôn ngữ**, **chủ đề**, nhịp luyện." Kiểu hồ sơ LeetCode. |

## 2. DỮ LIỆU THẬT (grounded) — cái gì build được NGAY vs cần BE

### 2A. Challenges — `userSolvedChallenges(userId)` → projection `user_solved_challenges_projections`
Field CÓ NGAY (mỗi challenge đã pass): `title` · `submissionUrl` (repo/docs) · `submissionType`
(GitHubUrl/GoogleDocs) · `selectedLang` (ts/java/csharp/go, có thể null V1) · `passedAt`.
Derived ngay: tổng số pass · breakdown theo `selectedLang` · timeline theo `passedAt`.

⚠️ **CHƯA có trong projection (cần BE mở rộng nếu muốn):**
- `difficulty` (challenge entity CÓ: easy/medium/hard/insane/expert) — **không** lọt vào projection.
- `score` (attempt CÓ score) — không lọt projection.
- `course` (challenge ⟶ content ⟶ course) — projection không mang → **không group theo khoá được**.
→ Muốn "độ khó / điểm / nhóm theo khoá" ở tab Challenges thì phải thêm field vào
`user_solved_challenges_projections.value.challenges[]` + GraphQL. Ghi rõ để `/ux-apply` biết ranh giới.

### 2B. Coding — 3 query đã có
- `userCodingSkills(userId)` → `byLanguage[{key,solved}]`, `byDifficulty[{key,solved}]`.
- `userCodingProgress(userId)` → `solvedProblemIds[]`, `attemptedProblemIds[]`, `revealedProblemIds[]`, `totalPoints`.
- `userCodingHistory(userId)` → `[{problemTitle, difficulty, languages[], firstSolvedAt}]`.
Derived ngay: Solved · Attempted · Acceptance≈solved/attempted · Points · độ khó · ngôn ngữ (donut) · timeline.

⚠️ **Cơ hội (cần BE):**
- `coding_problems.domain` (arrays/strings/trees/dp/graph…) + `tags[]` **có ở entity** nhưng
  `history`/projection KHÔNG mang → **topic/domain mastery** (kiểu LeetCode) cần thêm domain vào projection.
- **Hạng cá nhân**: `codingLeaderboard` trả top-N (auth-only), không trả "rank của bạn" → muốn "#12 toàn cầu"
  cần query rank riêng. Tạm thời bỏ, hoặc chỉ hiện khi xem hồ sơ chính mình.
- `revealedProblemIds` (đã mở đáp án) — có thể hiện "tự lực" nhưng dễ gây mặc cảm → cân nhắc bỏ.

## 3. Hướng thiết kế (3 hướng) → CHỐT

Cả 2 tab nên **cùng KHUNG** để như anh em sinh đôi: **[hàng metric headline] → [visual breakdown] → [list bằng chứng]**.
Khác nhau ở *điểm nhấn*.

- **Hướng A — Proof-first / recruiter (chốt).** Challenges nhấn **repo list** (artifact thật) + language bar;
  Coding nhấn **benchmark** (độ khó depth + ngôn ngữ donut) rồi history. Cắt sạch vanity (bỏ attempted-suông,
  bỏ revealed). Metric chỉ giữ cái "đọc được năng lực".
- **Hướng B — Gamified/learner.** Thêm điểm, streak, "level tiếp theo", radar topic. Hợp self-view, nhưng
  với recruiter là nhiễu + nhiều thứ cần BE (domain/streak) → hoãn.
- **Hướng C — Dashboard đối xứng tuyệt đối.** 2 tab y hệt cấu trúc. Gọn nhưng ép Challenges (data mỏng) phải
  "độn" → giả progress. Không trung thực.

→ **CHỐT Hướng A** (proof-first, khung chung, trung thực với data đang có; topic-mastery/rank để "phase 2" sau khi BE bổ field).

## 4. IA chốt — từng tab

### TAB "Challenges" (icon: `TrophyIcon` hoặc `PuzzlePieceIcon`)
1. **Headline** (`StatPair`/`MetricCard`): **N challenges đã pass**. (KHÔNG đếm-suông attempted.)
2. **Language breadth** (`SegmentBar` + legend): proportion theo `selectedLang`. Bỏ qua mục null-lang.
3. **Danh sách bằng chứng** (`LabeledCard` + `ListRow`, phân trang `useSWRInfinite` nếu dài): mỗi row =
   `title` + chip ngôn ngữ + `passedAt` (muted) + **Link "repo"** (mở `submissionUrl`, target _blank). Đây là
   ruột của tab — recruiter bấm vào repo.
   - *Khi BE thêm difficulty/score:* chèn `DifficultyChip` + điểm vào row, và 1 dải "độ khó" ở mục 2.
4. Empty: "Chưa pass challenge nào" + (self) CTA "Vào học". Visitor rỗng → ẩn tab? → KHÔNG ẩn tab (tab cố định),
   chỉ empty-state trong tab.

### TAB "Coding" / "Kỹ năng & Lập trình" (icon: `CodeIcon`)
1. **Headline metric row**: **Đã giải** · **Điểm code** (`totalPoints`) · *(self-only)* Acceptance hoặc Hạng.
   Bỏ "Đã thử" đứng một mình (vanity) — gộp thành Acceptance = giải/thử nếu muốn ngữ cảnh.
2. **Độ khó** (`SegmentBar`/`ProgressMeter` bars easy/medium/hard, màu success/warning/danger) — honest share.
3. **Ngôn ngữ** (`LanguageDonut` đã có) — donut + legend %, tránh trùng: Overview dùng bar gọn, tab dùng donut đầy.
4. *(Phase 2 cần BE domain)* **Topic mastery**: bars/radar theo `domain` (arrays/dp/graph…) — điểm nhấn LeetCode.
5. **Lịch sử giải** (`ListRow`, phân trang): `problemTitle` + `DifficultyChip` + chips `languages[]` + `firstSolvedAt`.

### Overview (giữ): 2 card preview `OverviewChallengeSkills` + `OverviewCodeSkills`, "Xem thêm" → tab mới tương ứng.

## 5. Bảng section → dữ liệu

| Tab | Section | Nguồn (query → field) | Trạng thái |
|---|---|---|---|
| Challenges | count headline | `userSolvedChallenges` → length | ✅ ngay |
| Challenges | language bar | `userSolvedChallenges` → `selectedLang` group | ✅ ngay |
| Challenges | repo list | `userSolvedChallenges` → `title/selectedLang/passedAt/submissionUrl` | ✅ ngay |
| Challenges | difficulty/score/course | challenge entity (chưa vào projection) | ⚠️ cần BE |
| Coding | metric row | `userCodingProgress` → `solved/attempted/totalPoints` | ✅ ngay |
| Coding | rank "của bạn" | leaderboard (chỉ top-N) | ⚠️ cần BE (hoặc self-only) |
| Coding | difficulty bars | `userCodingSkills.byDifficulty` | ✅ ngay |
| Coding | language donut | `userCodingSkills.byLanguage` | ✅ ngay |
| Coding | topic mastery | `coding_problems.domain` (chưa vào projection/history) | ⚠️ cần BE |
| Coding | solve history | `userCodingHistory` → `problemTitle/difficulty/languages/firstSolvedAt` | ✅ ngay |

## 6. Cắt / Thêm / Đổi
- **Cắt:** "Đã thử" đứng riêng (→ Acceptance hoặc bỏ); "revealed" (gây mặc cảm); metric đếm-suông không ngữ cảnh.
- **Thêm:** tab Challenges đầy đủ (repo-list là chủ đạo); phân trang `useSWRInfinite` cho 2 list dài.
- **Đổi:** nhãn tab Coding cho rõ là "luyện code/judge"; donut chỉ ở tab (Overview giữ bar gọn) để khỏi trùng.

## 7. State + a11y (tính từ đầu)
- Mỗi section bọc `AsyncContent`: skeleton **mirror layout** (xem `drafts/skeleton-mirror.md`), empty tự ẩn-section
  (nhưng tab vẫn tồn tại + empty-state trong tab), error→retry. (Bỏ `debug` khi build thật.)
- Tab mới phải vào hệ **tab ⟷ query string** (`?tab=challenges` / `?tab=coding`): cập nhật union `ProfileTab`,
  `PROFILE_TABS`, `TAB_ICONS`, i18n label, và `useProfileTabUrlSync` tự chạy.
- Repo link: `Link` + `rel="noopener noreferrer"` + aria-label; list dài có `useSWRInfinite`.
- 5 tab: mobile icon-only (đã có), desktop có label — vẫn scannable; nếu chật cân nhắc gộp label ngắn.

## 8. CHỐT (thầy duyệt 2026-06-17)
1. **Thứ tự tab**: `Tổng quan · Challenges · Dự án · Kỹ năng & Lập trình · Hoạt động` — **Challenges đặt
   TRƯỚC Dự án**. Icon Challenges = **`PuzzlePieceIcon`** (đồng bộ). Coding giữ nhãn cũ "Kỹ năng & Lập trình"
   + `CodeIcon` (chưa có chỉ đạo đổi tên → giữ).
2. **Làm CẢ phase-2 (BE bổ field)** — "xúc": challenges thêm `difficulty/score/courseTitle`; coding thêm
   `domain` cho history + query "rank của tôi".
3. **Giữ 5 tab** (không gộp).

## 9. Thứ tự thực thi (BE-first vì FE rich phụ thuộc field mới)

**Phase 2 — BE (repo backend), làm TRƯỚC:**
- B1. `user_solved_challenges_projections.value.challenges[]` += `difficulty` · `score` · `courseTitle`
  (sửa recompute SQL: join challenge→content→course + attempt score; bump jsonb shape) → mở field ở
  GraphQL `userSolvedChallenges` response. Migration nếu cần (jsonb nên không đổi cột).
- B2. `user_coding_projections.value.history[]` += `domain` (join `coding_problems.domain`) → field ở
  `userCodingHistory`; thêm aggregate `byDomain[{key,solved}]` vào `userCodingSkills`.
- B3. Query `myCodingRank` (hoặc field rank trên progress) — derive vị trí từ projection ORDER BY solvedCount.
- Tuân thủ CQRS recipe (7 file/projection + đăng ký primary.module entities[] 3 chỗ — xem memory
  `feedback-cqrs-no-inline-aggregate`). tsc/eslint + verify psql.

**Phase 1+ — FE (`/ux-apply`):**
- F1. Tab plumbing: `ProfileTab` union += `challenges`; `PROFILE_TABS` = [overview, challenges, projects,
  skills, activity]; `TAB_ICONS.challenges = PuzzlePieceIcon`; i18n `publicProfile.tabs.challenges`;
  panel render trong `PublicProfile`; `useProfileTabUrlSync` tự nhận `?tab=challenges`.
- F2. **`ProfileChallengesTab`** (mới): headline count + language `SegmentBar` + repo-list `ListRow`
  (`useSWRInfinite`); sau B1 chèn `DifficultyChip` + điểm + group theo `courseTitle`.
- F3. **`ProfileSkillsTab` (Coding)**: metric row (bỏ "Đã thử" lẻ) + difficulty bars + `LanguageDonut`
  + (sau B2) topic-mastery theo domain + history list phân trang; (sau B3) rank.
- F4. Overview 2 card preview → "Xem thêm" trỏ tab mới tương ứng.
- Skeleton mirror (drafts/skeleton-mirror.md); bỏ `debug` khi xong.

---

## PHỤ LỤC — Gộp khối "Thống kê" (độ khó + ngôn ngữ) làm 1 card (brainstorm 2026-06-17)

**Hiện trạng:** 2 card rời ở đầu tab Challenges — "Theo độ khó" (count hero + SegmentBar 4 tông + legend)
và "Theo ngôn ngữ" (LanguageDonut). Thầy muốn gộp 1.

**Mục tiêu:** 1 khối "Thống kê" đọc-1-mắt: *N challenges, chia theo độ khó + ngôn ngữ* — đỡ 2 frame rời.

### Hướng
- **A — 1 card, dọc, có sub-label (CHỐT đề xuất).** 1 `LabeledCard` nhãn **"Thống kê"**, body xếp dọc:
  (1) count hero "6 challenge đã pass"; (2) sub-label nhỏ "Độ khó" + SegmentBar 4 tông + legend (full-width);
  (3) sub-label "Ngôn ngữ" + LanguageDonut. Phân tách 2 mục bằng spacing (gap-6), KHÔNG divider.
  → Ưu: 1 frame, thứ tự đọc rõ (đếm → độ khó → ngôn ngữ), hợp bar ngang full-width. Nhược: card hơi cao.
- **B — 1 card, 2 cột (desktop).** Trái: count + difficulty bar + legend; phải: donut. `md:flex-row`, mobile stack.
  → Ưu: gọn chiều cao, cân hai viz. Nhược: bar độ khó bị bóp hẹp nửa cột (bar ngang cần bề rộng); donut + bar
  cạnh nhau hơi "đua" nhau.
- **C — Hero metric row + viz.** Trên: hàng 3–4 ô (Đã pass · Khó nhất · Ngôn ngữ chính · Điểm TB); dưới: bar độ
  khó + donut. → Ưu: "dashboard" giàu, tận dụng field (score TB, top lang). Nhược: nhiều thứ, lệch "gọn".

### CHỐT đề xuất: **A** — 1 card "Thống kê" xếp dọc (count → độ khó bar+legend → donut), tách bằng spacing.
Lý do: gộp đúng yêu cầu, giữ cả 2 viz nguyên dạng (bar full-width + donut), thứ tự đọc tự nhiên, không cần
divider (đồng bộ "hạn chế border"). Map dữ liệu y như đang có (difficultySegments + langs→donut), chỉ đổi
bố cục: 2 `LabeledCard` → 1 `LabeledCard` 1 body 3 mục.

→ Thầy duyệt A (hay B/C) → `/ux-apply` để dựng. KHÔNG code ở bước này.
