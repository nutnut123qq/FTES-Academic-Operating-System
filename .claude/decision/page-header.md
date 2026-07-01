# Decision — page-header

When & WHY we choose/shape the **page-header** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a page-header, we reuse the house's logic instead of guessing.
Page container + header + sticky bar.

**StarCi blocks in this family:** `PageHeader`, `PageContainer`, `StickyBottomBar`, `ResizableRail`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Design baseline (from rules + design — 2026-06-21)

Distilled from `03-layout-archetypes.md` (the three standard page frames) + the `three-tier-page-layout` draft.

**Pick an archetype first.** Building a new page → choose the nearest of the three frames and reuse its grid + components:
- **A. Course detail** (`layouts/Course`): container `max-w-[1280px]`, `grid md:grid-cols-5`; left `col-span-3` (title `text-4xl bold`, description `foreground-500`, requirements Alert, curriculum Accordion), right `col-span-2` rail = `EnrollCard` (cover img + `Stepper` pricing + `SealCheckIcon` checklist; opens `PaymentModal`).
- **B. Course learn** (`grid grid-cols-4`): icon sidebar + center Module + right rail `ModuleSidebar` (`grid lg:grid-cols-3`, meta-chip per item). Sidebar = `ListBox` + `ScrollShadow`, active row `text-accent bg-accent/10`. Often rendered dark.
- **C. Challenge detail** (`modals/ChallengeModal`, `Modal size="full"`): `lg:grid-cols-5`, left `col-span-2` (tasks/requirements/outputs), right `col-span-3` (steps + code). Header center: title + score chip (accent trophy) + difficulty chip.

**Shared frame for every archetype**
- Breadcrumbs on top → title bold + description `foreground-500` → content gathered into rounded `Card` / `Accordion`.
- Grid only splits at a breakpoint (`md:` / `lg:`); mobile stacks vertically (right rail drops below).

**Three-tier content page (from `three-tier-page-layout` draft)** — for reading/content pages, in order with even vertical rhythm:
1. Breadcrumb (`Breadcrumbs` HeroUI).
2. Header: `Typography.Heading level={3}` (H3, NOT a giant H1/H2) + description `body-sm muted`. Use block `blocks/layout/PageHeader` (bakes breadcrumb slot + H3 + desc + actions slot); special pages (lesson reader with meta chips/outcomes) build their own header but STILL H3.
3. Content.
- Same `h-3` spacer between tiers + same `gap-3` within a tier (don't mix spacer sizes). All three tiers share the same width cap (`max-w-3xl` for a reading column) + `mx-auto` so they're left-aligned. Don't let breadcrumb be wider than content.
- Padding is owned by the container block (`PageContainer` / wrapper); the feature only places. Rail / content block default `p-6`.
- Header internals: title + description are a tight `gap-0` pair (desc `body-sm muted`); everything else inside the header (meta-row, outcomes) is `gap-3` (same-function = gap-3); gap-6 is only between two DIFFERENT-function regions (header ↔ body). Cut meaningless meta chips (e.g. a linear "Content N/M" that duplicates the rail/pager); a semantic status chip that should pop = `bg-<token>/10 text-<token>` (e.g. read badge = `success` green, override bg to `/10`).

## Decisions (newest first)

### 2026-06-21 — One header scale everywhere = block `PageHeader` (H3 + body-sm)
- **Scenario:** the two foundations pages had **mismatched** headers — the hub used `Typography type="h1"
  weight="bold"` (huge), the category page used the legacy `SubPageHeader` (a `@gravity-ui` back-arrow +
  `gap-1.5` row) at a different scale. Thầy: "đồng bộ size tất cả header và description."
- **Chose:** every page/section header renders the block **`PageHeader`** → `Typography.Heading level={3}
  weight="bold"` title (dính `gap-0`) + `Typography type="body-sm" color="muted"` description. Both foundations
  headers now just feed title+description into `PageHeader`. **No H1/H2** for an in-page header.
- **Dropped the back arrow:** the category page sat inside the learn sidebar + breadcrumb, so per the
  sidebar+breadcrumb rule the per-page back arrow is redundant — `SubPageHeader` (legacy, broken-rule) is retired
  here; the breadcrumb's parent link is the only escape. See [[sidebar]].
- **WHY:** one header scale across pages = a calm, predictable hierarchy; mixed H1/H2/legacy headers make each
  page feel like a different app. `PageHeader` is the single source so the scale can't drift.

## Gotchas
- **Every page MUST have breadcrumbs (thầy, strict).** A content/sub page renders a breadcrumb trail (HeroUI
  `Breadcrumbs`) as tier-1, above the header — either standalone above the header or via `PageHeader`'s
  `breadcrumb` slot. Don't ship a page that drops the user with no "where am I / how do I get back" trail. When
  breadcrumb is present, also drop any per-page back arrow (it's redundant — see the decision above).

## Gotchas
- **Cap content width — don't let a page stretch edge-to-edge on wide monitors.** A content/index page wraps
  its whole column (breadcrumb + header + body) in **`mx-auto max-w-3xl`** (one shared cap, applied on the page
  wrapper, NOT per-section) so the three tiers align on the same reading column. `max-w-3xl` for single-column
  reading/lists (matches the lesson reader); go wider only for a genuine multi-column grid. Thầy: "nhớ max-w cho
  nội dung bên trong." See [[list]] (Foundations, 2026-06-21).
