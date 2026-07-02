## Layout — catalog archetype (mirrors CourseCatalog)

The house already decided the catalog shape in `CourseCatalog` (search + filter +
card grid). Reuse it rather than re-brainstorm a standard list:
- `mx-auto max-w-6xl p-6` column; title + subtitle.
- Plain search `<input>` (house class) + difficulty filter buttons (`all` + the three
  `subjects.difficulty.*`), `secondary` when active else `ghost`.
- Card grid `sm:grid-cols-2 lg:grid-cols-3`; each card = house link-card class
  `rounded-large border border-separator p-4 hover:bg-default/40 no-underline`, code
  badge (`bg-accent/10 text-accent`) + name + difficulty chip + credits.
- Empty state when the filter matches nothing (`subjects.catalog.empty`).

## Data
`useQuerySubjectsSwr` — mock list, SWR-shaped, reuses the `Subject` interface from
`useQuerySubjectSwr` so the catalog and the workspace never diverge. `ponytail:` note
marks the BE swap point.

## Wiring
- `subjects` path builder + `useAppNav` gains a Subjects row (top of "Học"); the
  InnerLayout sidebar-gate already shows on `/subjects` (list) and hides on
  `/subjects/<id>` (workspace has its own rail) — no change needed.
- Landing Subject tile → `/subjects`; CTA "see a workspace" → demo subject.

## Not doing
- No enrol/progress semantics on the list (mock progress only); no BE.
- No per-subject sort/pagination (6 mock rows) — add when the catalog grows.
