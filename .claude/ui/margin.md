# margin — `m-* / mx-* / my-* / mt-* / mb-*`

Grounded from `src/**.tsx` (2026-06-21): margin is **rare on purpose** — `mt-2` ×19, `mt-1/mt-3/mb-2` …, total
~100 vs 1000+ gaps. Only `mx-auto` is common (×53). The house is **gap-first, margin-last.**

## The rule: prefer `gap`, avoid `margin`
- **Spacing between siblings → use the parent's `flex/grid` + `gap-*`** (see `gap.md`), NOT margin on children.
  Margin-on-children fights the gap and breaks the rhythm.
- **Margin is allowed only for the few things gap can't do:**
  | Allowed margin | Use |
  |---|---|
  | **`mx-auto`** | center a capped container (`max-w-3xl mx-auto`) — the one common margin (×53) |
  | small optical nudge `mt-1` / `mt-2` | align an icon/baseline that `items-*` can't fix — last resort |
  | `mt-6` / `mb-6` | separate a block from a NON-flex parent (when you can't add `gap-6` to the parent) |

## DON'T
- a column of `mt-*` to space a list (→ make the parent `flex flex-col gap-*`)
- `mb-*` on every card to separate them (→ parent `gap-6`)
- off-scale margins (`mt-5`, `my-1.5`, `mt-0.5`) → snap to `0/1/2/3/6` or remove
- negative margins to "pull" layout (almost always a sign the parent spacing is wrong)

## VIOLATION
margin used where a parent `gap` should be; off-scale margin; `mb-*`/`mt-*` stacking to fake section spacing.
