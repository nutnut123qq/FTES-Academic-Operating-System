---
name: starci-fe-skeleton-apply
description: >
  Add or fix LOADING SKELETONS on a StarCi data-backed region to the house standard — a skeleton that MIRRORS
  the real layout (same boxes, same sizes), built with HeroUI `Skeleton` + className, gated on the SWR state
  (`isLoading || !data || error`), with static chrome (breadcrumb/header) kept OUT of the skeleton, and a
  Spinner used only for short actions. Reads the standard from `../../decision/skeleton.md` (the skeleton
  decision log) + `../../cannon/CONTENT.md` (SLICE 3.7 AsyncContent) + `../../ui/CONTENT.md` (tokens/typography
  → box heights). ALWAYS draws a **widget mockup of the skeleton FIRST** (`show_widget`) so the loading shape is
  reviewable before any code is written, THEN writes the `*Skeleton` components. Use when the user says
  "/starci-fe-skeleton-apply", "thêm skeleton", "sửa skeleton", "loading state", "skeleton chưa khớp layout",
  "nhấp nháy khi load", or a region flashes/has no loading state. MAX effort.
---

# /starci-fe-skeleton-apply — make loading states mirror the real layout

Skill paths: `../../decision`, `../../cannon`, `../../ui`. `<src>` = `D:/Repositories/starci-academy`. This
changes code. Run `npm run lint` / tsc when done.

## Step 0 — Load the standard
Open `../../decision/skeleton.md` (the house skeleton decisions) + the `AsyncContent` rule in
`../../cannon/CONTENT.md` (SLICE 3.7). The rules below are the gist.

## The skeleton law
- **Every SWR-backed region renders through `AsyncContent`** (`<AsyncContent isLoading skeleton …>`), never an
  inline `if (isLoading) return <Spinner/>`. Priority `error → isLoading → isEmpty → children`.
- **The skeleton MIRRORS the real layout** — same number of boxes, same grid/stack, same sizes/rounding/spacing
  as the loaded content. A `XSkeleton` sits next to `X` and copies its shape. A generic grey block is wrong.
- **Gate = `isLoading || !data || error`** → show skeleton. Only render real content when `!isLoading && !!data
  && !error`. **Do NOT** put `isValidating` in the gate (background revalidate keeps the old data, no flash).
- **Static chrome is NOT skeleton-ized.** Breadcrumb + page header (`PageHeader`/title) depend on i18n/router,
  not SWR → render them REAL, outside the gate. `XSkeleton` mirrors only the data part (grid/list/card body).
- **Build with HeroUI `Skeleton` + className** (`<Skeleton className="h-4 w-32 rounded-md" />`); text rows use
  `SkeletonText`. **Box height tracks the font-size it stands in for** (a `text-sm` line → ~`h-4`; a title →
  taller) and width approximates the real text (`w-2/3`, `w-32`). Match the real radius (`rounded-xl` card, etc).
- **Spinner only for short actions** (button `isPending`, a quick inline fetch) — never for page/list/section
  content. Respect `prefers-reduced-motion`.

## Step 1 — Draw the skeleton widget (ALWAYS, before touching code)
Before writing or fixing any `*Skeleton`, render a **widget mockup of the skeleton** with `show_widget`
(call `read_me` first, module `mockup`) — gray boxes that MIRROR the real layout: same number of boxes, same
grid/stack, same sizes, radius (`rounded-sm` text · `rounded-full` pill/avatar · `rounded-xl` card), and the
`0/2/3/4/6` spacing rhythm. One widget can show several regions side by side (e.g. the page's header + body +
side panel). The widget is the reviewable artifact of the loading shape — same role the layout widget plays in
`/starci-fe-ux-brainstorm`. Only once the widget reflects the intended shape do you write the components in Step 2.

## Step 2 — Scope + apply
- Find the target's SWR consumer(s). For each data-backed region:
  1. Ensure it goes through `AsyncContent` with the correct gate.
  2. Write/repair the `XSkeleton` so it MIRRORS the loaded layout (count, grid, sizes, radius, spacing — reuse
     the same spacing scale `0/2/3/4/6`).
  3. Pull static chrome (breadcrumb/header) OUT of the gate so it shows immediately.
  4. Replace any content `Spinner` with a content-shaped skeleton.
- Keep the diff scoped to loading states.

## Step 3 — Report + record
Report which regions got a skeleton + how each mirrors its content. At the END of the task, append any new
skeleton decision to `../../decision/skeleton.md` ("Decisions"). Pairs with `starci-fe-layout-apply` (the
skeleton reuses the same spacing/sizing rhythm).
