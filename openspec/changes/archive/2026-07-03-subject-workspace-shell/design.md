## Context
Chosen interactively 2026-07-01: archetype A (sidebar rail), see `.claude/design/subject-workspace.md`.

## Goals / Non-Goals
**Goals:** navigable shell for the 9 areas, on-canon (house sidebar blocks), build green, FE-only mock.
**Non-Goals:** real BE, per-area layouts (each gets its own brainstorm), Profile (§2).

## Decisions
- Reuse `CollapsibleSidebar`/`SidebarNavGroup`/`SidebarNavItem`; sticky one-scroll.
- Active tab via `usePathname`; navigate via i18n `useRouter`. Plain path strings (no pathConfig builder yet).
- Overview = hub grid (C); unbuilt areas = `SubjectTabPlaceholder` so nav never 404s.

## Risks / Trade-offs
- Overview shortcut cards hand-rolled (not `PressableCard`) — flagged for the Overview brainstorm.
- Mock subject data — real query is a drop-in.
