## 1. Data model + mock hook

- [x] 1.1 Types `SkillDomain`/`SkillNode`/`SkillEdge`/`SkillGraphData` + `useQuerySkillGraphSwr(scope?)` mock hook (deterministic sample, ~60 nodes / 6 domains; subject scope = subject skills + 1-hop)
- [x] 1.2 `useSkillGraphLayout` memoized d3-force layout (forceLink + manyBody + radial-by-domain + collide, synchronous ticks, seeded)

## 2. Graph feature components

- [x] 2.1 `SkillGraph` container: React Flow canvas, custom node/edge types, pan/zoom, empty state
- [x] 2.2 `SkillNodeCard` memoized custom node (size/color by mastery, status icon, focus ring, aria-label) + edge styles (prerequisite solid / related dashed)
- [x] 2.3 Hover neighbor highlight (adjacency map + dim others)
- [x] 2.4 `SkillDetailPanel` (level progress, status, related subject/course links into workspace; Escape/close returns focus)
- [x] 2.5 Domain filter control + `SkillGraphLegend`
- [x] 2.6 `SkillGraphSkeleton` (mirrors canvas + toolbar) + `SkillListFallback` mobile list (domain-grouped rows → same panel)

## 3. Surfaces + polish

- [x] 3.1 Wire full graph into ProfileShell Progress section (replace placeholder)
- [x] 3.2 Wire subject-scoped subgraph into SubjectCareer tab
- [x] 3.3 i18n `skillGraph.*` (vi/en) for legend, filter, statuses, empty, panel
- [x] 3.4 A11y pass: keyboard Tab/Enter on nodes, aria on canvas region + icon-only controls
- [x] 3.5 Verify `npm run build` (webpack) green + `tsc --noEmit` clean
