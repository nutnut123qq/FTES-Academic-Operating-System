## Context
Skill Graph (§21 Career Center, roadmap Phase 7) is 0% implemented — no component, hook, or page in src/. The repo already ships `@xyflow/react@^12`, `d3-force@^3`, `recharts@^3`, and `three`, all unused. Profile shell exists (`src/components/features/profile/ProfileShell/`, Progress section is a placeholder) and the subject Career tab exists (`src/components/features/subject/SubjectCareer/`, flat skill chips via `useQuerySubjectCareerSwr`). FE-only repo: BE contracts are mocked behind SWR-shaped hooks.

## Goals / Non-Goals

**Goals:**
- Spider-web ("mạng nhện") network graph of skills: user node at center, domain clusters (BE/FE/Mobile/AI/Data/DevOps) arranged radially, prerequisite/related edges.
- One reusable feature (`SkillGraph`) rendered on two surfaces: profile Progress (full graph) and subject Career tab (subject-scoped subgraph).
- Mock data via `useQuerySkillGraphSwr`, deterministic, SWR-shaped for drop-in BE swap.
- Interactions: pan/zoom, node click → side panel, hover neighbor highlight, domain filter, legend; mobile fallback list.
- i18n vi/en, loading skeleton, keyboard/aria a11y, build green.

**Non-Goals:**
- Real BE/GraphQL for skills; skill assessment or editing; 3D rendering (`three` stays unused); StarCI sync (§23); Career Roadmap pages beyond the graph itself.

## Decisions

- **Library: `@xyflow/react` + `d3-force` layout — not raw d3/SVG, not recharts, not three.**
  Both are already installed (zero new deps). `@xyflow/react` gives pan/zoom viewport, node/edge React rendering, selection, and a11y hooks out of the box; `d3-force` computes the spider-web layout (`forceManyBody` repulsion + `forceLink` on edges + `forceRadial` per-domain ring + `forceCollide`). Alternatives: recharts has no network-graph primitive; hand-rolled d3+SVG re-implements viewport/interaction; `three` (3D) is overkill and hurts a11y/mobile.
- **Layout computed once per data/filter change, then static.** Run the d3-force simulation synchronously (`simulation.tick(n)` ~300 iterations) in a memo — no animated ticking — then feed positions to React Flow nodes. Deterministic (seeded initial angles by domain index) so snapshots are stable and there is no layout jitter on re-render.
- **Spider-web shape:** center node = user (`type: "center"`), `forceRadial` radius per ring: learning/mastered skills inner rings, locked outer; domain decides angular sector so clusters form web sectors. Straight edges; prerequisite = solid directional, related = dashed, both low-opacity until hover-highlight.
- **Data model** (in the hook file, exported types): `SkillNode { id, name, domain: SkillDomain, level: number /*0–100*/, status: "locked" | "learning" | "mastered" }`, `SkillEdge { id, source, target, kind: "prerequisite" | "related" }`, `SkillGraphData { nodes, edges }`. `SkillDomain = "be" | "fe" | "mobile" | "ai" | "data" | "devops"`. Hook: `useQuerySkillGraphSwr(scope?: { subjectId?: string })` — no scope = full graph; subject scope returns the subject's skills + 1-hop neighbors.
- **Component decomposition** under `src/components/features/skill-graph/` (on-canon per `starci-fe-cannon-apply`):
  - `SkillGraph/` — container: SWR gate, empty/loading states, `<ReactFlow>` with custom node/edge types, toolbar (domain filter + legend), detail side panel; props `{ subjectId?, height? }`.
  - `SkillGraph/SkillNodeCard` — memoized custom node (size/color by mastery, status icon, focus ring).
  - `SkillGraph/SkillDetailPanel` — side panel (sheet on mobile): level progress, status, related subjects/courses links into workspace.
  - `SkillGraph/SkillGraphLegend`, `SkillGraph/SkillGraphSkeleton`, `SkillGraph/SkillListFallback` (mobile).
  - `hooks/useQuerySkillGraphSwr.ts` + `hooks/useSkillGraphLayout.ts` (pure d3-force memo).
- **Mobile (`<sm`):** render `SkillListFallback` — skills grouped by domain as tappable rows opening the same detail panel. Force-graph pan/zoom + tiny hit targets are hostile on 380px; a list preserves every capability (browse, filter, detail). Graph shows from `sm:` up with pinch-zoom via React Flow's built-in touch support.
- **Theming:** all colors via Tailwind design tokens/CSS variables (domain hues from the chart palette, `bg-surface`/`border-default` for panel and legend) — no hard-coded hex; dark mode follows tokens.
- **Performance:** mock caps at ~60 nodes / ~90 edges; custom nodes memoized (`React.memo`), edges non-interactive except hover; layout memoized on `[data, domainFilter]`; hover highlight via a `highlightedIds` set computed from adjacency map (no per-node graph walks in render).

## Risks / Trade-offs
- [Force layout illegible at scale] → cap mock at ~60 nodes; domain filter reduces visible set; radial sectors keep clusters apart.
- [React Flow SSR mismatch in Next.js] → component is `"use client"` and mounts the flow after hydration; skeleton until then.
- [Static layout can leave rare overlaps] → `forceCollide` with node-radius padding + fixed iteration count tuned once.
- [Mobile list diverges from graph mental model] → same data, same detail panel, domain grouping mirrors web sectors. Logged as acceptable.
- [Mock shape may not match future BE] → types exported from one hook file; SWR key `["skill-graph", scope]` so swap is contained.

## Open Questions
- None blocking. Edge case: whether Career tab should link back to the full profile graph — spec says yes (secondary link), cheap to drop if UX review disagrees.
