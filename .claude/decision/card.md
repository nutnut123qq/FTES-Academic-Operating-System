# Decision — card

When & WHY we choose/shape the **card** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a card, we reuse the house's logic instead of guessing.
Course/pricing/media/continue cards — the dominant content unit.

**StarCi blocks in this family:** `CourseCard`, `PricingCard`, `MediaCard`, `ContinueCard`, `LabeledCard`, `FlipCard`, `PressableCard`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Design baseline (from rules + design — 2026-06-21)

- **Section card = `LabeledCard`** (`blocks/cards/LabeledCard`). Label lives **OUTSIDE/above** the card (HeroUI `Label`), content goes inside `<Card><CardContent>`. No header-inside-card (`SectionCard` = legacy, migrating away).
- **Structure:** `<section>` → row [icon + `Label` … `Link` "Xem thêm ›"] → `<Card><CardContent>`. Label icon = phosphor `*Icon`, `size-5`, **foreground color (NOT accent)**, `aria-hidden`.
- **See-more = HeroUI `Link`** (not Button), accent, ends with `CaretRightIcon`. Override text via `seeMoreLabel` (default "Xem thêm"). Caret slides right on hover (`group` + `transition-transform group-hover:translate-x-1`).
- **Spacing:** `Label → Card` = `gap-3`; between cards = `gap-6`. Card frame + padding owned by HeroUI `Card/CardContent` — feature does NOT style.
- **No card-in-card:** `LabeledCard` always wraps a `<Card>`, so only put FLAT content inside (rows/bars/list/heatmap/checklist). Content that is itself a card (grid of `ResumeCard`, `PressableCard`, `SectionCard`) → use **`LabeledCard frameless`** (keeps label row, drops the wrapping `<Card>`).
- **Edge-owning children** (Accordion, Table, list with full-width `Separator`, `ScrollShadow`) → pass `contentClassName="p-0"` so content runs to the edge; plain flat content keeps default `px-4 py-3`.
- **Data inside a card MUST go through `AsyncContent`.**
- **Tokens/look:** card uses default `card--default` = `bg-surface`, `rounded-3xl`, **no shadow** (global `globals.css .card { shadow-none }`). Do NOT override bg with `bg-default/40`; hover = `hover:bg-surface-secondary`. Denser variants: `card--secondary`/`card--tertiary`.
- **Pressable whole card = `blocks/cards/PressableCard`** — HeroUI v3 `Card` is a static `<div>` (no `isPressable`/`onPress`, unlike NextUI v2). `PressableCard` owns its look (`bg-surface rounded-3xl px-4 py-3` + hover tint + focus ring) on a real `<button>`/`<a>`. Never hand-roll `<button className="rounded-* border bg-* p-*">`; never nest `Button`/interactive inside (button-in-button).
- **When NOT to whole-card-press (teacher 2026-06-18):** cards with info/price/chip/multi-line → keep card STATIC; action is either title-as-`EntityToken` link OR a "Tiếp tục ›" caret-link. Whole-card press is ONLY for thin navigation tiles (1 destination, no separate text-action — e.g. QuickAction).
- **"Current plan" indicator = full-width banner, NOT a small chip:** `flex w-full justify-center … bg-accent/10` (or `bg-success/10`) + `text-success` medium; banner radius matches the parent card radius (e.g. `rounded-3xl`). Every plan in a comparison (incl. free/0đ) must state real specs (credit/limit).

## Decisions (newest first)
- **Persistent action panel in a split workspace** · chose a single **`Card` + `CardContent` (gap-6)**
  wrapping Label "Github dự án" → submission fields → actions → result (`TaskSubmissionPanel`), NOT
  `LabeledCard` · **WHY:** this is the sticky RIGHT side of a read-left/act-right split — it must read as one
  self-contained bordered "panel" the eye returns to, so the label sits INSIDE the card frame (a panel
  header), whereas `LabeledCard` puts the label OUTSIDE/above and is for in-flow page sections. A bordered
  card also visually detaches the action surface from the left reading column. · personal-project task page ·
  2026-06-20

## Gotchas
- **A pressable card is NOT for a navigate-to-detail index.** A list whose only job is "tap → go deeper"
  (e.g. the Foundations topic index) should be a **link + caret list row** (`ListRow` in a joined
  `SectionCard`), not a grid of big `PressableCard`s. Reserve heavy pressable cards for marketing / hero /
  pick-one-of-few surfaces where the artwork itself carries value. See [[list]] (2026-06-21 Foundations).
