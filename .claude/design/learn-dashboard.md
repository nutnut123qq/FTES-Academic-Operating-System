# design — course "/learn" landing → content & challenge dashboard

## BUILT — Direction A (2026-06-21)
`CourseContents/index.tsx` rebuilt into the 2-column dashboard (tsc/eslint clean, vi+en JSON valid):
- **Tier-2 header** course title (H3) → `grid gap-8 lg:grid-cols-5` (layout-region `gap-8`).
- **LEFT `col-span-3`** (act): continue-learning **hero `Card`** (eyebrow + resolved `currentTask` title +
  primary resume) → search `TextField variant="secondary"` → the module→lesson→challenge `Accordion`
  (preserved verbatim).
- **RIGHT `col-span-2`** (see): `grid grid-cols-2 gap-3` of two `MetricCard` (Nội dung n/m · Challenge n/m,
  top-level not in a card per `stat.md`) → `LabeledCard` Hoàn thành (`ProgressMeter` showValue) →
  `LabeledCard` "Challenge theo độ khó" with a **`SegmentBar`** of challenge counts by difficulty
  (success/warning/danger/`--difficulty-insane` per `stat.md`).
- **Dropped** the capstone milestones section (out of scope — lives on the personal-project page). Skeleton
  rewritten to mirror the 2-col shape.
- New i18n: `courseContents.{lessonsLabel,challengesLabel,lessonsHint,challengesHint,continueEyebrow,
  challengesByDifficulty,difficulty.*}` (vi+en).
- Helpers added in-component: `currentTaskTitle` (walk tree by id), `difficultySegments` (bucket all
  challenges by `toDifficulty`). No new BE.

---


Route `app/[locale]/courses/[courseId]/learn/page.tsx` → `CourseContents` feature. Segment is null on the
index → **no side rails, full width** (only the LearnSidebar icon rail). Marketing-critical page (first thing
a learner sees in a course). **Scope (teacher 2026-06-21): CONTENT & CHALLENGE only** — NOT the gamification
dashboard (streak/XP/leaderboard/daily-quest/flashcards are explicitly OUT for this page).

## Data — `myCourseOutline` (the ONE query; full shape, no new BE needed)
- `progress`: `lessonsRead/Total`, `challengesCompleted/Total`, `tasksCompleted/Total`, `completionPercent`.
- `currentTask`: `{ kind: lesson|challenge|milestoneTask, id, milestoneId }` → the resume target.
- `modules[]` → `lessons[]` (`isRead`, `difficulty`, `minutesRead`, `isPremium`) → `challenges[]`
  (`difficulty`, `status` notStarted|inProgress|failed|completed, `lastScore`, `maxScore`, `completed`).
- `milestones[]`→`tasks[]` (capstone) — keep light / out of the headline (tasks are the personal-project page).
- **Underused goldmine:** the 329 challenges carry difficulty + status + scores but are buried as nested
  accordion rows. No difficulty breakdown, no scoreboard. → the biggest opportunity.

## Audit of the current page (why it's "tục")
1. Flat docs-index: one averaged progress bar (lessons+challenges+tasks → "1%") + search + long accordion.
2. Headline numbers (Nội dung 2/95 · Challenge 0/329 · Nhiệm vụ 0/100) = tiny muted text, NOT `MetricCard`
   (breaks `decision/stat.md` — KPIs = MetricCard grid).
3. Content vs Challenge progress not distinguished; challenge difficulty/score data invisible.
4. Single column — house rule: a dashboard uses the **2-column shell + `gap-8`** (`design/CONTENT.md`).
5. `currentTask` resume is good (1 primary action) — keep.

## Directions
### A · Two-column learning dashboard (RECOMMENDED — rules-compliant)
- LEFT (~3/5): **Continue-learning** hero (currentTask → resume) → search → module→lesson→challenge browser
  (the existing tree, cleaner).
- RIGHT (~2/5, `gap-8`): stat widgets — **Content** (`ProgressMeter` lessons read n/m) · **Challenge**
  (done/total + a **difficulty `SegmentBar`** easy/med/hard → success/warning/danger per `stat.md`) ·
  best/recent challenge scores.
- Blocks: `MetricCard` grid, `ProgressMeter`, `SegmentBar`+`Legend`, `LabeledCard`, `ContentMapRow`/`ListRow`.
  Ref: Codecademy dashboard (progress + continue + skill-XP sidebar). NO new block needed.

### B · Bento overview, then browse (single column)
- Top: 3–4 `MetricCard` (Hoàn thành · Nội dung · Challenge) + Continue CTA; module browser full-width below.
- Simplest/scannable; weaker at giving challenges their own space.

### C · Tabbed — Tổng quan / Nội dung / Challenge (challenges first-class)
- Tab bar (URL state). **Challenge tab = a filterable scoreboard** (by difficulty / status / best score),
  separate from the lesson tree. Best if the 329 challenges are a headline marketing asset.
- Block: `TabsCard` (existing) + a new challenge-list view. Ref: Coursera/Codecademy tabbed course home.

## Recommendation
**A** as the base (house dashboard shell + the difficulty `SegmentBar` is the key new value), and **graft C's
Challenge scoreboard** as the right-column's "challenge" widget that links to a full challenge view — so
content AND challenge both get real estate, marketing-strong, zero new BE. (B is the lightweight fallback.)

## Section → data
| Widget | Source |
|---|---|
| Continue hero | `currentTask` (+ resolve href like `ContentMap.continueHref`) |
| Content progress | `progress.lessonsRead/Total` |
| Challenge progress + difficulty bar | derive from `modules[].lessons[].challenges[]` (count by difficulty/status) |
| Best/recent scores | `challenges[].lastScore/maxScore` (status=completed/failed) |
| Module browser | `modules[]→lessons[]→challenges[]` |
| Empty/loading/error | `AsyncContent` (skeleton mirrors the 2-col), CTA when nothing started |
