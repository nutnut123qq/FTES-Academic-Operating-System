# learn-navrail-toggle-and-interview-locks — Keep the tools rail on the lesson page (collapsible + persisted) + lock the interview tools when unpurchased

## Why
Two learn-page complaints from the learner:

1. **The left menu disappears on the lesson page.** The far-left course-tools rail
   (`LearnToolsRail` — Mind map / Leaderboard / Materials / Q&A / …) was only mounted on
   the `/learn/content` overview (`isContentDashboard`). The moment a learner opened an
   actual lesson (the content viewer), the rail vanished, so there was no way to jump to
   another section without going back. Verbatim: *"Có vô trang chính thì vẫn giữ cái menu
   bên trái hoặc cho phép bật tắt để còn chuyển hướng sang các phần khác nữa chứ."*
2. **Mock interview / Interview are open to non-buyers.** These two learn tools navigated
   freely even for viewers who had not bought the course, unlike the already-locked
   Playground / Personal project upsells. Verbatim: *"Mock interview / Interview 2 cái
   này khóa lại nếu chưa mua khóa luôn."*

## What Changes
- **Layout** (`courses/[courseId]/learn/layout.tsx`): mount the far-left `navRail`
  (`LearnToolsRail`) on the lesson reader too — `navRail = isContentDashboard ||
  isLessonReader ? <LearnToolsRail /> : undefined` — so cross-section navigation stays
  reachable while reading/watching a lesson. One source of the rail, shown by the shell
  across the overview + lesson pages (no duplicate).
- **LearnToolsRail** (`LearnToolsRail/index.tsx`): the desktop rail becomes a
  `CollapsibleSidebar` (reused block) — it owns the border, the 16rem↔4rem width
  animation, the collapse toggle, and **persists** the collapsed flag to `localStorage`
  (`ftes.learn.toolsRail.collapsed`) so the choice survives navigation between the
  overview + lesson pages and reloads. Rows are rebuilt on `SidebarNavGroup` +
  `SidebarNavItem` so they drop to an icon-only rail when collapsed; the "Tiếp tục"
  resume card becomes a collapse-aware `ResumeRow` (full card expanded, `PlayCircle`
  tile collapsed). The mobile inline panel (`mobile` prop) still renders the full,
  non-collapsing panel (unchanged behavior).
- **Interview locks** (`LearnToolsRail/index.tsx`): the Mock interview + Interview rows
  are locked (lock marker + whole-course `PackageGateModal` on press, same treatment as
  Playground / Personal project) whenever the viewer lacks full course access
  (`access.fullAccess !== true`, from the learn-course hook's already-composed
  `useGetMyCourseAccessSwr`). With full access they navigate normally to their routes.
- **SidebarNavItem** (`blocks/navigation/SidebarNavItem`): add an optional `ariaLabel`
  override (defaults to `label`) so a locked row can append the "requires enrollment"
  hint for screen readers without changing its visible label. Backward compatible.
- i18n `learn.toolsRail.collapseRail` / `expandRail` (vi + en) for the collapse toggle.

## Capabilities

### New Capabilities
- **learn-navrail** — the far-left learn course-tools / navigation rail: where it is
  mounted (overview + lesson reader), how it collapses and persists, and the
  access-gated locking of the interview tools.

## Impact
FE only. No new BE API — the lock reuses the already-wired `GET /courses/{id}/me/access`
(`access.fullAccess`) surfaced by `useQueryLearnCourseSwr`. The reused `CollapsibleSidebar`
/ `SidebarNavGroup` / `SidebarNavItem` blocks are unchanged except an additive optional
`ariaLabel` prop on `SidebarNavItem`. Guests / not-yet-purchased viewers degrade to
`fullAccess = false`, so the interview tools lock closed. `npx tsc --noEmit` clean +
`npm run build` (webpack) green.
