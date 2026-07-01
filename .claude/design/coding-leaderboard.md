# Coding leaderboard — backend business (cache 2026-06-21)

A **GLOBAL** board (separate from the per-course one). FE list is **greenfield — not built yet** (only the
viewer's own rank is shown on Practice + Profile). Good target to design.

## Backend business
- **Scope:** GLOBAL, all users, **all-time**, all languages/problem-sets pooled. One row per user
  (`user_coding_projections`, PK `user_id`). No per-language board, no time window, no reset.
  (`byLanguage`/`byDifficulty`/`byDomain` exist in the jsonb but feed Profile/Practice skills, NOT the rank.)
- **Metric:** `solvedCount` = `COUNT(DISTINCT coding_problem_id WHERE verdict='accepted')`. **NOT points, not
  attempts, not difficulty-weighted.** Order `solvedCount DESC, updated_at ASC` (first to reach the count wins ties).
  - ⚠️ Practice cockpit ALSO shows `totalPoints` (10/15/20 by difficulty, first clean solve) — but the BOARD
    ranks on **solvedCount**, not points → "rank on board ≠ points earned." Don't conflate.
- **Entry fields:** `userId`, `username`, `solvedCount` only (no avatar, no rank field — rank = array order).
- **My rank:** SEPARATE query `userCodingRank(userId)` → `rank` (1-based) + `percentile`. **NULL when 0 solves**
  (unranked); withheld for locked/private profiles. The board list does NOT include a "your row".
- **Source/freshness:** projection `user_coding_projections`; CDC on `coding_submissions` rebuilds the
  submitter's row. ⚠️ TTL lazy-refresh is wired into `getSkills/getHistory` but **NOT `getLeaderboard`/`getRank`**
  → board freshness relies on CDC; can lag.
- **Path:** `coding/coding-leaderboard` resolver + `users/user-coding-rank` → `UserCodingProjectionService`
  (`getLeaderboard`/`getRank`) → `user_coding_projections`.
- **FE today:** rank/percentile on `features/practice/ProgressCockpit` (`useQueryUserCodingRankSwr`) +
  `profile/.../ProfileCoding`. The ranked LIST (`query-coding-leaderboard`) has no hook/component yet.

## Decisions (newest first)

### 2026-06-21 — built the board as a tab on /practice (direction A)
- **Scenario:** the coding-leaderboard list was greenfield (query existed, no component). Needed a home that
  reuses the existing `ProgressCockpit` (the viewer's own standing) without cluttering the problem catalog.
- **Chose (A):** keep `ProgressCockpit` ABOVE everything (shown for both tabs), add a **HeroUI secondary `Tabs`
  switcher [Bài tập | Bảng xếp hạng]** under it — Problems (default = `PracticeFilters` + `ProblemCatalog`,
  unchanged) vs the new `CodingLeaderboard`. **No separate route** (thầy chốt). Only the active tab mounts so the
  idle query stays idle (same pattern as `/league`).
- **`CodingLeaderboard`:** single capped column **`mx-auto w-full max-w-2xl`** (the course-board lesson), rows
  `rank · avatar · name · "Đã giải N bài"`, viewer row **`bg-accent/10` + ring + "Bạn" chip**, `AsyncContent`
  (skeleton mirror / empty CTA / error retry). **No podium** — coding is a pure ranked list. Metric label is
  **solvedCount only** (`practice.leaderboard.solved`), never points — avoids the "rank ≠ points" gotcha.
- **WHY:** thầy chốt A. Reuses cockpit + course-board pattern → consistent; tab keeps catalog as the default
  primary, nothing the teacher liked is lost.
- **Files:** `features/practice/CodingLeaderboard/index.tsx` (new), `features/practice/index.tsx` (tabs),
  `messages/{en,vi}.json` (`practice.tabs.*` + `practice.leaderboard.*`).
- **⚙️ BE delta available, NOT built:** entry is `{userId, username, solvedCount}` — **no `avatar`/`rank`**.
  Built with avatar=initials fallback + rank=array index. For real avatars + server rank, add `avatar` + `rank`
  to `CodingLeaderboardEntry` (resolver `coding-leaderboard`; projection already has the data). Ask thầy first.
