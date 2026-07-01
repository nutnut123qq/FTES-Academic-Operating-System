# StarCi Points / XP Economy — DEFINITIVE SPEC

> Single source of truth for every "score" number in StarCi. Read this before touching any
> points/XP/leaderboard/league/profile UI or backend grant logic. Supersedes scattered JSDoc.
>
> Last verified against source: 2026-06-17.

---

## 0. TL;DR — there are FIVE numbers, not one

| # | Currency | Stored where | Scope | Spendable? | Drives |
|---|----------|--------------|-------|-----------|--------|
| 1 | **Global Points** | `users.points` (int col) | global, cross-course | YES (streak freeze) | global leaderboard, weekly league, dashboard "this week", coding "Điểm code" |
| 2 | **Per-course XP** | `user_course_progress_projections.value->>'totalXp'` (jsonb projection) | per course | no | per-course Leaderboard + XP breakdown |
| 3 | **Coding points** | *(NOT a separate column)* = a READ of `users.points` (#1) | global | — | Profile › Coding tab "Điểm code" |
| 4 | **Challenge strengthScore** | `user_solved_challenges_projections.value->>'strengthScore'` (jsonb) | global, derived | no | Profile › Challenges tab percentile + rank |
| 5 | **Attempt score** | `coding_submissions` / challenge attempt rows; ledgered as `xp_histories.amount` | per attempt | no | per-submission "{score} điểm"; is the SOURCE of per-course XP challenge component |

The single mistake everyone makes: assuming "coding points" (#3) is a separate balance. **It is not.** It is the same `users.points` column as Global Points (#1). See §3.

---

## 1. The ledger: `xp_histories`

Append-only audit ledger, ONE row per earning event. `UuidAbstractEntity` (id + created_at/updated_at) plus:

- `user_id` FK → users, NOT NULL, CASCADE, indexed
- `course_id` FK → courses, NULLABLE (null = course-agnostic event)
- `source` enum `xp_source`: `challenge` | `lessonRead` | `milestone`
- `amount` int — the **XP** (per-course weighted signal)
- `points` int default 0 — the **flat reward Points** credited to `users.points`
- `ref_id` varchar(64)
- **UNIQUE(source, ref_id)** → idempotent; **@Index** on user

Each row carries **two independent numbers**: `amount` (XP → leaderboard) and `points` (Points → balance). They are *designed to diverge*. `amount` never touches any `users` column; only `points` increments `users.points`.

`File`: `backend/src/modules/databases/postgresql/primary/entities/xp-history.entity.ts`, `.../enums/xp-source.ts`

### writeXpHistory (the only writer)
`backend/src/features/api/processors/ai/shared/xp/write-xp-history.ts`
1. `findOne(XpHistoryEntity, {source, refId})` → if exists, return early (no dup row, no double credit).
2. Insert one row with `amount` + `points`.
3. `entityManager.increment(UserEntity, …, "points", points)` — **only when `points !== 0`**.

---

## 2. Currency #1 — Global Points (`users.points`)

- **Storage:** `users.points` — int, default 0, `@Field(() => Int)`. The **only** balance column on `UserEntity`. There is NO `coding_points`, NO `reward_points` column (those names appear only in prose/JSDoc).
- **Identity:** it is simultaneously (a) the account **XP** number (per the Level-Removed-XP-Only design), (b) the **spendable** currency (`buyStreakFreeze` debits it, max 3 freezes held in `users.streak_freezes`), and (c) the global-leaderboard + coding "Điểm code" source.
- **How earned (3 paths via FLAT_POINTS + 1 coding path):**

  | Event | source | `amount` (XP) | `points` (→users.points) | Caller |
  |-------|--------|---------------|--------------------------|--------|
  | Read lesson | `lessonRead` | `LESSON_READ_XP` = 3 | `FLAT_POINTS.lessonRead` = 5 | `mark-as-readed.handler.ts` |
  | Pass milestone task | `milestone` | `MILESTONE_PASS_XP` = 10 | `FLAT_POINTS.milestonePassed` = 30 | `review-milestone-task-complete-step.service.ts` |
  | Pass challenge (Google Docs) | `challenge` | attempt `score` | `FLAT_POINTS.challengePassed` = 20 | `process-submission-complete-step.service.ts` |
  | Pass challenge (Git) | `challenge` | attempt `score` | **`score`** ⚠️ BUG, see §6 | `process-git-submission-complete-step.service.ts` |
  | Coding first-solve | *(no ledger)* | — | `problem.points` (easy 10 / med 15 / hard 20) | `judge-coding-submission-judge-step.service.ts` |

- **Displayed on profile:** Profile › Coding tab "Điểm code / Coding pts" (`myCodingProgress.totalPoints`). NOT shown in the Hero/identity column (XP intentionally omitted there). Also drives Dashboard global board + weekly league.

`Files`: `backend/.../entities/user.entity.ts`, `.../shared/xp/points-config.ts`

---

## 3. Currency #3 — Coding points = an ALIAS of #1 (resolved)

There is no coding-specific balance. `CodingProgressService.compute()` returns
`totalPoints: Number(pointsRows[0]?.points ?? 0)` from `SELECT points FROM users WHERE id = $1`.

- The doc comment (`coding-progress.service.ts:102`) says "users.coding_points" and "cumulative coding score" — **stale/misleading**. The actual SQL (line 127-128) reads `users.points`.
- The coding solve path increments the SAME `users.points` (`judge-…-judge-step.service.ts:284-291`) and does **not** write `xp_histories`. Besides the increment it writes one `Activity` row (`CodingSolved`, idempotent on user+problem).
- **Consequence:** "Điểm code" = the user's **entire** global Points balance (coding + reading + challenge + milestone), not a coding-only total. The label is wrong; the number is global.
- **Award gating** (coding): only on the FIRST clean Accepted solve — counts Accepted submissions (just-saved row included → exactly 1 = first), AND forfeits if a `coding_solution_reveals` row exists for (user, problem).

`File`: `backend/src/modules/bussiness/coding/coding-progress.service.ts`

---

## 4. Currency #2 — Per-course XP (projection `totalXp`)

- **Storage:** `user_course_progress_projections.value->>'totalXp'` (jsonb). Heavy aggregation runs only in the projector (XP events + CDC); reads just extract.
- **Formula:** `totalXp = totalScore + lessonsRead*3 + milestoneProgress*10`
  - `totalScore` = Σ per-challenge best score
  - `lessonsRead` = count `user_contents.is_read = true` in course
  - `milestoneProgress` = count DISTINCT passed `user_milestone_tasks`
- **Ordering:** Leaderboard `ORDER BY (value->>'totalXp')::int DESC, enrollment.created_at ASC`; filters `totalXp > 0`. `getMyRank` = COUNT(strictly higher) + 1, null if not enrolled / totalXp ≤ 0.
- **Displayed:** per-course **Leaderboard** (table "XP" column, MyRankCard, XpBreakdown panel). The breakdown FE re-derives reading XP (×3) and milestone XP (×10) — these consts MUST mirror backend `LESSON_READ_XP` / `MILESTONE_PASS_XP`.

`File`: `backend/src/modules/bussiness/projections/progress/progress-projection.service.ts`

---

## 5. Currency #4 — Challenge strengthScore + the weekly league + global board

### 5a. strengthScore (#4) — profile percentile only
- **Storage:** `user_solved_challenges_projections.value->>'strengthScore'` (jsonb).
- **Formula:** weighted Σ over DISTINCT passed submissions by difficulty: easy 10 / medium 20 / hard 30 / insane 40 / expert 50.
- **Does NOT touch the points/XP/league economy** (documented). It only powers `getChallengeStrength → {percentile, rank, xp}`:
  - `rank` = 1 + COUNT(strengthScore higher), tie-break updated_at ASC
  - `percentile` = round(beaten / poolSize × 100); pool = rows with strengthScore > 0; null if user has no passes
  - **`xp` here = the REAL ledger XP:** `SUM(xp_histories.amount) WHERE source='challenge'` — independent of strengthScore.
- **Displayed:** Profile › Challenges tab — "XP đã nhận" (= `strength.xp`), "Top đầu" (percentile), "Hạng" (rank).

`File`: `backend/.../projections/user-solved-challenges/user-solved-challenges-projection.service.ts`

### 5b. Weekly league (Duolingo-style) — sums Points #1
`league.service.ts`. Ranks by `SUM(xp_histories.points)` (NOT amount) in a fixed Sun→Sun `Asia/Ho_Chi_Minh` window, within fixed cohorts (size 30). Weekly cron `runWeeklyReset` promotes/demotes tiers (Bronze..Legend), idempotent per weekStart. Row label "{count} điểm / pts" via `weekPoints`.

### 5c. Global leaderboard — orders `users.points` #1
`getGlobalLeaderboard`: `ORDER BY points DESC, id ASC` (the materialized `users.points`, NOT totalXp, NOT a live sum). Rank = COUNT(points strictly greater) + 1. Row label "{count} điểm / pts" via `points`.

**Three distinct ranking axes:** per-course Leaderboard → projection `totalXp`; weekly league → windowed `SUM(xp_histories.points)`; global board → `users.points`.

---

## 6. CONTRADICTIONS — RESOLVED

### C1. FLAT_POINTS vs raw score (the "challenge points contradiction") → **GIT PATH IS A BUG**
Both challenge paths pass `amount: grade.evaluation.score` (XP side — correct, consistent). They DIFFER on the `points` argument:
- Google Docs `process-submission-complete-step.service.ts:231`: `points: FLAT_POINTS.challengePassed` (flat **20**) — CORRECT, matches design + milestone + lesson paths.
- Git `process-git-submission-complete-step.service.ts:235`: `points: grade.evaluation.score` (raw score, typically 0–100) — **BUG.** It also does not import `FLAT_POINTS`.

`FLAT_POINTS.challengePassed` JSDoc literally says *"flat, NOT the raw challenge score."* So FLAT_POINTS is correct; the git caller is a missed migration. Effect: git/code-submission challenge passes **over-credit** `users.points` (and thus league + global board + "Điểm code") proportional to score.

**Fix:** in `process-git-submission-complete-step.service.ts` set `points: FLAT_POINTS.challengePassed` and add `FLAT_POINTS` to the import (currently imports only `writeXpHistory`, lines 62-64). Consider a backfill audit of past git passes that inflated balances/league standings.

### C2. `points` vs `coding_points` → **NO SEPARATE COLUMN; comment is stale**
`coding-progress.service.ts` comments say `users.coding_points` but the SQL reads `users.points`. There is no `coding_points` column on `UserEntity`. Coding "points" = global `users.points`. **Fix:** correct the comments (lines 102, 126); do NOT add a column unless a real coding-only score is desired.

### C3. `amount` vs `points` on the ledger → **BY DESIGN, NOT a conflict**
`xp_histories.amount` = per-course **weighted XP** (leaderboards). `xp_histories.points` = **flat global Points** (balance + league). Two columns precisely so the formulas can diverge. The only real divergence problem is C1.

---

## 7. RECOMMENDED UI NAMING (one term per currency, stop overloading "điểm")

Pick ONE Vietnamese word per concept. Rule: **XP = learning progress (weighted, in-course). Điểm = global reward currency (flat, spendable).**

| Currency | Vietnamese | English | Where on profile |
|----------|-----------|---------|------------------|
| #2 Per-course XP | **XP** | XP | Leaderboard (already correct — keep) |
| #4 strengthScore.xp (challenge ledger XP) | **XP** | XP | Challenges tab aggregate — keep "XP đã nhận" |
| #1 Global Points / #3 coding | **Điểm** | Points | rename "Điểm code" → **"Điểm"** (it is the global balance, not coding-only) |
| league weekPoints / global points | **Điểm** | Points | already "điểm/pts" — keep (same currency as above ✓) |
| #5 attempt score | **điểm bài** or just the number | score | per-submission; do NOT call it "XP" |

**Which tab shows what:**
- **Challenges tab** → show **XP** (`strength.xp` from the ledger) + percentile + rank. This is learning/skill progress. Per-row submission score should read "điểm bài" / "score", NOT "XP" or bare "điểm", to avoid clashing with the XP aggregate.
- **Coding tab** → currently shows `totalPoints` which is the **global Điểm balance**, not a coding-only number. Two valid fixes:
  - (Preferred) relabel "Điểm code" → **"Điểm"** and treat it as the account balance (honest about what the column is); OR
  - (Bigger change) introduce a real coding-only aggregate (`SUM` of coding awards) if a coding-specific score is genuinely wanted — requires backend work.

Net: a learner should see exactly two words — **XP** (progress) and **Điểm** (reward balance) — and never see the same number called both.

---

## 8. OPEN QUESTIONS

1. **Git over-credit backfill (C1):** are existing league standings / `users.points` already inflated by past git-submission passes crediting raw score instead of flat 20? Needs a data audit + possible correction.
2. **Was git `points: score` intentional?** The file imports only `writeXpHistory`, suggesting it predates `FLAT_POINTS` and was never migrated. Confirm before fixing (treat as bug per design docs).
3. **Coding tab intent:** should "Điểm code" stay a coding-labelled metric (then it needs a real coding-only aggregate column) or be renamed to the honest global "Điểm"? Product decision.
4. **`users.points` maintenance path:** global board reads the materialized `users.points`; the only writer found is `writeXpHistory.increment` + the coding increment. Confirm nothing else mutates it (e.g. spend on streak freeze decrements, refunds).
5. **`buildActiveUsersSql` predicate** in league.service includes `OR ul.user_id IS NOT NULL`, which may make the weekly-points EXISTS clause always-true (re-bucket everyone). Confirm intentional.
6. **Per-course leaderboard XP** is "internal to each course" but the strengthScore `xp` field sums challenge ledger globally — confirm these two challenge-XP numbers (per-course `totalScore` vs global `SUM(amount)`) are not confused in any UI.

---

### Appendix — canonical file map
- Balance column: `backend/src/modules/databases/postgresql/primary/entities/user.entity.ts`
- Ledger entity/enum: `backend/.../entities/xp-history.entity.ts`, `.../enums/xp-source.ts`
- Constants: `backend/src/features/api/processors/ai/shared/xp/points-config.ts`
- Ledger writer: `backend/.../ai/shared/xp/write-xp-history.ts`
- Callers: `mark-as-readed.handler.ts`, `review-milestone-task-complete-step.service.ts`, `process-submission-complete-step.service.ts`, `process-git-submission-complete-step.service.ts` (⚠ C1)
- Coding: `backend/src/modules/bussiness/coding/coding-progress.service.ts` (⚠ C2), `.../judge-coding-submission/steps/judge-coding-submission-judge-step.service.ts`
- Per-course XP: `backend/.../projections/progress/progress-projection.service.ts`
- strengthScore + league: `backend/.../projections/user-solved-challenges/user-solved-challenges-projection.service.ts`, `backend/.../bussiness/league/league.service.ts`
- FE: `ProfileChallengesTab/ProfileChallenges`, `ProfileSkillsTab/ProfileCoding`, `ProfileHero`, `learn/Leaderboard/*`, `reuseable/LeagueRow`, `league/League/GlobalBoard`, `src/messages/{vi,en}.json`

---

## DECISION — model mới (thầy chốt 2026-06-17)

Tách XP **theo từng nguồn**, tổng cộng chung, render qua projection.

### Mô hình (CHỐT CUỐI — `users` lưu ĐÚNG 2 cột)
- **`users.total_points`** = **tổng XP cộng chung** (mọi nguồn) — "tổng tiến độ".
- **`users.reward_points`** = **tổng điểm thưởng** (flat per-event: lesson 5 / challenge 20 / milestone 30 …)
  = currency tiêu được (league / global board / mua streak-freeze / đổi thưởng).
- **XP THEO NGUỒN** (challenge/milestone/coding/lesson) **KHÔNG lưu cột riêng** → **DẪN XUẤT từ `xp_histories`
  group by source** (SUM `amount`) qua **projection**. Render đọc projection.
- (`users.points` cũ → đổi tên/nghĩa thành `total_points`; thêm `reward_points`.)

### BE plan
1. **Migration `users`**: `points` → **`total_points`** (= tổng XP) + thêm **`reward_points`** (int default 0).
   CHỈ 2 cột. **Backfill**: `total_points = SUM(xp_histories.amount)` (+ coding, xem #3);
   `reward_points = SUM(xp_histories.points)`. KHÔNG thêm cột per-source (per-source = projection).
2. **Award wiring** (`writeXpHistory` + callers): mỗi event cộng `amount` vào ĐÚNG ô `<source>_xp` + cộng `points`
   (tổng XP) + cộng `reward_points` (flat). **Sửa bug**: challenge `reward_points += FLAT_POINTS.challengePassed(20)`
   (không phải score); `<source>_xp += amount(=score)`.
3. **Coding vào ledger**: thêm `coding` vào enum `xp_source`; coding solve (`awardPointsIfEligible`) ghi `xp_histories`
   (source='coding', amount=`problem.points`) + cộng `coding_xp` + `reward_points`. (Hiện coding KHÔNG ghi ledger.)
4. **Projection** `user_xp_projection.value` = `{ challengeXp, milestoneXp, codingXp, lessonXp, totalXp(=points),
   rewardPoints }` + query `userXp(userId)` (CQRS recipe, CDC trên xp_histories/users). Render từ đây.

### FE plan (render projection)
- Hook `useQueryUserXpSwr`. Challenges metric "XP" = `challengeXp`. Coding metric đổi **"Điểm code" → "XP"** =
  `codingXp` (KHÔNG phải `points` toàn cục như hiện tại — đang sai). Có thể thêm card tổng `points` (Điểm/XP tổng)
  ở Overview. "Top đầu" coding = percentile theo `codingXp`.
- Tên UI: **XP** per-nguồn + **Điểm** = `reward_points` (currency thưởng). 1 nguồn sự thật = projection.

### ⚠️ Rủi ro / gating
- Migration + **backfill** chạm dữ liệu LIVE (league/leaderboard theo points/reward_points). Cần backfill đúng để
  không lệch hạng lịch sử.
- Đổi semantics `points` (giờ = tổng XP) vs cũ (= reward balance). Phải rà mọi nơi đọc `users.points`
  (global-leaderboard, league, streak-freeze mua bằng points…) → có thể chúng phải đọc `reward_points` thay vì `points`.

→ Đây là refactor kinh tế điểm lớn (migration + enum + award + projection + FE + rà reader). Đề xuất chạy **1 workflow** thực thi.
