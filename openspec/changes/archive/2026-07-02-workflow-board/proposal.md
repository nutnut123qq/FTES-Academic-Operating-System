## Why

§19 Workflow Engine had no surface. Content moving through the review pipeline
(Draft → AI Review → Mod Review → Approved → Published → Archived) was invisible —
there was no way to see what sits at each stage. This ships a read-only board so the
pipeline is legible before any drag/mutation semantics land.

## What Changes

- Add `features/workflow/WorkflowBoard` + `[locale]/workflow/page.tsx`: a kanban board
  with one column per stage (6 columns, horizontal scroll on small screens), each
  headed by a stage label + count, cards = content item (title + content-type chip).
  Read-only (no drag; mock).
- Add `useQueryWorkflowSwr` (mock list of ~8 content items, SWR-shaped).
- Add `workflow.*` i18n (vi/en): title/subtitle, `stages.*`, `contentTypes.*`,
  `itemsCount`, `emptyColumn`.

## Capabilities

### New Capabilities
- `workflow-board`: the content-workflow board at `/workflow`.

### Modified Capabilities
- (none)

## Impact
- FE: new `features/workflow/WorkflowBoard`, `workflow/page.tsx`,
  `useQueryWorkflowSwr`, `workflow.*` i18n. No BE (mock). No shared-file edits.
