# Decision — empty-state

When & WHY we choose/shape the **empty-state** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a empty-state, we reuse the house's logic instead of guessing.
Loading/empty/error states.

**StarCi blocks in this family:** `AsyncContent`, `EmptyContent`, `ErrorContent`, `EmptyState`, `ErrorState`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Design baseline (from rules + design — 2026-06-21)

No dedicated legacy rule file for empty/error states — the rest to be filled from feedback. What the sources DO say (mostly via the popover/dropdown state-branch pattern in `starci-popover.md` + `starci-dropdown.md`):

**Three-branch state body = always BLOCKS, never hand-styled tags.** Any data region renders three branches and each uses a block — no `<button>` / `<span>` styled by hand in the feature:
- loading → `Skeleton` mirroring the real layout (a few rows);
- empty → `EmptyState icon={...} title={t("...empty")}`;
- content → the real list (`ListRow` / `FeedItem`).

```tsx
{isLoading ? (
  /* Skeleton matching layout */
) : empty ? (
  <EmptyState icon={...} title={t("...empty")} />
) : (
  /* list of ListRow */
)}
```

**Per-region async** (from dropdown rule): when a header AND a menu both depend on state, EACH region wraps its own `AsyncContent` with a state-appropriate skeleton (header → `Skeleton.UserCell`; menu → `Skeleton.Menu items={n}` — icon square + one text row matching the real item; do NOT use `Skeleton.ListBox` for a menu — it's a flashy full-width bar with the wrong layout).
- Loading flag = the REAL SWR flag (`isLoading && !data`), never `keycloak.initialized` (never set → skeleton stuck forever). It MUST self-resolve on failure (SWR fail → `isLoading=false` → fall back to guest, don't hang on loading).

**Empty body lives inside the popover/region inset** (`px-2 py-1` div in `PopoverContent`), under a `Header` title, scroll via `max-h-[...] overflow-y-auto`.

(InfoTooltip note: `starci-popover.md` is the popover-panel convention, not an empty-state rule; no `InfoTooltip`-specific empty/error guidance found in the read sources.)

## Decisions (newest first)
_(empty — each entry: **scenario** · **chose what** · **WHY** · which page · date)_

## Gotchas
_(empty)_
