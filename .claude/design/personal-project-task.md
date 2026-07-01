# design — personal-project task page (`/learn/personal-project/tasks/[taskId]`)

Route renders nothing in `page.tsx`; the **layout** (`personal-project/layout.tsx`) mounts the real content.
Right rail = `MilestoneOutline` (milestone→task nav) via `LearnShell`, redux-collapsible
(`sidebar.rightCollapsed`).

## Chosen direction — B · Split workspace (BUILT 2026-06-20)
Brief LEFT (scroll), **submission panel RIGHT, PINNED/sticky** (lang switch + repo URL + branch + Evaluate CTA
+ live AIProcessing + latest score). Read-on-left / act-on-right, coding-challenge archetype.
- 2026-06-20: teacher wants the panel **kept sticky** (pinned in view while scrolling the long brief). Plain
  `xl:sticky xl:top-16` looked buggy → made it ROBUST: `xl:sticky xl:top-16 xl:self-start` (don't stretch in
  the flex row) + `xl:max-h-[calc(100dvh-5rem)] xl:overflow-y-auto` (tall panel scrolls internally so it
  always stays fully visible while pinned). `xl:w-[360px]`. NOTE: sticky breaks if any ANCESTOR has
  `overflow-x-hidden` (→ computes `overflow-y:auto`, new scroll container) — none in the learn shell today;
  check there first if pinning ever fails again.
- Page header = the **actual task title (`Typography h3`) + description** (gap-0 pair), NOT the generic
  "Dự án cá nhân" H2 (that H2 was deleted from `PersonalProjectSubmission`). Meta chips (type · maxScore ·
  status) were **omitted** — `task`/`milestones` GraphQL selections don't fetch `type`/`maxScore`, so chips
  would be fabricated. → small GraphQL delta to add them later (see Backend business).
- Submission panel is **project-level, persistent** (see Backend business) — does NOT reset when you switch
  milestone tasks; only brief/criteria/result swap per task. This is *why* B works: the right panel is a
  stable home for the per-project repo; the left is the per-task reading surface.

### Column-budget constraint (the load-bearing layout decision)
The content column already lives between the learn icon rail (left) and the collapsible milestone rail
(right, `lg:w-80`). Adding an inner split risks a 4-column squeeze. So the split opens only at **`xl`**
(`xl:flex-row`, panel `xl:w-[360px] xl:sticky xl:top-16`); below `xl` it **stacks** (brief first, panel
below) → clean single reading column. Do NOT lower this to `lg` without also collapsing the milestone rail.

### What shipped — files + section→component map
- `personal-project/layout.tsx` → breadcrumb + `<PersonalProjectWorkspace/>` (was stacked
  `PersonalProjectSubmission` + `Task`).
- `PersonalProject/PersonalProjectWorkspace` (NEW) — the `xl` split shell.
- `PersonalProject/index.tsx` (`Task`) — now the **left brief column** only: H3 title + desc → LockedAlert →
  TaskBrief → (legacy criteria/codeImpl for non-V2). Results/Actions moved out.
- `PersonalProject/TaskSubmissionPanel` (NEW) — the **right sticky panel**. 2026-06-20 (`/starci-fe-layout-
  apply`): now a **`LabeledCard`** — "Github dự án" label sits OUTSIDE/above the card (per teacher), card body
  = `PersonalProjectSubmission` + `TaskActions` (`contentClassName="flex flex-col gap-6"`); `TaskResults` is a
  sibling section below (`gap-6`). Was a `Card` with an in-card `Label`. Does NOT gate on the task.
- **Rail moved LEFT** (2026-06-20): the milestone rail is now the left rail (like the content-map), not a
  right rail — see [[milestone-rail]]. The submission panel stays on the right of the content via the B-split.
- `PersonalProjectSubmission` — dropped the dominating H2/description + `p-3`; fields only now.
- Spacing cleanup (house scale): removed ad-hoc `mt-3`/`h-3`/`h-6`/`mt-6` leading/trailing spacers from
  TaskBrief, TaskLockedAlert, TaskCriteriaList, TaskCodeImplementations, TaskActions, TaskResults.
- Section→data: brief ← `task.briefs[lang]` (locale-resolved); locked ← `milestoneTaskProgress`; submission
  ← `enrollment` (sync mutations); evaluate ← `reviewPersonalProjectTask` job + socket; result ←
  `userPersonalTaskAttempts[0]`.

## Backend business (traced 2026-06-20 — source of truth = `starci-academy-backend`)
**Scope / persistence of the submission (the crux of direction B):**
- `enrollment.personal_project_github_url` + `enrollment.personal_project_github_branch` are **enrollment-
  level** (comment: *"at enrollment level"*) → **per user × course, persist across EVERY milestone/task.**
- Grading **language (`lang`)** is **NOT persisted** — only passed in the `reviewPersonalProjectTask`
  request; today it lives solely in the FE `usePersonalProjectGithubForm` zustand store, resets on reload.
  → **Proposed minor BE delta** ("kiểu bài chấm persist qua từng milestone"): add `enrollment.
  personal_project_lang` + upsert it in `sync-personal-project-github.handler.ts` (mirror url/branch in
  `UpsertPersonalProjectGithubParams`). Built FE works without it (session-persistent); column makes it
  cross-session.
- **Header meta delta:** `task`/`milestones` GraphQL don't select `type`/`maxScore` → add those fields to
  enable the type + max-score header chips.

**Task content / unlock / scoring:**
- `task(request)` → `MilestoneTaskEntity`: `briefs[]` (SCHEMA V2 per-lang Markdown, body locale-resolved by
  BE), legacy `criterias[]` + `codeImplementations[]` (shown only when `briefs` empty), `maxScore`, `type`.
- `milestoneTaskProgress` → `currentTask` + `completionTasks[]`; FE lock via
  `isPersonalProjectTaskActionUnlocked(taskId, lookup, currentTaskId)`. Locked preview → `TaskLockedAlert`.
- `userPersonalTaskAttempts` → attempts (latest `[0]`) with `score` (max 20) + `shortFeedback`. Evaluate =
  `reviewPersonalProjectTask` → async **job** (`milestoneTaskIdToJobId` → `socketIo.jobStatusByJobId`),
  surfaced via `AIProcessingText` (`JobCategory.ReviewTask`).

Path traced: `*.resolver.ts → *.handler.ts/*.service.ts → enrollment.entity.ts / milestone-task.entity.ts`.
