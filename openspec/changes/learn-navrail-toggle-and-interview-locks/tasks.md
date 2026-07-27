# Tasks — learn-navrail-toggle-and-interview-locks

## 1. Mount the tools rail on the lesson page
- [x] 1.1 `learn/layout.tsx`: render the far-left `navRail` (`LearnToolsRail`) on the lesson reader too — `navRail = isContentDashboard || isLessonReader ? <LearnToolsRail /> : undefined` (one source, shown via the shell across overview + lesson pages)

## 2. Collapsible + persisted desktop rail
- [x] 2.1 Reuse `CollapsibleSidebar` for the desktop rail (sticky viewport-tall wrapper + `title` = "Mục lục khoá học" + collapse toggle); persist the collapsed flag to `localStorage` key `ftes.learn.toolsRail.collapsed`
- [x] 2.2 Rebuild the tool rows on `SidebarNavGroup` + `SidebarNavItem` so they drop to an icon-only rail when collapsed; keep the accent icons
- [x] 2.3 Make the "Tiếp tục" resume card a collapse-aware `ResumeRow` (full card expanded, `PlayCircle` tile collapsed)
- [x] 2.4 Keep the mobile inline panel (`mobile` prop) rendering the full, non-collapsing panel (menu title + resume + groups) — don't break the dashboard mobile fallback

## 3. Lock the interview tools when unpurchased
- [x] 3.1 Destructure `access` from `useQueryLearnCourseSwr`; compute `hasFullAccess = access?.fullAccess ?? false`
- [x] 3.2 Mark Mock interview + Interview rows `locked: !hasFullAccess` → lock marker + whole-course `PackageGateModal` on press (same treatment as Playground / Personal project); with full access they navigate normally
- [x] 3.3 `SidebarNavItem`: add optional `ariaLabel` override so a locked row keeps its "requires enrollment" screen-reader hint

## 4. i18n & verify
- [x] 4.1 i18n vi + en: `learn.toolsRail.collapseRail` / `expandRail`
- [x] 4.2 `npx tsc --noEmit` clean
- [x] 4.3 `npm run build` (webpack) green
