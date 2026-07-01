# UX Brainstorm — Overview: card-lồng-card · Thử thách tuần · Daily Quest  (2026-06-18)

> `/ux-brainstorm` theo feedback: (1) KHÔNG card lồng card · (2) Thử thách tuần theo LabeledCard · (3) thêm Daily Quest.
> KHÔNG code → `/ux-apply`.

## 0. Gốc vấn đề

`LabeledCard` **LUÔN bọc `<Card><CardContent>`** (label ngoài + 1 Card trong). → nếu content TỰ là card/box, thành
**card lồng card**:
- "Tiếp tục học": resume = `ResumeCard` (PressableCard, `bg-surface rounded-3xl`) → **cards trong card**.
- "Thử thách tuần": `WeeklyChallengeCard` = `SectionCard` tự-title → KHÔNG theo LabeledCard + nếu bọc sẽ lồng.
- (ContinueLearning empty-state: `rounded-large border p-3` box → cũng box-trong-card.)

## 1. Luật card-lồng-card (chốt)

- **LabeledCard (có `<Card>`) CHỈ cho content PHẲNG** (rows/bars/list/heatmap). KHÔNG đặt card/box/Pressable
  bên trong → 1 cấp card thôi.
- **Content TỰ-LÀ-CARD (grid resume/recommended cards) = "labeled section FRAMELESS"**: chỉ Label (ngoài) + children
  TRỰC TIẾP, **KHÔNG `<Card>` bọc**. → thêm prop **`frameless`** cho `LabeledCard` (label row giữ nguyên; bỏ
  `<Card><CardContent>`, render `{children}`). (Hoặc block `LabeledSection` — nhưng `frameless` gọn hơn, tái dùng label/see-more.)

→ Áp Overview:
| Section | Kiểu | Frame? |
|---|---|---|
| Tiếp tục học (resume cards) | card-grid | **frameless** |
| Đà học (streak phẳng) | flat | LabeledCard (framed) ✓ |
| Mục tiêu tuần (KPI phẳng) | flat | LabeledCard (framed) ✓ |
| **Nhiệm vụ hôm nay** (checklist phẳng) | flat | LabeledCard (framed) |
| Thử thách tuần | flat (sau khi content-only) | LabeledCard (framed) — xem §2 |
| Hoạt động học (heatmap) | flat | LabeledCard (framed) ✓ |

## 2. Thử thách tuần → LabeledCard pattern

- Tách `WeeklyChallengeCard` (SectionCard tự-title + `@gravity-ui` + `reuseable`) → **`WeeklyChallenge` content-only**
  (title challenge + countdown "Còn Nd Mh" + nút "Thử ngay" + "N người đã vượt qua" + leaderboard rows — đều PHẲNG).
- OverviewTab bọc `LabeledCard label="Thử thách tuần" icon=FlameIcon`. Self-hide khi không có (AsyncContent/null).
- Dọn `@gravity-ui`→phosphor, `<span>`→Typography khi tách (đồng bộ rule).

## 3. Daily Quest (MỚI) — "Nhiệm vụ hôm nay"

**Mục đích:** hook quay-lại HÀNG NGÀY (Duolingo daily quests) — vài nhiệm vụ nhỏ/ngày, hoàn thành → thưởng điểm quà.
Khác "Đà học" (streak nhìn lại) và "Mục tiêu tuần" (target tự đặt, theo tuần): Daily Quest = nhiệm vụ CỐ ĐỊNH/ngày + phần thưởng.

**BE — CHƯA CÓ model (nêu rõ, đừng fake).** Có sẵn để tái dùng: tín hiệu hoạt động/ngày (xp_histories /
coding_submissions / flashcard_reviews theo `created_at::date = today`), `writeXpHistory()` (grant điểm idempotent),
pattern ledger chống double-claim (`reward_redemptions`), cron hàng ngày (`StreakFreezeCronService`).

**Tối thiểu cần thêm (BE, ~1.5–2h):**
- **Bảng `daily_quest_completions`** (`user_id`, `quest_date` UNIQUE(user_id,quest_date), `reward_points`, `completed_at`) — chống claim trùng/ngày. (CQRS-exempt: bảng ledger ghi, không phải read nặng.)
- **Query `myDailyQuest`** → `{ date, tasks: [{type, target, current}], allDone, claimed, reward }`. `current` tính từ
  count hôm nay (read content / pass challenge / review flashcards). `claimed` = có row hôm nay.
- **Mutation `claimDailyQuestReward`** → nếu `allDone && !claimed`: `writeXpHistory(points)` + insert completion (1 transaction).
- Task mặc định (config/seed như weekly-challenge, KHÔNG cần bảng definition): đọc 1 nội dung · pass 1 challenge ·
  ôn 5 flashcard. Reward vd 20 điểm quà.

**FE — `DailyQuest`** (`features/dashboard/DailyQuest`, content-only trong LabeledCard "Nhiệm vụ hôm nay"):
- Checklist 2–3 dòng: icon + label + `current/target` + tick khi đủ. AsyncContent (skeleton mirror).
- Nút **"Nhận thưởng"** (primary): enable khi `allDone && !claimed`; sau claim → state "Đã nhận" + toast (useGraphQLWithToast).
- Vị trí: Overview, **gần đầu** (sau "Tiếp tục học", trước "Đà học") — driver hằng ngày.

**Hướng (daily quest):**
- A — CHỐT: full daily quest (query+claim+bảng completion). Đúng "thêm daily quest", có thưởng, chống trùng.
- B — Lite (chỉ hiện tiến độ, KHÔNG claim/thưởng): vẫn cần per-type-today (BE), mà bỏ reward → yếu engagement. Loại.

## 4. Section → data

| Section | Hook/field | Ghi chú |
|---|---|---|
| Tiếp tục học (frameless) | `myInProgressChallenges`+`myLearnedLessons`+`myCourses` | cards trực tiếp, không Card bọc |
| Nhiệm vụ hôm nay | **`myDailyQuest`** (MỚI) + `claimDailyQuestReward` (MỚI) | reuse `writeXpHistory` |
| Đà học | `myWeeklyStats` | |
| Mục tiêu tuần | `myKpis` | |
| Thử thách tuần | `weeklyChallenge` | content-only + LabeledCard |
| Hoạt động học | `myContributionCalendar` | |

## 5. Cắt / Thêm / DB
- **Thêm prop `frameless`** cho `LabeledCard` (block) → "Tiếp tục học" hết lồng card.
- **Tách** `WeeklyChallengeCard` → `WeeklyChallenge` content-only + LabeledCard.
- **MỚI (BE):** `daily_quest_completions` + `myDailyQuest` + `claimDailyQuestReward` (reuse writeXpHistory; task config). 
  **MỚI (FE):** `DailyQuest` component.
- a11y/state: AsyncContent từng section; claim nút `isPending`; reduced-motion.

## 6. Mở (chốt lúc /ux-apply)
- Task set + reward điểm: 3 task (content/challenge/flashcard) + 20 điểm? (đề xuất mặc định) — thầy chốt số.
- `frameless` prop trên LabeledCard vs block `LabeledSection` riêng → mặc định **prop frameless**.
