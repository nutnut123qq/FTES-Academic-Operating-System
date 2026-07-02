## Layout — kanban archetype

A read-only kanban mirrors the house catalog framing (`mx-auto max-w-6xl p-6` column,
title + subtitle) but lays content out in stage columns instead of a card grid:
- `mx-auto max-w-6xl p-6` column; title + subtitle.
- Column strip is a horizontal flex row (`flex gap-4 overflow-x-auto`) so the six
  fixed-width columns (`w-72 shrink-0`) scroll sideways on narrow screens instead of
  wrapping.
- Each column = `<section>` (labelled `aria-label={stage}`) with a header row: a
  phosphor stage icon (`text-accent`) + stage label + a count `Chip` pushed right
  (`ms-auto`). Stages render in pipeline order.
- Card = `<article>` on `bg-surface` with the item title + a content-type `Chip`
  (`variant="soft" color="accent"`). Cards stack vertically in the column.
- Empty column shows a muted `emptyColumn` placeholder (archived/late stages start
  empty in the mock).

## Data
`useQueryWorkflowSwr` — mock list of ~8 `WorkflowItem { id, title, contentType, stage }`,
SWR-shaped (`items`/`isLoading`/`error`). Stage/content-type unions live beside the
hook so the component and any future mutation share the types. `ponytail:` note marks
the BE swap point (a real `workflowItems()` query drops in without touching the board).

## Not doing
- No drag-and-drop / stage transitions (read-only mock) — the whole point is legibility
  first; wire mutations when the §19 BE contract exists.
- No filters/search/assignee/SLA columns — add when the board grows past a demo.
- No sidebar/nav wiring or path builder here (shared files off-limits for this change).
