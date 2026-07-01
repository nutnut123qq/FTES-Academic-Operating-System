# gap — the spacing rhythm (flex/grid `gap-*` + `space-*`)

Grounded from a full scan of `src/**.tsx` (2026-06-21):
**`gap-2` ×440 · `gap-3` ×423 · `gap-6` ×197** are the spine; `gap-0` ×61 and `gap-4` ×36 are the edges;
**`gap-1.5` ×194 is the biggest drift** to snap out. Allowed values: **`0 · 2 · 3 · 4 · 6`** only.

## The rule — pick by RELATIONSHIP, never by "size feel"
| `gap` | Relationship | Use for | seen |
|---|---|---|---|
| **`gap-0`** | a component's **title + its description** (one tight pair) | title ↔ desc | 61 |
| **`gap-2`** | **coupled** — two things that read as ONE | **label ↔ input** · icon ↔ label · avatar ↔ name · chip ↔ chip in a row | 440 |
| **`gap-3`** | **RELATED content** — pieces of one group | items of one kind in a list · **the gap INSIDE a card** · header ↔ meta-row · stacked content that belongs together | 423 |
| **`gap-6`** | **two DIFFERENT content sections** | content block ↔ content block · section ↔ section · card ↔ card · grid of cards | 197 |
| **`gap-8`** | **two DIFFERENT LAYOUT regions** | the big structural areas — e.g. **identity column ↔ content column** on profile/dashboard (the side-by-side regions) | — |

`gap-4` = one roomy single group (rare — 36). Default to `0 / 2 / 3 / 6`.

> **The one question that decides it:** *"Are these two the SAME function or DIFFERENT?"*
> Same group → **`gap-3`**. Different blocks → **`gap-6`**. (`space-y-*`/`space-x-*` use the exact same scale.)

## The 3 levels of difference: `3 → 6 → 8` (2026-06-21)
The gap grows with **how different the two things are**:
- **`gap-3`** — **related content** (pieces that belong together): stacked content in a column, the gap inside a
  card, header↔meta. This is the reading rhythm — a content/lesson column stacks its parts with **`gap-3` (`h-3`)**.
- **`gap-6`** — **two different content sections** (one content block vs another).
- **`gap-8`** — **two different LAYOUT regions** (the big structural areas) — e.g. the **identity column ↔ the
  content column** on profile/dashboard (the side-by-side regions).

> `gap-8` is NOT a vertical content gap — vertical content uses `3` (related) or `6` (different sections).
> `8` is reserved for **whole layout regions** (e.g. the two profile/dashboard columns).

### Region separation: divider → gap-0+p-6, no divider → space-8 (2026-06-21)
Between two layout regions, the separation depends on whether a **divider/border** sits between them:
- **Has a divider** (a `border` between the regions) → **gap-0** (no space), each region keeps **`p-6`**. The
  line does the separating; adding space would violate the rule.
- **No divider** → **space-8** between the regions, and **zero the padding on the facing edges** (the LEFT
  region `pr-0`, the RIGHT region `pl-0`) so the 8 isn't doubled by padding.

**Apply the 8 as a MARGIN on the one region** (`lg:ml-8`), **NOT a flex `gap-8` on the whole row** — a row-wide
`gap-8` wrongly spaces the divider boundaries too (every gap turns into 8 = violation).

Real example (lesson reader, 4 columns): sidebar | content-map | content | "On this page".
- sidebar↔content-map↔content boundaries have dividers → **gap-0** (the flex row has NO `gap-8`).
- content↔"On this page" has no divider → content = `p-6 pr-0`, the rail = `p-6 pl-0` + `lg:ml-8` (the space-8).

## DO
- title + description → `gap-0`
- label + input → `gap-2`
- a list of cards / a stack of sections → `gap-6` (`flex flex-col gap-6`, `grid gap-6`)
- the contents inside one card → `gap-3` (`flex flex-col gap-3 … p-6`)

## DON'T (off-scale → snap out)
- **`gap-1.5` → `gap-2`** (194 uses — the #1 cleanup)
- `gap-1` → `gap-2` · `gap-5` → `gap-6` · `gap-2.5` / `gap-0.5` → nearest step
- faking a gap with `margin` on children (use the flex/grid `gap`)

## VIOLATION (what `/starci-fe-layout-apply` flags)
any `gap`/`space` not in `{0,2,3,4,6}`; `gap-3` between two unrelated sections (→ `6`); `gap-6` inside one
card (→ `3`); `gap-2` where it's actually two different blocks (→ `6`).
