# design — personal-project milestone rail (right rail on `/learn/personal-project/*`)

## Problem (teacher, 2026-06-20, with screenshot)
"Render the content-map **y chang** (identical) to the content page's content-map — a polished rail
(`ContentMap`) already exists, why is the milestone rail a different, more-verbose thing?" The capstone right
rail (`MilestoneOutline` → `MilestoneAccordion` → `MilestoneTaskRow`) diverged from the lesson rail
(`ContentMap` → `ContentMapRow`): no progress header / no continue button, all milestones force-expanded, and
each task dumps a 3-line **description** → the rail reads dense and off-pattern. Unify it.

## Side-by-side (current → target)
| Aspect | `ContentMap` (lesson rail, the standard) | `MilestoneOutline` (current, off-pattern) |
|---|---|---|
| Header | progress label + "n/m" + `ProgressMeter` + "Tiếp tục" primary button | none |
| Scroll | `ScrollShadow` (only list scrolls, header pinned) | none |
| Expand | **controlled** `expandedKeys` — auto-open active group, search opens matches | all force-expanded (`defaultExpandedKeys` = all) |
| Group header | title truncate+tooltip; expanded → `ProgressMeter`, collapsed → "n/m" muted | title truncate + indicator only |
| Row | shared block `ContentMapRow` (status marker + title, accent tint active) | bespoke `MilestoneTaskRow` (icon + title + **3-line description** + divider) |

## Layout finalize — rail on the LEFT (2026-06-20, `/starci-fe-layout-apply`)
Teacher: "move the rail qua trái như learn". The capstone milestone rail now lives on the **LEFT** — the
SAME slot as the lesson content-map — wrapped in `ResizableRail` (drag-resizable, `storageKey
"starci.learn.milestoneMap.width"`), always visible, no right rail. Dropped the old right-side redux-collapse
plumbing (`rightCollapsed`, `milestoneRailClass`, `showRightCollapse`, `LearnPanelToggles` for this route);
`MilestoneOutline`'s `collapsed`/`MilestoneIndexStrip` path is now unused (left in place, harmless). So every
learn tab reads the same: left rail = nav tree, content fills. File: `learn/layout.tsx` (`leftRail`
gains the `isPersonalProject` branch; `rightRail` = modules-only). The personal-project content keeps its
B-split workspace (brief left, submission panel right) inside the now wider content column.

## Chosen direction — 2 · Generalize both rails into one shared `OutlineRail` (BUILT 2026-06-20)
**Shipped.** `blocks/navigation/OutlineRail` (new props-only block) now backs BOTH rails: `ContentMap`
(migrated, byte-identical) and `MilestoneOutline` (now content-map-style: progress header + "Về bài hiện
tại", inline search, controlled expand, `ContentMapRow` task rows, descriptions dropped). Layout
`milestoneRailClass` → flex col + bounded height. Deleted dead `MilestoneAccordion`/`MilestoneTaskRow`/
`MilestoneTaskSearch` + orphaned status helpers. tsc + eslint clean. See `decision/sidebar.md` (2026-06-20)
for the full record. Below = the original plan (kept for reference).

### Original plan

Extract the rail shell from `ContentMap` into ONE reusable presentational block, and render BOTH the lesson
content-map AND the personal-project milestone rail through it. The two rails become literally the same
component fed by different data → guaranteed "y chang", and future rails (foundations? practice?) get it free.
No backend change — both rails' data already exists.

### The shared block — `blocks/navigation/OutlineRail` (props-only, tier-3)
Owns the whole look: progress header + continue button + search + `ScrollShadow` + **controlled** accordion of
groups → `ContentMapRow` items. Generic, data-driven contract (feature maps its domain onto it):
```
interface OutlineRailGroup {
  id: string
  title: string                  // shown truncate + tooltip
  progress: { done: number; total: number }   // expanded → ProgressMeter, collapsed → "n/m" muted
  items: Array<OutlineRailItem>
}
interface OutlineRailItem {
  id: string
  title: string
  isActive: boolean              // accent tint
  isRead: boolean                // ✓ done / read  → ContentMapRow.isRead
  isLocked?: boolean             // 🔒 → ContentMapRow.isLocked
  isPremium?: boolean            // ★
  meta?: ReactNode               // right-aligned (e.g. minutes / score)
  onPress: () => void
}
interface OutlineRailProps extends WithClassNames<undefined> {
  header: {                      // the rail's one primary action — REQUIRED per teacher
    label: string                // e.g. "Tiến độ"
    progress: { done: number; total: number }   // overall meter + "n/m"
    countLabel: string           // e.g. "2/12 bài"
    continue?: { label: string; onPress: () => void }   // "Về bài hiện tại / Tiếp tục"
  }
  search: { value, onChange, placeholder, ariaLabel }
  groups: Array<OutlineRailGroup>
  expandedKeys: Set<string>; onExpandedChange: (keys: Set<string>) => void   // controlled
  async: { isLoading, isEmpty, emptyTitle, error, onRetry, retryLabel }       // → AsyncContent
  activeItemId?: string          // for scrollIntoView
}
```
Rows still reuse the existing **`ContentMapRow`** block internally (already props-only). The block contains NO
hooks/store/i18n — features pass strings + callbacks.

### Refactor plan
1. **Build `OutlineRail`** by lifting `ContentMap`'s JSX (header/search/ScrollShadow/controlled accordion/
   ContentMapRow) into the block behind the contract above.
2. **`ContentMap` → thin wrapper-block feature:** keep its SWR (`myCourseOutline`) + redux + routing, map
   modules→`OutlineRailGroup` (group progress = lessons read/total) and lessons→`OutlineRailItem`
   (`isRead`, `isPremium`, minutes meta), header = course progress + existing "Tiếp tục". **Visual output
   must be byte-identical — regression-check the lesson rail.**
3. **`MilestoneOutline` → wrapper feature on `OutlineRail`:** map milestones→groups (progress = tasks done/
   total), tasks→items (`isRead`=completed, `isLocked`=`!isTaskUnlocked`, no description), header =
   **tasks-done `ProgressMeter` + "Về bài hiện tại"** → `currentTask.id`
   (`pathConfig…learn().personalProject(currentTaskId)`). Make expand **controlled**: auto-open the milestone
   owning `selectedTaskId`, search opens matches. Keep the `collapsed` `MilestoneIndexStrip` mode as-is.

### Header (confirmed) — tasks done + "Về bài hiện tại"
`ProgressMeter` value = Σ completed tasks, max = Σ total tasks; `countLabel` = `"{done}/{total} bài"`;
continue button → `currentTask.id` (hidden when no current task). Mirrors `ContentMap`'s resume.

### Risk / guardrail
#2 touches the WORKING lesson rail. Mitigation: build the block, migrate `ContentMap` FIRST and verify the
lesson rail is visually unchanged before wiring the milestone rail. If the lesson-rail migration gets hairy,
fall back to #1 (clone reusing `ContentMapRow`) for the milestone rail only — same end look, no lesson-rail risk.

### Alt directions (not chosen)
- **1 · Faithful clone** reusing `ContentMapRow` for the milestone rail only (no shared block) — the safe fallback.
- **3 · Minimal row-swap** — keep `MilestoneOutline` shell, swap row + add header. Smallest diff, not a true clone.

## Section → data (all already available, no BE delta)
| Rail part | Source |
|---|---|
| overall progress + "n/m" | `progressMap` (`milestoneTaskProgress.completionTasks`) — completed/total across milestones |
| "Về bài hiện tại" target | `milestoneTaskProgress.currentTask.id` |
| milestone groups | `milestone.entities` (sorted `sortIndex`) |
| per-milestone progress / "n/m bài" | tasks completed/total within the milestone (`progressMap`) |
| task rows (status) | `task.completed` → check · `!isTaskUnlocked` → lock · `selectedTaskId` → active tint |
| select task | `setSelectedTaskId` + `pathConfig…learn().personalProject(taskId)` |

## Cut / added
- **Cut:** per-task 3-line descriptions in the rail; force-expand-all; bespoke `MilestoneTaskRow`.
- **Added:** progress header + continue button; controlled expand (auto-open active, search-open);
  per-milestone progress/count; shared `ContentMapRow` rows; `ScrollShadow`.
