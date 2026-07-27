# Tasks — learn-starci-layout-parity

## 1. LearnShell far-left slot
- [x] 1.1 Add a `navRail?: ReactNode` prop to `LearnShellProps`
- [x] 1.2 Render `navRail` as the FIRST child (column 1), before `leftRail` (content-map) and the content column

## 2. Learn layout wiring
- [x] 2.1 Pass `LearnToolsRail` as `navRail` on the content dashboard (`isContentDashboard`)
- [x] 2.2 Remove `LearnToolsRail` from `rightRail`; the dashboard right rail is now empty, the lesson reader keeps `OnThisPage`

## 3. LearnToolsRail → far-left rail
- [x] 3.1 Reposition the desktop aside from a right rail (`lg:ml-8`) to a far-left rail (`lg:border-r`, own `p-4`, viewport-tall flex column that scrolls only its body)
- [x] 3.2 Add the course-menu header ("Mục lục khoá học") at the top of the rail
- [x] 3.3 Add a highlighted "Tiếp tục · N/total" resume card (next unread lesson) above the tool groups, computed from the learn tree (done/total + `continueLessonId`)
- [x] 3.4 Keep the existing tool groups, routes, locked-row buy flow, and mobile inline block intact

## 4. i18n & verify
- [x] 4.1 i18n vi + en: `learn.toolsRail.menuTitle`
- [x] 4.2 Correct stale "right-side" comments in `LearnContentPage`
- [x] 4.3 `npx tsc --noEmit` clean + `npm run build` (webpack) green
