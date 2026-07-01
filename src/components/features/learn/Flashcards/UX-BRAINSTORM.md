# Flashcards — UX Brainstorm

> Trang: `/[locale]/courses/[courseSlug]/learn/flashcards`
> Ngày: 2026-06-18 · Skill: `/ux-brainstorm` (MAX effort) · KHÔNG code, chỉ chốt hướng.

---

## 0. TL;DR (phát hiện quyết định)

**Backend đã xây nguyên một engine spaced-repetition (SM-2) đầy đủ — frontend đang dùng nó như một xấp thẻ lật chơi cho vui.**

- BE có `myDueFlashcards` (hàng đợi "đến hạn hôm nay" xuyên mọi khóa đã enroll) → **FE KHÔNG gọi.**
- BE có `reviewFlashcard(cardId, grade 0-3)` (chấm Again/Hard/Good/Easy → lên lịch ôn lại bằng SM-2) → **FE mồ côi, KHÔNG bao giờ gọi.**
- BE có `UserFlashcardReviewEntity` (ease, intervalDays, repetitions, dueAt, lastReviewedAt + index `(user_id, due_at)`) → **FE chẳng hiển thị gì.**

⇒ Hệ quả: mỗi lần F5 thẻ reset về số 0, không "đến hạn", không "đã thuộc", không streak, không tiến bộ. **Lý do tồn tại của flashcard (ghi nhớ dài hạn) đang bị vứt.** Đây là điểm đau số 1, không phải pixel.

---

## 1. Mục tiêu trang (≤30s)

Người học ôn để **nhớ lâu / chuẩn bị phỏng vấn**. Trong 30 giây họ cần trả lời:
1. **Hôm nay tôi cần ôn gì để khỏi quên?** (due queue)
2. **Tôi đang tiến bộ không?** (retention / streak / mastery)
3. **Lật xong rồi sao?** → phải có hành động "tôi nhớ / tôi quên" để hệ thống lên lịch lại.

Trang hiện tại trả lời **0/3** câu trên. Nó chỉ cho lật thẻ + nói chuyện với AI.

---

## 2. Inventory trang hiện tại (legacy = chỉ để biết có gì)

| Phase | Cho xem gì | Tương tác |
|---|---|---|
| Deck list | title, difficulty chip, mô tả, card count, nút "Study" + search | chọn deck, lọc client-side |
| Study (FlashcardReviewer) | flip card 3D (Q→A+explanation), level chip, tags, progress "1/42" tĩnh, related lessons/modules deep-link | lật (click/Enter/Space), prev/next |
| Interview (InterviewSession) | voice Q&A: mic → transcript live → `gradeInterviewAnswer` → verdict/score/strengths/gaps/hint/follow-up | thu âm, submit, new/next question |

**Pain points:**
- ❌ **Không có vòng lặp lõi**: lật xong KHÔNG có nút "nhớ/quên" → SM-2 chết → flashcard vô nghĩa về mặt ghi nhớ.
- ❌ **Không "đến hạn hôm nay"**: `myDueFlashcards` (kể cả xuyên khóa) bị bỏ.
- ❌ **Không tiến bộ**: progress "1/42" chỉ là vị trí cuộn, reset mỗi lần vào. Không streak/retention/mastery.
- ⚠️ **Tên trang sai trục**: gọi là "Interview prep" nhưng flashcard cốt lõi là *trí nhớ*; interview chỉ là 1 chế độ.
- ⚠️ `borderline` verdict (BE có 3 mức) bị gộp chung "Not yet" đỏ → mất sắc thái.
- ⚠️ `level` + `tags` mỗi card có sẵn nhưng chỉ để trang trí — chưa lọc / chưa phát hiện điểm yếu.
- ⚠️ Search client-side, A11y thiếu `aria-live`/phím tắt rating.

---

## 3. Dữ liệu THẬT khả dụng (grounded)

### Đang có & ĐANG dùng
- `flashcardDecksByCourse(courseId)` → decks (title, displayId, description, difficulty, cards{id}).
- `flashcardDeck(id)` → deck + full cards (question, answer, explanation, level, tags) + contents/modules M2M.
- `drawInterviewCard(deckId)` → câu hỏi phỏng vấn (giấu answer).
- `gradeInterviewAnswer` → score, verdict(pass/borderline/fail), strengths, gaps, modelAnswerHint, followUpQuestion.

### Đang có nhưng FE BỎ (cơ hội lớn — không cần BE mới)
- 🔥 `myDueFlashcards(limit)` → **`{ dueCount, cards[{ cardId, deckTitle, front, back }] }`** — hàng đợi đến hạn xuyên mọi khóa enroll.
- 🔥 `reviewFlashcard(cardId, grade 0-3)` → **`{ dueAt }`** — chấm SM-2 + lên lịch lại.
- `UserFlashcardReviewEntity`: ease / intervalDays / repetitions / dueAt / lastReviewedAt (per user×card).
- `level` (junior/middle/senior/staff) + `tags[]` per card.
- `borderline` verdict (đã có trong enum).

### CHƯA có → cần BE mới nếu muốn (đánh dấu rõ là "đề xuất")
- Per-deck **dueCount / mastery%** cho user (hiện `flashcardDecksByCourse` không trả per-user). → mở rộng query hoặc thêm field.
- **Streak ôn tập** + **retention rate** (cần aggregate hoặc projection `user_flashcard_stats`). Hiện chỉ có `dueCount` toàn cục.
- Interval preview chính xác trước khi bấm (có thể tính client-side mirror SM-2, hoặc hiện `dueAt` sau khi chấm).

---

## 4. Ba hướng

### Hướng A — Spaced-repetition first ("Cỗ máy trí nhớ", kiểu Anki/Duolingo) ✅ CHỐT
Lấy **"Đến hạn hôm nay"** làm trái tim. Primary action = *Ôn N thẻ đến hạn*. Lật → **bấm Again/Hard/Good/Easy** → `reviewFlashcard` lên lịch lại. Deck = đường phụ để "cram"/duyệt. Interview = 1 chế độ trong deck.
- ➕ Tận dụng 100% backend đang lãng phí; vòng lặp quay-lại-mỗi-ngày; đúng bản chất flashcard; pattern đã được chứng minh.
- ➖ Đổi nhãn từ "Interview prep" → "Ôn tập & ghi nhớ"; cần wire `reviewFlashcard` + (nên có) per-deck due.

### Hướng B — Interview-prep first ("Phòng phỏng vấn thử")
Lấy voice mock-interview làm trung tâm; deck = bộ chủ đề; thêm lịch sử chấm + phát hiện tag yếu. SR là phụ.
- ➕ Khớp nhãn hiện tại; "sexy" (AI voice); recruiter-vibe.
- ➖ **Để SM-2 chết tiếp** — phí toàn bộ engine; không có habit loop hằng ngày; không giá trị xuyên khóa; không trả lời "tôi có nhớ không".

### Hướng C — Hub 2 chế độ (Review ↔ Interview) thống nhất bởi progress
Landing hub show cả due-queue lẫn độ-sẵn-sàng-phỏng-vấn rồi rẽ nhánh.
- ➕ Đầy đủ nhất.
- ➖ Rủi ro **2 primary action** cùng lúc (vi phạm "1 hành động chính"); hub dễ rối; tốn nhiều BE.

### → CHỐT HƯỚNG A (kèm interview làm chế độ phụ trong deck)
Lý do: lý do *duy nhất* flashcard tồn tại tách khỏi việc đọc lesson là **ghi nhớ qua lặp lại ngắt quãng**. Backend đã xây xong; không dùng = tội lớn nhất của trang. A biến investment BE thành giá trị, tạo vòng quay-lại hằng ngày, và vẫn giữ interview (chỉ hạ xuống đúng vai "luyện nói/assess" trong từng deck). C để dành làm bước tiến hóa sau khi A chạy.

---

## 5. IA mới (Hướng A)

### 5.1 Flashcards Home `/learn/flashcards` — "Ôn tập"
1. **HERO (PRIMARY): "Đến hạn hôm nay"** — `dueCount` to + nút **"Ôn N thẻ"** → vào *Review session xuyên deck của due queue*.
   - Empty (hết hạn): "Tất cả đã thuộc — quay lại sau 🎉" + gợi ý "cram một deck".
   - First-time (chưa review bao giờ): onboarding ngắn "Bắt đầu ôn — lật & tự chấm để hệ thống nhớ giúp bạn".
2. **Snapshot tiến bộ** (strip mảnh): streak ôn · retention% · forecast vài ngày tới. *(streak/retention cần BE — xem §7; MVP hiện chỉ `dueCount`.)*
3. **Decks (đường phụ — duyệt/cram)**: mỗi card = title + difficulty + card count + **due badge per-deck + mastery bar** *(per-deck due cần BE)* → actions: **"Ôn"** (study+rate) / **"Phỏng vấn thử"**.
   - Lọc theo `level` / `tags` (chip) — tận dụng field sẵn.

### 5.2 Review Session (study + SM-2) — THAY ĐỔI LÕI
- Giữ flip 3D đẹp.
- **Sau khi lộ đáp án: 4 nút rating** `Again / Hard / Good / Easy`, mỗi nút **preview khoảng cách lần sau** ("1 ngày" / "4 ngày" / "10 ngày") → gọi `reviewFlashcard(cardId, grade)` → next.
- Progress = **số thẻ còn lại trong due queue** (không phải "1/42" tĩnh).
- **Kết phiên**: "Đã ôn N thẻ · lần tới X thẻ đến hạn ngày …".
- Phím tắt: `1-4` chấm, `Space` lật; `aria-live` báo tiến độ + lịch lại.

### 5.3 Interview mode (per deck) — giữ, tinh chỉnh nhẹ
- Tách `borderline` thành verdict riêng (amber) — BE có sẵn.
- Rút **tag yếu** từ `gaps` để gợi ý "ôn lại các thẻ tag X".
- (tùy) ghi lại kết quả phiên.

---

## 6. Bảng Section → Dữ liệu BE/DB

| Section (mới) | Nguồn dữ liệu | Trạng thái |
|---|---|---|
| Hero "Đến hạn hôm nay" + nút Ôn | `myDueFlashcards { dueCount, cards }` | ✅ Có, FE đang BỎ |
| Review session (thẻ due) | `myDueFlashcards.cards` (front/back/deckTitle) | ✅ Có |
| Rating Again/Hard/Good/Easy | `reviewFlashcard(cardId, grade 0-3) → dueAt` | ✅ Có, đang mồ côi |
| Interval preview trên nút | tính client-side mirror SM-2 *hoặc* hiện `dueAt` sau chấm | ✅ Khả thi ngay |
| Deck list + difficulty + count | `flashcardDecksByCourse` | ✅ Có |
| Study 1 deck (flip) | `flashcardDeck(id).cards` | ✅ Có |
| Lọc level / tags | `card.level`, `card.tags` | ✅ Có, chưa dùng |
| Interview voice + chấm | `drawInterviewCard`, `gradeInterviewAnswer` | ✅ Có |
| Verdict borderline (amber) | `verdict` enum đã có `borderline` | ✅ Có, FE gộp mất |
| **Due badge / mastery per-deck** | mở rộng `flashcardDecksByCourse` (per-user dueCount/mastery) | ⚠️ CẦN BE |
| **Streak ôn + retention%** | aggregate / projection `user_flashcard_stats` | ⚠️ CẦN BE |

---

## 7. Cắt / Thêm / Đổi

**THÊM (ưu tiên, phần lớn 0 cần BE mới):**
1. 🔥 Vòng lặp rating SM-2 sau khi lật (`reviewFlashcard`) — *the* fix.
2. 🔥 Hero "Đến hạn hôm nay" + review session xuyên deck (`myDueFlashcards`).
3. Interval preview trên 4 nút rating.
4. Kết-phiên summary + forecast.
5. Lọc theo level/tags; tách verdict borderline (amber).
6. Phím tắt 1-4 + `aria-live`.

**CẦN BE (đề xuất, không bắt buộc cho MVP A):**
7. Per-deck dueCount/mastery cho deck card.
8. Streak + retention% (cân nhắc projection `user_flashcard_stats`).

**ĐỔI:**
- Nhãn trang "Interview prep" → **"Ôn tập"** (interview thành 1 chế độ trong deck).
- Progress "1/42 tĩnh" → "còn N thẻ trong phiên".

**CẮT:** không cắt gì nhiều — flip animation, deep-link lessons/modules, voice interview đều giữ. Chỉ hạ interview từ "ngang hàng" xuống "chế độ phụ".

---

## 8. States & A11y (tính từ đầu)
- **Loading**: skeleton đã có (deck/reviewer/session) — thêm skeleton cho hero due-count.
- **Empty**: hết due = celebratory; deck rỗng = "chưa có thẻ"; chưa review bao giờ = onboarding.
- **Error**: retry đã có; thêm retry cho due-queue.
- **A11y**: `aria-live` cho tiến độ + "lần tới X ngày"; phím `1-4` rating, `Space` lật; `role="tabpanel"` cho Study/Interview; nút rating có label rõ ("Good — ôn lại sau 4 ngày").

---

## 9b. Build status (2026-06-18, sau /ux-apply ×2)
- **DONE (FE)** vòng SM-2 lõi: DueReviewHero + DueReview (`myDueFlashcards`/`reviewFlashcard`), FlashcardReviewer cũng rate→schedule; blocks FlipCard/RatingBar; orchestrator home/due/deck; verdict borderline amber.
- **DONE (#1 BE+FE)** per-deck `dueCount` + `masteredCount` (rep≥2) — virtual @Field trên FlashcardDeckEntity, aggregate 1 query trong `listByCourse(userId)`; FE deck card hiện due chip + mastery bar.
- **DONE (#3 BE+FE)** interval preview THẬT: `previewIntervals()` (single-source SM-2) → `DueFlashcardObject.nextIntervals{again,hard,good,easy}` (days); FE RatingBar hint "N ngày". (Chỉ ở DueReview — deck-cram chưa, vì flashcardDeck là content-query không kèm per-user state.)
- **DONE (#2 BE+FE)** streak + retention (thầy chốt dựng event-log + projection): bảng mới `flashcard_review_events`(userId, cardId, grade, reviewedAt) ghi trong `review()`; CDC `flashcard_review_events` → projection `user_flashcard_stats` (currentStreak/longestStreak/retentionRate/totalReviewed/lastReviewedAt) theo khuôn user-xp (recompute TÍNH TS từ events: streak theo ngày VN, retention = grade≥2/tổng; TTL lazy-refresh). Query `myFlashcardStats`. FE `FlashcardStatsStrip` (StatPair streak/retention/reviewed) ở home, auto-ẩn khi chưa review. Đăng ký entity 3 chỗ primary.module + projections.module + barrels + debezium include-list.

## 9. Bước tiếp
Thầy duyệt **Hướng A** → `/ux-apply flashcards` để dựng. Khuyến nghị làm MVP gồm mục §7 (1)–(6) trước (gần như 0 đụng BE), rồi mới tính (7)(8) cần BE.

---

# Addendum 2026-06-21 — Tách "Học thẻ" vs "Phỏng vấn thử" (thầy thấy gộp chung → rối)

> Skill: `/starci-fe-ux-brainstorm` (Opus MAX) · KHÔNG code, chốt hướng. Ref: Quizlet study-modes
> (https://quizlet.com/gb/features/study-modes) — 1 bộ thẻ → mode picker tách nhiều chế độ học riêng biệt.

## Điểm đau (mới)
Hướng A đã dựng đúng vòng SM-2, NHƯNG nhồi 2 hoạt động khác bản chất vào 1 trang:
- **Học thẻ** = ghi nhớ qua lặp lại ngắt quãng. Mô hình: *due-queue xuyên deck* + vòng lật→tự chấm (`myDueFlashcards`/`reviewFlashcard`). Có "đến hạn", streak, mastery.
- **Phỏng vấn thử** = nói + AI chấm. Mô hình: *bốc câu hỏi theo deck* → voice → verdict (`drawInterviewCard`/`gradeInterviewAnswer`). **KHÔNG có due/SR, KHÔNG persist** (không entity lịch sử).
- Hiện interview bị **giấu 2 tầng**: deck card chỉ nhãn "Học" → vào deck → mới có toggle "Phỏng vấn thử". Subtitle trang hứa cả 2 nhưng body chỉ thấy học → lệch kỳ vọng = rối.

→ 2 mode khác **mental-mode** (nhớ thụ động vs nói chủ động) + khác **data-model** (cross-deck due vs deck-scoped stateless) ⇒ đáng tách surface, không nên chung 1 luồng.

## Ba hướng (widget đã vẽ)
- **H1 — Tab chế độ trong "Ôn tập" (✅ CHỐT đề xuất):** giữ 1 mục sidebar; dưới header thêm 2 tab thứ cấp `Học thẻ · Phỏng vấn thử`, mỗi tab 1 surface. Khớp Quizlet modes + rule [[tabscard-two-secondary-groups]] (2 nhóm secondary, underline) + [[course-home-no-duplicate-surfaces]] (không thêm mục sidebar trùng). Mỗi mode có IA riêng đúng mô hình của nó.
- **H2 — Hai mục sidebar tách hẳn:** thêm mục `Phỏng vấn thử` riêng. Tách triệt để nhưng sidebar nặng thêm + lưới chọn deck nhân đôi (vi phạm tinh thần no-duplicate-surface).
- **H3 — Deck 2 nút (Ôn thẻ · Phỏng vấn), không đổi nav:** nhẹ nhất, hết-giấu interview, nhưng KHÔNG thật sự "tách 2 phần" như thầy muốn.

### CHỐT H1 — lý do
Tab giữ điều hướng gọn (1 "nhà" = Ôn tập), nhưng cho mỗi mode trọn vẹn IA riêng: tab Học thẻ = due-hero + stats + deck-list "Ôn" (giữ nguyên Hướng A); tab Phỏng vấn thử = lưới chủ đề (deck) → vào buồng voice. Hết cảnh "nhãn Học mà bên trong lại có phỏng vấn".

## IA mới (H1)
**Trang `/learn/flashcards` = "Ôn tập"**, header + breadcrumb giữ, thêm hàng **tab thứ cấp** (TabsCard secondary):

### Tab 1 — Học thẻ (mặc định) — giữ nguyên Hướng A
1. Hero "Đến hạn hôm nay" (`myDueFlashcards.dueCount` → Ôn N thẻ, vòng SM-2).
2. Stats strip (`myFlashcardStats`: streak/retention/reviewed, auto-ẩn khi chưa ôn).
3. Deck list (cram): mỗi deck due-badge + mastery bar + nút **"Ôn"** (chỉ còn 1 hành động — bỏ interview khỏi deck).

### Tab 2 — Phỏng vấn thử (mới tách)
1. **Lưới chủ đề** = các deck (title + difficulty + số câu) → mỗi tile nút **"Phỏng vấn"** → vào `InterviewSession(deckId)`.
2. (tùy) lọc theo `level` (junior/middle/senior/staff) / `tags` — field card có sẵn, hợp ngữ cảnh "luyện theo cấp phỏng vấn".
3. Buồng voice giữ nguyên (mic → transcript → verdict pass/borderline/fail + strengths/gaps/hint/follow-up).
4. Empty/loading/error: lưới rỗng = "khoá chưa có bộ phỏng vấn"; draw lỗi = retry (đã có).

## Section → Dữ liệu BE/DB
| Section | Nguồn | Trạng thái |
|---|---|---|
| Tab bar Học thẻ / Phỏng vấn thử | UI state (local) | ✅ FE-only |
| Tab1: due hero + SR loop | `myDueFlashcards`, `reviewFlashcard`, `nextIntervals` | ✅ Đã dùng |
| Tab1: stats strip | `myFlashcardStats` | ✅ Đã dùng |
| Tab1: deck list "Ôn" | `flashcardDecksByCourse` (dueCount/masteredCount) | ✅ Đã dùng |
| Tab2: lưới chủ đề | `flashcardDecksByCourse` (title/difficulty/cards count) | ✅ Có |
| Tab2: lọc level/tags | `card.level`, `card.tags` | ✅ Có, chưa dùng |
| Tab2: voice + chấm | `drawInterviewCard` (đã fix schema 2026-06-21), `gradeInterviewAnswer` | ✅ Có |
| Tab2: lịch sử/điểm yếu phỏng vấn | — (chưa có entity persist) | ⚠️ CẦN BE (đề xuất, không bắt buộc) |

## Cắt / Thêm / Đổi
- **THÊM:** tab thứ cấp Học thẻ/Phỏng vấn thử; tab2 lưới chủ đề có nút "Phỏng vấn"; (tùy) lọc level/tags ở tab2.
- **CẮT:** toggle Study/Interview ẩn TRONG deck view (chuyển interview lên tab riêng); nút interview khỏi deck card tab1.
- **ĐỔI:** deck card tab1 chỉ còn 1 hành động "Ôn"; mọi entry phỏng vấn dồn về tab2.
- **GIỮ:** flip+rate, due session, stats, voice session, verdict — không đụng logic, chỉ tái bố trí.

## Bước tiếp
Thầy chọn hướng trên widget → `/starci-fe-ux-apply flashcards` để dựng (mặc định H1).

## Build status 2026-06-21 (sau /starci-fe-ux-apply — split + nâng cấp)
- **DONE** Split 2 tab (TabsCard secondary): `Flashcards/index.tsx` orchestrator tab `study|interview`; bỏ toggle ẩn trong deck; `FlashcardDeckList` generalize (`ctaLabel` + `showProgress`) dùng chung cả 2 tab.
- **DONE (B + phần FE của C)** Interview = PHIÊN N câu (`SESSION_LENGTH=5`): `InterviewSession` 3 phase `setup → active → summary`. Setup chọn level (All/junior/middle/senior/staff). Active: progress "Câu n/5", dedupe card trong phiên (seenIds). Summary: điểm TB + breakdown pass/borderline/fail + **weak tags** (tag của câu chưa pass) + replay.
- **DONE (A)** Lọc theo cấp: BE `drawInterviewCard(level: FlashcardLevel)` (resolver arg + `drawRandomCard` filter `card.level===level`); FE query + setup chips truyền `level`.
- **CHƯA / cần BE nặng (phần persist của C):** lịch sử phỏng vấn XUYÊN phiên (entity `interview_attempt` + query) → để bước sau. Hiện summary chỉ trong-phiên (mất khi rời tab).
- **CHƯA (D):** pixel polish (nhịp/card/empty của tab phỏng vấn) → để `/ui-apply`.

## Build status 2026-06-21b (#C persist — lịch sử phỏng vấn xuyên phiên)
- **DONE (BE)** Entity `InterviewAttemptEntity` (`interview_attempts`): userId·deckId·cardId·score·verdict·level·tags·createdAt; index (userId, deckId). Đăng ký primary.module (import + forRoot + forFeature) + barrel. synchronize=true tự tạo table.
- **DONE (BE)** Persist: `InterviewGradingService.grade()` → `recordAttempt()` (best-effort try/catch, không fail grade). 1 row / câu chấm.
- **DONE (BE)** Query `myInterviewHistory(flashcardDeckId: ID)`: `InterviewHistoryService.getSummary` aggregate (totalAnswered·averageScore·pass/borderline/fail·weakTags top6·lastAttemptAt) từ window 200 attempt mới nhất. Resolver auth + wrapper response; wire flashcard-decks.module.
- **DONE (FE)** Query `queryMyInterviewHistory` + types + barrels. `InterviewSession` setup phase hiện history strip (điểm TB · N câu đã luyện · weak tags), auto-ẩn khi chưa có; refresh sau khi xong phiên (`refreshHistory` ở `advance→summary`).
- Verify: BE tsc/lint sạch (file mới 0 lỗi); FE src 0 lỗi. Schema `myInterviewHistory` + table `interview_attempts` verify khi BE restart.
