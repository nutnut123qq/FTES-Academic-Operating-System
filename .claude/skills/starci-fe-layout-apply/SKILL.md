---
name: starci-fe-layout-apply
description: >
  Fix a StarCi page/component's LAYOUT + SPACING to the house standard — the semantic spacing scale
  (gap/space/padding only 0·2·3·4·6, never 1/1.5/5/8/11), the container caps, the 3-tier content layout, and
  block-owns-padding. Walks the target's JSX and corrects every gap-*, space-y-*, p-*, max-w-*, and section
  structure to the rule, then reports the diff. Reads the standard from `../../ui/CONTENT.md` (spacing/tokens),
  `../../design/CONTENT.md` (layout foundations + 3-tier law), `../../cannon/CONTENT.md` (SLICE 7 styling).
  Use when the user says "/starci-fe-layout-apply", "sửa layout", "fix spacing", "căn lại gap/padding",
  "layout chưa chuẩn", "spacing lệch", or points at a page/component whose rhythm is off. MAX effort.
---

# /starci-fe-layout-apply — fix layout & spacing to the house rhythm

Skill paths: `../../ui`, `../../design`, `../../cannon`. `<src>` = `D:/Repositories/starci-academy`. This is a
fix-the-spacing/layout pass — it changes code (unlike brainstorm). Run `npm run lint` / tsc when done.

## Step 0 — Load the standard (the per-property files are the source of truth)
Open **`../../ui/gap.md`** (the gap rhythm), **`../../ui/padding.md`**, **`../../ui/margin.md`** — each is
grounded in a real scan of `src/` with usage counts. Then `../../design/CONTENT.md` (Layout foundations +
3-tier law). The tables below are the gist; those files decide.

## The spacing scale — semantic, NOT by size feel (only `0 · 2 · 3 · 4 · 6`)
| Value | Relationship | Use for |
|---|---|---|
| `gap-0` / tight | one tight pair | **title ↔ description** (the only gap-0 pair) |
| `gap-2` | coupled | icon ↔ label, label ↔ input, avatar ↔ name, chip ↔ chip in a row |
| `gap-3` | same function | items of ONE kind in a list, gaps INSIDE a card, header ↔ meta-row, the rhythm within a tier |
| `gap-4` | roomy container | a container that needs air but items are still one group |
| `gap-6` | DIFFERENT function | **section ↔ section · card ↔ card · text-block ↔ CTA · header ↔ body** · section padding |

**Banned (off-scale):** `gap-1`, `gap-1.5`, `gap-5`, `space-y-5`, `p-5`, `p-8`, `p-11`, any odd value. Snap to
the nearest semantic step. `space-y-*` follows the same scale as `gap-*`.

## Padding & containers
- **Block owns padding; a feature never sets `p-*`/`gap-*`/color** (cannon SLICE 7) — if a feature has spacing
  classes, push them into the block or a layout wrapper.
- **Rail / content panel** default `p-6`. **Page shell** `p-3`. **Card** `px-4 py-3` (fixed, from `.card`
  globals — don't re-pad a card).
- **Container caps:** page `max-w-[1280px] mx-auto`; **reading column** `max-w-3xl mx-auto`; the three tiers of
  a content page **share ONE cap** so they align left.
- **Section gap = `gap-6`.** Page-level gutters `gap-8/10/12` are the rare exception (whole-page rails only).
- Vertical scroll region → HeroUI `ScrollShadow`, not raw `overflow-y-auto`.

## The 3-tier content layout (law)
Every content page = **Breadcrumb → Header (`Heading level={3}` H3 + `body-sm muted` description, via block
`PageHeader`) → Content.** Between tiers: one `h-3` spacer. Within a tier: `gap-3`. All three tiers share the
same width cap (`max-w-3xl`) + `mx-auto`. Title↔description is `gap-0`; everything else in the header is `gap-3`.
(Personal/profile pages use the 2-column shell instead — bare identity left, `LabeledCard` sections right.)

## Step 1 — Scope + fix
- Scope the target (a page, a feature, a block). Read its JSX.
- Walk every spacing/layout class and correct it:
  - Off-scale gap/space/padding → snap to `0/2/3/4/6` by the **semantic** table above (ask "are these the SAME
    function or DIFFERENT?" — same → 3, different → 6).
  - Feature carrying `p-*`/`gap-*` → move into the block / a layout wrapper.
  - Card re-padded → remove (card already `px-4 py-3`).
  - Missing/duplicated container cap → one `max-w-*` + `mx-auto`; tiers share it.
  - Content page not in 3 tiers → restructure to Breadcrumb → `PageHeader` (H3) → Content with `h-3` spacers.
- Keep the diff scoped to layout/spacing — don't refactor logic.

## Step 2 — Report + record
Report a short before→after table (which classes changed + why, by the semantic rule). At the END of the task,
append any NEW spacing/layout decision to `../../design/CONTENT.md` ("Layout foundations") so the rhythm stays
one source of truth. (Sibling: `starci-fe-skeleton-apply` for loading states.)
