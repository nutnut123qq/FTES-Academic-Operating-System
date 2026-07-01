# Leaderboard — page UX decisions + backend business

Course leaderboard at `/[locale]/courses/[courseId]/learn/leaderboard`. Feature:
`components/features/learn/Leaderboard/` (Podium + Table + MyRankCard + XpBreakdown).

## Backend business (cached 2026-06-21 — read this first; only re-trace BE if stale)
**Scope:** PER-ENROLLMENT — one row per (user × course); **`totalXp` is the XP earned WITHIN this course**
(course-scoped — confirmed by thầy 2026-06-21). **Rank metric:**
`totalXp = totalScore + lessonsRead × 3 + milestoneProgress × 10`.
- **Only COURSE things count (thầy 2026-06-21):** the 3 sources are **challenges + contents (lessons) +
  final-project (milestone tasks)** of THIS course — nothing else. **Coding practice is NOT counted here** —
  it's a SEPARATE **global** leaderboard (`query-coding-leaderboard`). Never pull global/coding XP into the
  course board.
- `totalScore` = the challenge **SCORE** (not a count): `SUM over challenges of ( SUM over submissions of MAX(attempt score) )`.
- `completedChallenges` = count of challenges where `challenge_score ≥ challenge.score` (the pass threshold, > 0).
- `lessonsRead` = `COUNT(user_contents WHERE is_read = true)` in the course.
- `milestoneProgress` = `COUNT(DISTINCT user_milestone_tasks with a passed attempt)`.
- **Source:** CQRS projection `user_course_progress_projections.value` (jsonb), recompute scoped-1-user (hot) /
  whole-course (backfill) + CDC; cached snapshot (`computedAt`). Functional index on `(course_id, (value->>'totalXp')::int)`.
- Board lists **only `totalXp > 0`**, ordered `totalXp DESC, enrollment.created_at ASC` (earliest enrollment wins ties).
  `myRank` is always returned (even outside the top-N window). Also exposes `totalChallenges` + `maxPossibleScore`
  (course context — FE not using yet).
- **Path:** `challenges/leaderboard/LeaderboardHandler` → `ProgressProjectionService.getLeaderboard / getMyRank`
  → `buildUpsertSql`.
- **Sibling leaderboards (thầy 2026-06-21):** this page is the per-COURSE board. There are ALSO **per-field
  (lĩnh vực) leaderboards** — e.g. coding (`query-coding-leaderboard`) — and a **global** one
  (`query-global-leaderboard` / weekly league). Each has its OWN scope + metric; **don't assume this course
  XP formula carries over** — trace each separately when designing those pages.
- **UI implication:** early on, very few rows (only > 0-XP enrollments appear) → the **sparse/empty state matters**.

## Decisions (newest first)

### 2026-06-21 — leaderboard layout (direction A)
- **Scenario:** the board stretched **full-width** (no `max-w` cap — total XP flew to the far right) and the
  3-pedestal podium **broke when < 3 learners** (the common early state, since only > 0-XP enrollments list).
- **Chose (A):** cap the column **`mx-auto w-full max-w-2xl`**; render the **podium only when `entries.length ≥ 3`**,
  otherwise skip it and the table shows **ALL** entries; the viewer's row is already accent-tinted (`bg-accent/10`
  + avatar `ring-2 ring-accent` + "You" chip) in `LeaderboardTable`.
- **WHY:** thầy chốt A — sạch, đọc đẹp ở cột hẹp ~672px, không vỡ khi ít người.
- **Files:** `features/learn/Leaderboard/index.tsx` (max-w cap + podium gate).
- **Available, not built (future enrichment):** an XP-earn hint ("challenge · đọc bài ×3 · milestone ×10") in
  `MyRankCard`; a course-progress chip from `totalChallenges` / `maxPossibleScore`; a stronger sparse-state CTA.

## Gotchas
- A leaderboard page MUST cap its column (`max-w-2xl mx-auto`) — it's a reading-list, not a full-bleed dashboard.
- A fixed N-pedestal podium needs N occupants — gate it on `entries.length ≥ 3`, never render empty pedestals.
