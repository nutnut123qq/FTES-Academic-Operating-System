# UX Brainstorm — Phỏng vấn thử: RANDOM toàn khóa (bỏ chọn chủ đề) + chặn chưa-enroll (2026-06-25)

> `/starci-fe-ux-brainstorm`. Trang: `/learn/flashcards` tab **"Phỏng vấn thử"**. Thầy: *"random câu hỏi, không cho users chọn theo chủ đề; có attempts; dùng Web Voice; gửi BE chấm = AI + feedback; KHÔNG mua khóa khỏi xài; nhớ chặn nếu chưa enroll"*. KHÔNG code (chờ `/starci-fe-ux-apply`).

## 0. PHÁT HIỆN LỚN — tính năng ĐÃ DỰNG gần đủ (FE + BE)
Voice + AI chấm + attempts + history **đã có sẵn**, KHÔNG phải làm lại:
- **FE** `InterviewSession/index.tsx`: 3 phase setup→active→summary, 5 câu, `useSpeechRecognition` (Web Speech client-side STT), mic record + transcript live, submit → grade, verdict + strengths/gaps/modelAnswerHint/followUpQuestion, summary (avg + pass/borderline/fail + weak tags). `useMutateGradeInterviewAnswerSwr`.
- **BE**: `drawInterviewCard(flashcardDeckId!, level?)` (bốc random card có `answer != null`, GIẤU answer) · `gradeInterviewAnswer(flashcardDeckId, flashcardCardId, transcript)` → AI chấm (prompt theo level + rubric, model tier `Grade`, charge 10 credit auto, parse score/verdict/strengths/gaps/hint/followUp) · `myInterviewHistory(flashcardDeckId?)` (avg, pass/borderline/fail, weakTags) · `InterviewAttemptEntity` (log score/verdict/level/tags/user/deck).

→ **Việc THỰC SỰ phải làm CHỈ là 2 thứ:** (1) bỏ bước chọn chủ đề → random **xuyên toàn khóa**; (2) **chặn chưa-enroll**.

## 1. Mục tiêu trang
Học viên (đã mua) vào "Phỏng vấn thử" → bấm 1 nút → AI hỏi NGẪU NHIÊN (mọi chủ đề của khóa) → trả lời bằng giọng nói → chấm + góp ý → câu kế. Như app phỏng vấn thật (Final Round / Huru): KHÔNG bắt chọn topic, KHÔNG menu.

## 2. Đổi gì (cắt/thêm)
- **CẮT:** topic picker (`FlashcardDeckList` ở tab interview) + state `interviewDeckId` + nút "back to topics" + nhãn "Chọn chủ đề để phỏng vấn". Người dùng KHÔNG còn chọn bộ thẻ.
- **THÊM:** (a) **interview landing** = stats history (course-wide) + level selector + 1 CTA "Bắt đầu phỏng vấn"; (b) **enroll gate** bọc cả tab.
- **GIỮ NGUYÊN:** toàn bộ session (mic/transcript/verdict/summary), attempts, voice, AI grading.

## 3. IA mới (tab "Phỏng vấn thử")
```
tab=interview →
  CHƯA enroll → <EnrollGate>  (lock + "Đăng ký khóa học để luyện phỏng vấn với AI") 
  ĐÃ enroll →
    landing (phase setup):
      • intro 1 dòng ("AI hỏi ngẫu nhiên — trả lời bằng giọng nói, nhận chấm điểm + góp ý")
      • stats card (myInterviewHistory course-wide, auto-hide nếu 0 attempt): điểm TB (lớn) · đã trả lời · Đạt/Tạm/Trượt chips · chủ đề yếu chips
      • cấp độ: [Tất cả · Junior · Middle · Senior · Staff]  (đã có, drives độ khó)
      • CTA "Bắt đầu phỏng vấn" (icon mic, lg)  → session
    session (phase active): random draw toàn khóa → mic → submit → verdict → câu kế (random lại)
    summary (phase summary): avg + breakdown + weak tags + "Phỏng vấn lại"
```
→ Lần đầu (0 attempt): landing chỉ còn intro + level + CTA (sạch). Có lịch sử: thêm stats card.

## 4. Hướng (chốt A)
| Hướng | Là gì | ✅ | ❌ |
|---|---|---|---|
| **A — landing stats + Start** ✅ đề xuất | vào tab thấy stats + level + 1 nút Start → session random | rõ "đang ở đâu / luyện tiếp"; tái dùng phase setup sẵn có; 1 primary action | thêm 1 màn trước session (nhưng đáng — cho chọn level + xem tiến bộ) |
| B — vào thẳng câu hỏi | click tab = câu hỏi đầu hiện luôn, stats chỉ ở summary | nhanh nhất | mất chỗ chọn level + mất "tiến bộ"; giật (đang load câu đã vào session) |
| C — hội thoại liên tục | hỏi→đáp→feedback→hỏi mãi, không cố định 5 | giống chat phỏng vấn thật | mất ranh giới "phiên" + summary; refactor nhiều |
→ **A** (đúng tinh thần app phỏng vấn: 1 nút Start, random, theo dõi tiến bộ). Refs: Final Round AI · Huru · Interviews.chat (Q-by-Q feedback + score + voice).

## 5. Section → dữ liệu BE
| Section | Nguồn (đã có / CẦN ĐỔI) |
|---|---|
| Enroll gate | trạng thái enrolled (FE `ENROLL_REQUIRED_SURFACES` + BE guard) — **CẦN: thêm interview vào enrolled-only** |
| Stats landing | `myInterviewHistory(flashcardDeckId: null)` — **CẦN: scope theo course khi deckId null** (giờ chỉ scope deck) |
| Level selector | `FlashcardLevel` (đã có) |
| Random draw | `drawInterviewCard` — **CẦN: bỏ bắt buộc `flashcardDeckId`** → bốc random xuyên MỌI deck của course (filter answer!=null + level) |
| Chấm + feedback | `gradeInterviewAnswer(flashcardDeckId, flashcardCardId, transcript)` (card trả về đã kèm deckId → grade chạy như cũ) |
| Attempts | `InterviewAttemptEntity` (đã log) |

## 6. ⚠️ BE phải đổi (báo thầy — cần backend)
1. **`drawInterviewCard`: `flashcardDeckId` từ required → optional**, thêm scope `courseId` → khi không có deck thì bốc random card gradable (answer!=null + level) **trên TẤT CẢ deck của course**. (Hoặc query mới `drawInterviewQuestion(courseId, level?)`.) Card vẫn mang `deckId` để grade.
2. **`myInterviewHistory`: scope theo COURSE khi `flashcardDeckId` null** (giờ chỉ aggregate theo deck) → stats course-wide.
3. **Enrollment guard cho 3 resolver interview** (`drawInterviewCard`, `gradeInterviewAnswer`, `myInterviewHistory`): thêm `GraphQLMustEnrolledGuard`. **Đây là NGOẠI LỆ có chủ đích, ĐÍNH CHÍNH [[trial-preview-enrollment-optional]]** (mở flashcards cho trial): **interview = enrolled-only** vì tốn AI credit thật. "Học thẻ" (review SM-2) vẫn mở cho trial; chỉ "Phỏng vấn thử" khóa.

## 7. FE phải đổi
- `Flashcards/index.tsx`: tab interview → bỏ `FlashcardDeckList`/`interviewDeckId`; bọc bằng **enroll gate** (`enrolled ? <InterviewSession courseId/> : <EnrollGate/>`). `InterviewSession` nhận `courseId` thay `deckId`.
- `InterviewSession`: `drawInterviewCard` bỏ deckId (truyền courseId); `myInterviewHistory` course-wide; grade dùng `card.deckId`+`card.id` (đã có trong card trả về). Giữ nguyên phần voice/verdict/summary.
- SWR gate interview hooks theo `enrolled` (KHỚP BE guard) — đây là chiều NGƯỢC [[fe-swr-gate-must-match-be-enroll-guard]]: surface này CÓ gate enrolled.
- i18n: tái dùng `enrollGate.*` + `flashcard.interview.*` (bỏ key `pickLabel`/`backToTopics`/`start` của topic picker).

## 8. States / a11y
- Web Speech KHÔNG hỗ trợ (Firefox…) → fallback "trình duyệt không hỗ trợ" (đã có). Mic permission error (đã có).
- Enroll gate: lock icon + nhãn rõ "Phỏng vấn thử dành cho học viên" + CTA "Đăng ký khóa học".
- AI quota hết → `AiQuotaExhaustedException` (BE đã chặn) → FE hiện thông báo hết hạn mức (cần thêm copy nếu chưa có).

## Refs
- [Final Round AI](https://www.finalroundai.com/) · [Huru](https://huru.ai/) · [Interviews.chat](https://www.interviews.chat/) — voice answer + Q-by-Q structured feedback (score · strengths · gaps · improved answer).

## Cần thầy chốt / đã chốt
- ✅ Random toàn khóa (bỏ chọn chủ đề) · ✅ chặn chưa-enroll.
- Hỏi: giữ **5 câu/phiên** (như hiện tại) hay cho chọn số câu? (đề xuất giữ 5, đơn giản).
- Hỏi: stats landing hiện luôn hay chỉ sau phiên đầu? (đề xuất auto-hide khi 0 attempt).

---

## VÒNG 2 — 2026-06-25: setup screen đẹp hơn + level = tabs BLOCK (không underline)
> Thầy: *"chọn cấp độ nhớ là dùng tabs dạng block, không phải dạng underline; nghĩ giao diện gì hay hơn đi"*. Hiện setup quá trống (title + hint + underline tabs + 1 nút) — và level đang là `TabsCard` (underline), sai kiểu.

### Pain
- Level selector = `TabsCard` underline → thầy muốn **block/segmented** (pill, active = khối nền).
- Màn setup sparse/trống: chỉ title + hint + tabs + button, không kỳ vọng, không thành tích (stats chưa hiện vì BE chưa restart — nhưng kể cả có thì layout vẫn nhạt).

### Phân biệt 2 kiểu tabs (đính chính rule single-select→tabs)
- **Underline tabs (`TabsCard`)** = NAVIGATION / lọc nội dung phía dưới (đổi panel). Vd tab Nội dung/Thử thách, scope feed.
- **Block/segmented tabs (`SegmentedControl`)** = chọn 1 OPTION/SETTING gọn tại chỗ (không đổi panel lớn). Vd cấp độ phỏng vấn, công tắc tiền tệ. Active = khối nền (pill `bg-surface` trên track `bg-default`).
- → Level phỏng vấn là **setting pick** (không phải nav) → **`SegmentedControl` (block)**, KHÔNG underline. Bỏ giới hạn "chỉ 2–3 cái" của SegmentedControl: 5 lựa chọn gọn vẫn dùng block.

### Hướng (chốt A) — widget vòng 2
| Hướng | Là gì | ✅ |
|---|---|---|
| **A — card "sẵn sàng" gọn** ✅ đề xuất | hero mic + headline + 3 chip kỳ vọng (5 câu · giọng nói · AI chấm) + **level block-tabs** + stats gọn (best/avg/đã luyện) + 1 CTA lớn | rõ ràng, 1 primary action, có "what to expect" như app thật |
| B — stats-forward | dẫn bằng "điểm cao nhất" lớn + breakdown + weak chips, rồi level block + Start | hợp khi đã luyện nhiều; người mới ẩn stats |
→ **A** (gọn, kỳ vọng rõ). Refs: [Final Round AI](https://www.finalroundai.com/ai-mock-interview) · [Exponent](https://www.tryexponent.com/practice/ai-mock-interviews) · Codecademy interview simulator (chọn level + Begin nổi bật).

### Áp (sau khi thầy duyệt)
- `InterviewSession` setup: bọc trong **1 card** (`<Card><CardContent>`), thêm hero mic + headline `setupTitle` + 3 chip kỳ vọng; **level `TabsCard` → `SegmentedControl`** (block); stats row giữ (best/avg/đã luyện + breakdown chip) trong card; CTA "Bắt đầu phỏng vấn" `size="lg"` + icon mic.
- Block `SegmentedControl` (`blocks/navigation/SegmentedControl`) nhận `{items:[{value,label}], value, onChange, ariaLabel}` — generic, đã có.

---

## VÒNG 3 — 2026-06-27: "đơn giản quá + UI lệch → thêm tính năng, sáng tạo lên"
> Thầy: *"thêm tính năng chứ này có đơn giản quá không, với ui ux lệch quá — sáng tạo lên"*. Vòng 2 đã làm setup gọn (card + hero + 3 chip + segmented + CTA) NHƯNG: vẫn là wizard 1 bước, **nửa phải trống hoác** ("lệch"), và **đổ đi gần hết data giàu của BE**.

### Phát hiện: BE đã giàu, UI mới xài ~10%
Inventory lại (FE+BE+DB) → data đã có sẵn, chưa render:
| Nguồn | Field CHƯA dùng | Cơ hội |
|---|---|---|
| `gradeInterviewAnswer` | **`followUpQuestion`** · `modelAnswerHint` · `strengths[]`/`gaps[]` | đào sâu ADAPTIVE + scorecard |
| `myInterviewHistory` | **`weakTags[]`** · `bestScore` · pass/borderline/fail · `lastAttemptAt` | readiness hub + drill |
| `FlashcardCardEntity` | `level` (junior→staff) · `tags[]` · `answer`/`explanation` | thang cấp độ · reveal model answer |
| DB `InterviewAttemptEntity` | mỗi attempt: score/verdict/level/tags/createdAt | timeline "xem lại câu đã trả lời" |
| SRS `reviewFlashcard`/`myDueFlashcards` | — | **nối interview→flashcard** (câu trượt → ôn thẻ) |

### 3 hướng (widget đã vẽ — `show_widget interview_redesign_directions`)
- **A — Readiness Hub (ĐỀ XUẤT chính):** trang chờ thành **bento 2 cột** = (trái) hero + **mode picker** (Nhanh 5 / Sâu 10 / Điểm yếu / Leo cấp) + cấp độ segmented + CTA pink `lg`; (phải) **ring độ sẵn sàng** (`averageScore`/`bestScore`) + **thang cấp độ** (Junior/Mid/Senior/Staff) + **chủ đề cần ôn** (`weakTags` → chip drill). → sửa "đơn giản" (+mode/+readiness/+drill/+ladder) & "lệch" (dùng hết bề ngang bằng khối CÓ NGHĨA). User mới: ring 0% + nudge (không ẩn câm).
- **B — Phòng phỏng vấn nhập vai (in-session):** panel giám khảo (persona + câu + chip level/tag) | panel trả lời (mic + waveform + transcript live); sau chấm = **scorecard** (ring verdict + strengths/gaps 2 cột) + **`followUpQuestion` thành bước THẬT** ("Trả lời tiếp →") = adaptive (Skillora). Data đã có, chỉ chưa render như 1 bước.
- **C — Vòng khép kín interview↔flashcard:** trượt câu → "Thêm vào ôn tập" → câu (vốn là flashcard card) vào hàng đợi Học thẻ đến hạn (`reviewFlashcard`) → master → tái phỏng vấn → đạt. Nối 2 mode đang rời.

### Chốt
- **A + C** trước (A sửa đúng trang thầy chỉ; C = chiều sâu, low-BE). **B** vòng sau (đẹp nhất, đụng nhiều state in-session + cần persona).
- Giữ design-system StarCi (surface card + token + segmented + pink) — KHÔNG bê glassmorphism/orbs của ref. "Sáng tạo" = readiness ladder + drill + adaptive follow-up + loop SRS, KHÔNG phải hiệu ứng. Grounded, không vanity ([[progress-block-growing-quantity-headline-not-vanity-strip]]).

### BE add nhỏ (HỎI THẦY — không entity mới, chỉ mở rộng query)
1. `myInterviewHistory` breakdown theo `level` → cho thang cấp độ.
2. `drawInterviewCard` filter theo `tag` → mode "Điểm yếu" (drill weakTags) + "Leo cấp".
3. Expose `answer`/`explanation` post-grade → reveal model answer.
4. Query list `InterviewAttemptEntity` → timeline xem lại.
→ Lựa chọn: làm A bằng **data hiện có trước** (ring `averageScore`/`bestScore` + `weakTags` chip + mode Nhanh/Sâu) — thang-cấp-độ + tag-drill để vòng sau khi thầy duyệt BE add.

### Refs vòng 3
- [Google Interview Warmup](https://grow.google/) (RIP 2026-04 — model 5-câu/voice ta đang copy) · [Skillora](https://skillora.ai/) (adaptive follow-up + scorecard nhiều chiều) · [Exponent](https://www.tryexponent.com/practice) · [Huru](https://huru.ai/) · [Final Round AI](https://www.finalroundai.com/blog/best-ai-interview-practice-tools).

### ✅ CHỐT (thầy 2026-06-27) — làm Hướng A
- **Hướng A — Readiness Hub** (bento 2 cột). Bắt đầu bằng **data hiện có** (ring `averageScore`/`bestScore` + `weakTags` chip drill + mode Nhanh/Sâu/Điểm yếu/Leo cấp + cấp độ segmented); thang-cấp-độ + tag-drill chờ BE-add vòng sau.
- **DIRECTIVE UI:** nhãn "Kiểu luyện" + "Cấp độ" = block **`<Label>`** (HeroUI), KHÔNG `text-sm text-muted`/`text-xs text-muted` tay. Thầy: *"kiểu luyện cấp độ dùng Label nhé, không dùng text-sm text-muted"*. → rule: [[control-group-label-uses-label-block]] + `elements/label.md` §1b.
- Cấp độ giữ `SegmentedControl` (block, không underline — vòng 2). CTA "Bắt đầu phỏng vấn" `size="lg"` + icon mic.
- Next: `/starci-fe-ux-apply` để dựng.

### ĐÃ ÁP DỤNG 2026-06-27 (FE) — `/starci-fe-ux-apply`
- `InterviewSession` setup → **bento 2 cột** (`lg:grid-cols-[1.5fr_1fr]`):
  - **Trái** (Card): hero mic + 3 chip kỳ vọng + **Kiểu luyện** (`<Label>` + tile grid 2×2: Nhanh·5 / Sâu·10 bấm được, Điểm yếu / Leo cấp **disabled "Sắp có"**) + **Cấp độ** (`<Label>` + `SegmentedControl`) + CTA `lg` mic.
  - **Phải** (Card): **Độ sẵn sàng** (`<Label>` + headline `averageScore` + `ProgressMeter` + breakdown chip pass/borderline/fail) + **Chủ đề cần ôn** (`weakTags` chip, `border-t`). Loading = `Skeleton.Typography`+`Skeleton.Meter`; user mới (0 attempt) = meter 0 + nudge `readinessEmpty` (không ẩn câm).
- **Mode driver:** `SESSION_LENGTH` cố định → `mode` state (`quick`5 / `deep`10) → `sessionLength` (đổi expectCount + progress + isLastQuestion + advance).
- **Nhãn group = `<Label>`** (Kiểu luyện · Cấp độ · Độ sẵn sàng · Chủ đề cần ôn) — KHÔNG `text-sm/xs text-muted` (per [[control-group-label-uses-label-block]] · `elements/label.md` §1b).
- i18n thêm `flashcard.interview.{modeLabel,modeQuick,modeDeep,modeWeak,modeLadder,comingSoon,readinessTitle,readinessEmpty}` (vi+en). tsc + eslint + JSON sạch (baseline landing/blog WIP không liên quan).
- **Vòng sau (chờ BE-add):** mode Điểm yếu (tag-filter draw) + Leo cấp (per-level history) đang disabled "Sắp có"; weakTags chip hiện display-only (chưa drill). Active khi BE mở 4 query đã ghi ở §"BE add nhỏ".

---

## VÒNG 4 — 2026-06-27: bỏ chia đôi cột hẹp (1 cột) + block dùng chung `SelectableCardGroup` (HeroUI RadioGroup)
> Thầy: *"layout nhỏ rồi còn chia nữa; kiểu selectable card theo dạng tabs? 1 đống card chọn 1 cái sáng lên — nền tảng chưa có. Đọc code heroui rồi đề xuất component chung."*

### Pain
- **Bento 2 cột trong cột `max-w-3xl` (768px) = chia cái đã hẹp** → setup bị bóp, panel readiness bên phải hẹp/trống → "nhỏ rồi còn chia". Bố cục split chỉ hợp khi container RỘNG; 768px thì KHÔNG.
- **Mode tiles vòng 3 = `<button aria-pressed>` tự chế** (button-group toggle), KHÔNG phải single-select radio thật → a11y yếu (không arrow-key roving, role sai) + style lặp ở feature. Nền tảng **chưa có** component "chọn 1 card trong N".

### Đọc HeroUI (grounded — `node_modules/@heroui/react/dist/components`)
- Có sẵn: **`radio` + `radio-group`** (built trên `react-aria-components` `RadioGroup`/`Radio`). Cũng có `progress-circle` (RING native cho readiness), `button-group`, `tag-group`, `list-box`.
- `RadioRoot` (radio.js): `className: composeTwRenderProps(className, slots.base())` → **className NHẬN HÀM** `(values) => string` với `values.isSelected/isFocusVisible/isDisabled`; root mang **`data-selected="true"`**. → 1 `<Radio>` style được thành CARD: `data-[selected=true]:border-accent data-[selected=true]:bg-accent/10`, content tuỳ ý (icon + label + mô tả + badge), KHÔNG cần dot indicator.
- Đây là primitive ĐÚNG cho "chọn 1 trong N card sáng lên": RadioGroup = role radiogroup + arrow-key + single-select chuẩn. Hơn hẳn button-grid tự chế.

### ★ Đề xuất block chung — `blocks/navigation/SelectableCardGroup`
- **API:** `{ items: Array<{ value: T, label, description?, icon?, isDisabled?, badge? }>, value, onChange, ariaLabel, columns?: 1|2|3, className? }`.
- **Impl:** bọc HeroUI `RadioGroup` (`value`/`onChange` controlled, `aria-label`) + map item → `<Radio value isDisabled>` với className-hàm:
  - base: `flex items-center gap-2 rounded-xl border border-default px-3 py-3 text-sm cursor-pointer transition-colors hover:bg-default`
  - `isSelected` → `border-accent bg-accent/10 font-medium text-accent`
  - `isDisabled` → `cursor-not-allowed opacity-60 hover:bg-transparent` + render `badge` (vd "Sắp có") góc phải
  - `isFocusVisible` → `ring-2 ring-accent`
  - RadioGroup root className = `grid gap-2` + `columns` → `grid-cols-{n}`.
- **Khác `SegmentedControl`** (pill nhỏ, 1 hàng, chọn setting gọn) — `SelectableCardGroup` = card TO (icon + mô tả + badge), cho lựa chọn "nặng" hơn. **Khác `TabsCard`** (underline nav, đổi panel). Đây là single-select CONTROL dạng card.
- **Tái dùng:** kiểu luyện (interview) · cổng thanh toán (PaymentModal — hiện là list-card interactive tự chế, có thể chuyển) · chọn gói · bất kỳ "chọn 1 trong N card". 1 nguồn render ([[single-source-render]]).
- **Skeleton:** repo đã có `Skeleton/RadioGroup` → mirror.

### Layout fix — 1 CỘT (bỏ bento)
- `InterviewSession` setup về **1 cột** (full `max-w-3xl`), 1 Card, các section ngăn bằng gap/divider:
  hero → chip kỳ vọng → **readiness STRIP ngang** (full-width: ring `progress-circle` avg + cao nhất + breakdown chip — KHÔNG phải cột phải) → **Kiểu luyện** (`<Label>` + `SelectableCardGroup` columns=2) → **Cấp độ** (`<Label>` + SegmentedControl) → CTA `lg`.
- Readiness từ "cột phải hẹp" → "strip ngang gọn" → hết bóp. User mới: strip 0 + nudge (không ẩn câm).
- **Hỏi thầy:** readiness strip đặt TRÊN (status header, dưới chip kỳ vọng) hay DƯỚI CTA? (đề xuất: TRÊN — "đang ở đâu" rồi mới "cấu hình + bắt đầu").

### Refs
- HeroUI v3 RadioGroup/Radio (react-aria-components) — card-as-radio pattern (React Aria "RadioGroup" cards example) · [[single-select-among-options-use-tabs]] (phân biệt: setting nhỏ → segmented; card group → SelectableCardGroup) · [[control-group-label-uses-label-block]] (nhãn group = Label).

### Chốt (thầy duyệt 2026-06-27)
- Da card = **list-card surface** (`bg-surface` + `border-default`). **Selected = `bg-accent/10` + `border-accent`, CHỮ GIỮ `text-foreground` (đen) — KHÔNG `text-accent`** (thầy: *"text giữ màu đen tạm"*). Rule: [[selectable-card-group-surface-select-state]].

### ĐÃ ÁP DỤNG 2026-06-27 (FE)
- **Block mới `blocks/navigation/SelectableCardGroup`** (HeroUI `RadioGroup`/`Radio`): item `{value,label,description?,icon?,isDisabled?,badge?}` + `value/onChange/ariaLabel/columns`. Card-visual ở **inner `<div>`** (style theo render-prop `isSelected/isDisabled/isFocusVisible`) → KHÔNG fight `.radio` base unlayered (`flex items-start gap-3`). Selected `bg-accent/10 border-accent` (chữ foreground); disabled `opacity-60` + badge; focus `ring-2 ring-accent`. Da `rounded-xl border bg-surface`.
- `InterviewSession` setup → **1 CỘT** (bỏ bento `lg:grid-cols`): hero → chip kỳ vọng → **readiness STRIP ngang** (avg + `ProgressMeter` flex-1 + breakdown + weakTags, full-width) → **Kiểu luyện** = `SelectableCardGroup` columns=2 (thay button-grid tự chế) → **Cấp độ** SegmentedControl → CTA `lg`. Readiness đặt TRÊN (status header).
- tsc + eslint sạch (block + feature). i18n không đổi (đã thêm vòng 3).
- **Còn ngỏ:** thầy chưa chốt readiness TRÊN vs DƯỚI CTA — tạm để TRÊN, đổi dễ. weak/ladder vẫn disabled "Sắp có" (chờ BE-add).
