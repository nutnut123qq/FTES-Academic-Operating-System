# UX Brainstorm — Khối "Tiến bộ" flashcard (FlashcardStatsStrip)

> `/starci-fe-ux-brainstorm` · 2026-06-25 · trang Ôn tập `/learn/flashcards` (study home). KHÔNG code — chốt hướng rồi `/starci-fe-ux-apply`.

## Vấn đề (vì sao "phèn")
Khối hiện tại = `LabeledCard "Tiến bộ"` bọc **3 `StatPair` phẳng**: `currentStreak` · `retentionRate%` · `totalReviewed`. Đặt giữa DueReviewHero (primary) và deck list.
- **Vanity stat-strip**: 3 con số NGANG HÀNG, không phân cấp, không kể chuyện gì → "dashboard cho có".
- **Số bé = trông tội**: user mới ra `1 · 100% · 1` (streak 1, retention 100% từ ĐÚNG 1 review = nhiễu, totalReviewed 1) — số nhỏ in to = phèn.
- **Không nối với mục tiêu**: thứ học viên thực sự muốn biết = "tôi đã THUỘC bao nhiêu / còn bao xa tới thuộc hết bộ thẻ phỏng vấn" — khối hiện KHÔNG show.
- **Phí field BE đã có**: `longestStreak` + `lastReviewedAt` trả về nhưng FE bỏ.

## Mục tiêu khối (≤10s)
Học viên liếc 1 phát thấy: **(1) tôi đã thuộc tới đâu** (đại lượng lớn dần, có nghĩa) + **(2) đang giữ nhịp không** (momentum). Cắt số vanity, 1 tín hiệu CHÍNH, phần còn lại là phụ.

## Data THẬT khả dụng (research BE/DB — KHÔNG cần query mới)
| Tín hiệu | Field / nguồn | Có sẵn? |
|---|---|---|
| **Đã thuộc / tổng (mastery)** | `flashcardDecksByCourse` → Σ `deck.masteredCount` / Σ `deck.cards.length` (mastered = SM-2 `repetitions ≥ 2`) | ✅ ngay |
| **Chưa học (new backlog)** | `myDueFlashcards(courseId)` → `newTotalCount` | ✅ ngay |
| **Đang học** | suy ra = `tổng − mastered − new` | ✅ ngay |
| **Streak hiện tại / kỷ lục** | `myFlashcardStats` → `currentStreak` · `longestStreak` *(đang phí)* | ✅ ngay |
| **Tỉ lệ giữ lại** | `myFlashcardStats.retentionRate` (% grade ≥ 2) | ✅ ngay |
| **Ôn gần nhất** | `myFlashcardStats.lastReviewedAt` *(đang phí)* | ✅ ngay |
| Đến hạn hôm nay (overdue + new cap) | `myDueFlashcards` → `dueReviewCount` / `newCount` | ✅ (đã ở DueReviewHero) |
| ❌ forecast 7 ngày · heatmap reviews/ngày · maturity histogram chi tiết · retention theo deck | cần QUERY MỚI (dueAt buckets / events group-by) | ✗ — KHÔNG thiết kế cho cái chưa có |

→ **Mọi hướng dưới chỉ dùng field ĐÃ CÓ.** Mastery meter ghép từ `flashcardDecksByCourse` (đã fetch sẵn ở deck list) + `myDueFlashcards` (đã fetch ở hero) → gần như 0 query thêm.

## Ref (web + memory)
- **Brainscape** — "Mastery %" = weighted confidence, meter ở deck/class level, "guide chứ không phải scoreboard". → mastery meter là tín hiệu CHÍNH của SRS hiện đại. ([brainscape.com](https://www.brainscape.com/academy/brainscape-vs-anki/))
- **Anki / Space** — maturity new/young/mature; Space 2026 thay bằng "knowledge progress metric" (gộp maturity thành 1 thước). → xu hướng: 1 thước thay vì nhiều bucket rời. ([laxuai.com 2026 roundup](https://laxuai.com/blog/best-spaced-repetition-apps-2026))
- **Duolingo** — streak làm habit hook (nhưng chỉ mạnh khi đã có data).
- Memory/rules nội bộ: [[item-card-meta-inside-bounded-object]] (1 progress/lúc) · [[one-progress-bar-at-a-time]] · [[course-home-no-duplicate-surfaces]] (cắt vanity, 1 primary).

## 3 hướng (xem widget)
### Hướng A — Mastery-meter-led ✦ ĐỀ XUẤT
- Header "Tiến bộ" + **streak = chip phụ** (`ti-flame 3 ngày`) góc phải (không phải số bự).
- **Headline = thước "Đã thuộc 12 / 120 thẻ · 10%"** (đại lượng lớn dần, nối thẳng mục tiêu).
- **Thanh segmented maturity**: Đã thuộc (green) · Đang học (amber) · Chưa học (track) + legend + caption nhỏ "giữ lại 92%".
- **Vì sao chốt**: (1) tín hiệu CHÍNH = mastery (thứ thực sự tăng, có ý nghĩa SRS), khớp Brainscape; (2) gom 3 vanity number → 1 meter có chuyện kể; (3) số nhỏ không còn "tội" (10% của 120 đọc ra "mới bắt đầu", hợp lý); (4) streak/retention thành PHỤ đúng vai; (5) 0 query mới.
- **Trade-off**: cần Σ qua decks (đã có data ở deck list — share hoặc 1 fetch nhẹ).

### Hướng B — Momentum/habit-first
- Streak bự + `ti-flame` · kỷ lục 5 ngày · ôn gần nhất · giữ lại 92% (xài HẾT `myFlashcardStats` incl. 2 field đang phí).
- **Trade-off**: streak data MỎNG với user mới → "1 ngày" trông tội (đúng bệnh cũ). Habit hook chỉ mạnh khi đã có chuỗi dài. Không show mastery (mục tiêu thật).

### Hướng C — Gộp vào due-hero, bỏ card (design restraint)
- Bỏ hẳn card "Tiến bộ"; progress = 1 **dòng meta câm** dưới nút "Ôn N thẻ" (Chuỗi 3 · Đã thuộc 12/120 · giữ lại 92%).
- **Trade-off**: gọn nhất, hết "card thừa" — nhưng mất surface tiến bộ riêng; nếu thầy muốn 1 khối tiến bộ rõ thì C quá nhẹ.

## Đề xuất chốt
**Hướng A** (mastery-meter-led). Lý do gọn: progress block của 1 SRS app phải trả lời "tôi thuộc tới đâu" — đó là mastery, không phải 3 con số rời. A nâng đại lượng có-nghĩa lên headline, hạ vanity xuống phụ, dùng 100% data đã có. Nếu thầy thiên "tối giản tuyệt đối" → C; thiên "habit/gamify" → B.

## States
- **Empty** (chưa review thẻ nào, `totalReviewed === 0` **và** `masteredCount tổng === 0`): KHÔNG ẩn câm — render meter 0% + dòng mời "Ôn thẻ đầu tiên để bắt đầu theo dõi thuộc bài" (khối có nhãn → empty-state, [[labeled-section-render-empty-not-self-hide]]). *(Cân nhắc: nếu đã có due nhưng chưa thuộc, meter 0/120 vẫn hợp lệ như GitHub heatmap rỗng.)*
- **Loading**: skeleton mirror = thanh meter + legend (không phải 3 stat cũ).
- **Error**: giữ `AsyncContent` errorContent + retry.
- **Retention caption chỉ hiện khi đủ nghĩa**: ẩn "giữ lại X%" khi `totalReviewed < ~5` (tránh "100% từ 1 review" nhiễu).
- a11y: meter có `aria-label` "đã thuộc 12 trên 120 thẻ"; chip streak có text.

## Sau khi thầy duyệt
`/starci-fe-ux-apply` dựng: viết lại `FlashcardStatsStrip` theo A (mastery meter từ `flashcardDecksByCourse` + `myDueFlashcards` + `myFlashcardStats`), skeleton mirror, empty-state, retention-gate. Rút nguyên tắc tổng quát ("progress block = đại lượng lớn dần làm headline, vanity number xuống phụ") → `.claude/rules/drafts/`.
