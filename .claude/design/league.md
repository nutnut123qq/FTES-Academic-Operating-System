# League — backend business (cache 2026-06-21)

A **GLOBAL, Duolingo-style weekly competition**. FE built: `/[locale]/league` (Weekly + Global tabs) +
dashboard `LeagueCard`. **TWO boards sharing one currency but ranking on DIFFERENT sources** — the key nuance.

## Points ≠ XP (critical)
One `xp_histories` row carries BOTH: `amount` (weighted **XP**, drives per-course leaderboards via
`total_points`) and `points` (flat **Points**, same value everywhere, drives the league + dashboard "this week").
`writeXpHistory` credits `users.total_points += amount` and `users.reward_points += points` (idempotent on
`(source, refId)`). **Flat points per event:** lessonRead **5** · challengePassed **20** · coding **20** ·
milestonePassed **30** · dailyQuest **20**.

## The two league boards
- **Weekly cohort (`myLeague`)** — ranks on **SUM(`xp_histories.points`) within the cohort's week window**
  (Sun 00:00 → Sun 00:00, **Asia/Ho_Chi_Minh**). Cohorts of **30** users, **7 tiers** bronze→silver→gold→
  platinum→diamond→champion→legend. New users lazily placed in Bronze (board never empty).
  Entry: `username`, `avatar`, `weekPoints`, `rank`, **`rankDelta`** (lastWeekRank − rank → movement caret).
- **Global (`globalLeaderboard`)** — ranks on lifetime **`users.reward_points`** (the **spendable** balance!),
  top **50** + `myRank` + `myPoints`. ⚠️ spending points (streak-freeze…) LOWERS your global rank.

## Weekly reset / competitive loop
Cron `0 0 * * 0` (Sun 00:00 ICT, `league-reset.service`): settle ending cohorts → **top 10 promote**, **bottom
5 demote** a tier (clamped at Bronze/Legend); snapshot finishing rank to `last_week_rank`; re-form cohorts
(deterministic shuffle `md5(user_id||weekStart)`, chunks of 30). Idempotent + self-healing.

## Source/freshness + FE
- Weekly = CQRS projection `league_cohort_points_projections` (pre-ranked per cohort), CDC on `xp_histories` +
  TTL lazy; `last_week_rank` merged live. Global = reads `users.reward_points` directly (instantly fresh).
- FE: `/league` (`layouts/league/League` — Weekly `WeeklyBoard` + Global `GlobalBoard`), `dashboard/LeagueCard`,
  shared `LeagueRow`/`LeagueTierBadge`/`RankDeltaCaret`; `useQueryMyLeagueSwr`/`useQueryGlobalLeaderboardSwr`.

## UX gotchas (flag in any league brainstorm)
1. Weekly vs Global measure **different things** (this-week points vs all-time balance) but read as sibling
   "Weekly/Global" tabs with the same "points" word → users assume "same metric, different window." NOT true.
2. Global ranks on a **spendable** balance → spending lowers rank (surprising).
3. `isMe` matched by **username string** (entries carry opaque global ids) → best-effort, breaks if username null.

## Decisions (newest first)
_(empty)_
