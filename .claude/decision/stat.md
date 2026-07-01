# Decision — stat

When & WHY we choose/shape the **stat** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a stat, we reuse the house's logic instead of guessing.
Metrics, progress, charts, roadmaps.

**StarCi blocks in this family:** `MetricCard`, `ProgressMeter`, `StatPair`, `SegmentBar`, `LanguageDonut`, `MilestoneRoadmap`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Design baseline (from rules + design — 2026-06-21)

- **Metric row (KPI):** row of `MetricCard` in `grid grid-cols-2 gap-3 sm:grid-cols-4` (large value + muted label). Not a big hero `StatPair` for multi-cell KPIs. **MetricCard sits TOP-LEVEL, NOT inside `LabeledCard`** (no card-in-card); breakdown cards go below. Optional cells (rank/percentile/xp) auto-hide when null (push to the stats array only when `!= null`). Use `MetricCard.hint` to spell out ambiguous short labels. `StatPair` has `size` (`md`=h4 default, `lg`=h2) for hero numbers elsewhere. Merge count + breakdown of the SAME dataset into one card ("N items, split by X").
- **`SegmentBar` / `Legend`:** `SegmentBar` = multi-slice ratio bar + legend (dot + label + count). Slice color = **data-driven `color = var(--…)` token, NOT hex**. Skeleton = `Skeleton.SegmentBar legendItems={n}` (incl. legend). Progress vs total → set `max={total}`, remainder = `bg-default` track, summary `{done}/{total}`. Many bars sharing one scale in a card → ONE shared `Legend` at the bottom (`hideLegend` per bar); a lone bar renders its own. `Legend` block (`blocks/stats/Legend`): `items: Array<{key,label,color}>`.
- **Categorical breakdown → `SegmentBar`, AVOID pie/donut (STRICT):** part-to-whole (language, difficulty, status) → `SegmentBar` (horizontal 100% + `label · count` legend) or ranked bar-per-row. Reason: eyes compare length/position > angle/area (Cleveland–McGill); CSS bar is light + token-driven + dark-mode correct, no chart lib. By number of categories: few FIXED buckets (difficulty 4, a few langs) → `SegmentBar`; OPEN/large set (topic/tag/skill, 10–20+) → chip/tag-cloud with count (LeetCode/GitHub style), NOT a stacked bar (slivers like confetti). Metadata chips = neutral/`--default`, NOT accent; print the count clearly (don't rely on color, a11y). Donut only when very few categories AND a single center total is the main point (rare); `LanguageDonut` block kept for legacy (thickness = px via `thickness`, default 8 = h-2; `size` ~128) but not the default.
- **Difficulty color scale (4 data-driven tones):** easy → `var(--success)` · medium → `var(--warning)` · hard → `var(--danger)` · insane/expert → `var(--difficulty-insane)` (purple token, light+dark). Used for difficulty SegmentBar/bar via `color`. `DifficultyChip` maps insane→`accent` (enum can't take an arbitrary token) so chip ≠ bar purple — accepted divergence. Score color bands: `≥90 → text-success` · `≥70 → text-warning` · `<70 → text-danger`.
- **Language (GitHub style):** chip = `LanguageChip` (brand dot + name, no box). Single source of color/name = `src/modules/utils/language.ts` (`getLanguageColor`/`getLanguageLabel`; GitHub-linguist colors; `csharp→C#`, `cpp→C++`, `php→PHP`). Brand colors = valid "no hex" exception, kept in `language.ts` not globals. "By language" breakdown = `SegmentBar`, not donut.
- **Snapshot/teaser stays in sync with the full tab:** SAME metric → SAME chart + SAME legend (label + color) everywhere; snapshot inherits the full tab's viz (just leaner), never picks its own chart/label/color. When editing a metric viz, grep EVERY render site (snapshot + tab + overview) and sync.
- **Community comparison:** percentile ("hơn X% học viên") + rank #N (`userCodingRank`/`userChallengeStrength`) as metric cells. BE = derived metric (path A): add to projection, return `{percentile, rank, xp}`, don't touch points/XP/league. **XP ≠ sum of raw `score`** — real XP = ledger `xp_histories.amount` from BE, never summed on FE.
- **Badge/achievement:** meta = ONE line `{rank} · {secondary}` (`·`-separated). Earned → `{rank}` in data-driven ring color (`getRank().ring`) · `{rarityPercent}%` muted; locked → `currentValue/threshold` muted. Same for tooltip. Wall density: mascot ~48 (not 64), grid `gap-4`, cell ~`minmax(72px,1fr)`.
- **Consistency (STRICT):** 3 dot+label spots (difficulty legend, donut legend, `LanguageChip`) must share size: dot `size-3` + label `body-xs` muted. One highlighted color per cluster, rest muted. Skeleton mirrors the real layout.

## Decisions (newest first)

### 2026-06-21 — Course "/learn" → content & challenge dashboard (Direction A)
- **Scenario:** the `/learn` landing rendered headline numbers (95 lessons, **329 challenges**) as tiny muted
  text + buried challenge difficulty in accordion rows — "tục". Scope (thầy): **content & challenge only**.
- **Chose:** a **2-column dashboard** (act left / see right, `gap-8`). RIGHT col = `grid grid-cols-2 gap-3` of
  **top-level `MetricCard`** (content n/m · challenge n/m, NOT inside `LabeledCard`) + a `LabeledCard`
  `ProgressMeter` (overall completion, showValue) + a `LabeledCard` **`SegmentBar` of challenge counts by
  difficulty** (success→warning→danger→`--difficulty-insane`, honest counts, **no `max`** = breadth not
  progress, since 0 done would make a progress bar look empty/sad). LEFT = continue hero + search + the
  module→lesson→challenge accordion (preserved).
- **WHY:** `MetricCard` makes the KPIs read as KPIs; the difficulty `SegmentBar` surfaces the 329-challenge
  breadth as a marketing/value signal at a glance. Pure-mix bar celebrates depth, not (empty) progress.
- **Files:** `CourseContents/index.tsx` + its skeleton; i18n `courseContents.{lessonsLabel,challengesLabel,
  lessonsHint,challengesHint,continueEyebrow,challengesByDifficulty,difficulty.*}` (vi+en). No new BE. Dropped
  the capstone milestones section (out of scope). · course learn landing · 2026-06-21

### 2026-06-21 — Personal-project DASHBOARD (no-`taskId` landing) · Direction A "Project HQ"
- **Scenario:** `/personal-project` index rendered `<></>` (empty centre column until you click a task) — "tục".
  Thầy: render a **dashboard** khi URL chưa có `tasks/[id]`. Chose Direction A (overview-first) from the brainstorm.
- **Switch mechanism:** the personal-project LAYOUT always mounts `PersonalProjectWorkspace`, so the dashboard/task
  switch lives THERE: `const taskId = typeof useParams().taskId === "string" ? … : undefined` → no taskId →
  `<PersonalProjectDashboard/>`, else the read-left/act-right split. (Both route `page.tsx` stay empty — layout drives.)
- **Composition (grounded in real BE fields):** 3-tier (H3 `finalProject.dashboard.title` + desc) → **3-up KPI row** +
  **4-stat ribbon**.
  - **Mixed-content KPI cards = `LabeledCard`, NOT `MetricCard`.** Progress (big % + `ProgressMeter` bar + n/m),
    next-task (title + the ONE primary `Button` "Tiếp tục" → routes to `currentTask`), github (status chip + repo·branch).
    `MetricCard` is value+label+hint only — can't hold a button/bar/chip → `LabeledCard` (label-above-card, flexible body)
    is right here. The KPI-row-of-`MetricCard` baseline applies to PURE metric cells; these aren't pure.
  - **Stat ribbon = `StatPair` ×4** (frameless, `gap-6 border-t pt-3`): passed · locked · attempts · avg score — exactly
    `StatPair`'s "sit inside a stat strip" role.
  - **Did NOT repeat the milestone list** — the left rail (`MilestoneOutline`) owns navigation; the dashboard complements
    it (overview), avoiding two nav surfaces (why Direction B was rejected).
- **Data sourcing gotchas:**
  - `buildMilestoneTaskProgressLookup` narrows to `{ completed }` only → done/attempts/avg-score must come from the RAW
    `milestoneTaskProgress.completionTasks` items (`lastScore`/`maxScore`/`numAttempts` live there). total+locked from the
    full milestone tree (`isPersonalProjectTaskActionUnlocked`).
  - **GitHub connection = read `state.user.enrollment.personalProjectGithubUrl/Branch` from redux, NOT the github zustand
    store** — that store is only *seeded* inside the task panel (`usePersonalProjectGithubForm`), which isn't mounted on the
    dashboard → store would read empty. Enrollment is the source of truth. (Dropped `lang` from the card: it's a per-grading
    choice, not a connection attribute.)
  - Connection/"all done" chips follow [[chip]]: `variant="secondary" color="success" + bg-success/10 text-success`.
- **Audit fix bundled:** the dashboard renders the missing **H3 header** + a clean 3-tier (`max-w-3xl mx-auto p-6`,
  `h-3` spacer, `gap-0` title/desc pair). The layout-level breadcrumb misalignment (breadcrumb in its own `p-6` vs centred
  content) is shared with the task view → left as a follow-up (refactoring the shared layout would touch the task split).
- **States:** `AsyncContent` (skeleton mirrors 3 cards + 4 stats; `isEmpty` → no-milestones EmptyContent).
- **New block:** none new survived — first wrote a `StatTile` then DELETED it on finding `StatPair` already is exactly that.
- **Files:** NEW `PersonalProject/PersonalProjectDashboard/{index,PersonalProjectDashboardSkeleton}`; wired
  `PersonalProjectWorkspace`; i18n `finalProject.dashboard.*` (vi+en). eslint + `tsc --noEmit` clean.

## Gotchas
_(empty)_
