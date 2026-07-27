# learn-starci-layout-parity — Match the /learn/content column order to StarCi

## Why
On the course-learn content dashboard (`/courses/{id}/learn/content`) the three-column
shell rendered in the WRONG order versus StarCi. FTES put the content-map (module
accordion) in column 1 (far left), the main course content in the middle, and the
course-tools rail (`LearnToolsRail`) in column 3 (far right). StarCi's `LearnShell`
puts the course tool menu on the FAR LEFT (its persistent `LearnSidebar`), the
content-map in the middle, and the main course content on the right.

The mismatch is exactly the reported symptom: "the left menu is gone and the features
are all pushed to the right" (cái menu bên trái đâu, sao tính năng nằm hết bên phải).
The tools rail was being handed to `LearnShell` as `rightRail`, so it landed in the
last column; the far-left column showed the content-map instead of the tool menu.

## What Changes
- **LearnShell** (`LearnShell/index.tsx`): add a `navRail` slot rendered as the FIRST
  (far-left) child — column 1 — ahead of the existing `leftRail` (content-map, column 2)
  and the content column (column 3). Mirrors StarCi's `LearnShell`, which renders its
  `LearnSidebar` before the content-map.
- **Learn layout** (`learn/layout.tsx`): pass `LearnToolsRail` as `navRail` on the
  content dashboard instead of as `rightRail`. The dashboard's `rightRail` is now empty
  (its tools moved left); the lesson reader keeps `OnThisPage` on the right unchanged.
- **LearnToolsRail** (`LearnToolsRail/index.tsx`): reposition from a right-side aside
  (`lg:ml-8`) to a far-left rail (`lg:border-r`, own padding, viewport-tall flex column),
  and lead the rail with the course-menu header ("Mục lục khoá học") and a highlighted
  "Tiếp tục · N/total" resume card (next unread lesson, computed from the same learn tree
  the content-map reads) above the existing tool groups. Feature set, routes, locked-row
  buy flow and i18n are unchanged — only placement + the header/resume chrome are added.
- **LearnContentPage**: comments corrected to say the tools now live on the far left; no
  behavioural change (the mobile inline `LearnToolsRail` block stays).
- i18n `learn.toolsRail.menuTitle` (vi + en).

## Capabilities

### New Capabilities
- **learn-shell-columns** — the canonical three-column arrangement of the course-learn
  content dashboard: course-tools rail (column 1, left), content-map (column 2, middle),
  main course content (column 3, right), rendered under the retained global app navbar.

## Impact
FE only. Pure layout/slot rearrangement of existing components — no data, API, routing
or feature changes. The global app navbar is untouched (the learn shell never hid it).
Below `lg` the columns stack and the tools stay reachable through the existing inline
mobile block, so mobile is unaffected. `npx tsc --noEmit` clean and `npm run build`
(webpack) green.
