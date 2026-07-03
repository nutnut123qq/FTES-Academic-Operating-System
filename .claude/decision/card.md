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
- **Landing honor/award card (Bảng vàng podium + grid)** · chose **hand-rolled glass
  panels in-feature** (`rounded-2xl border border-separator bg-surface/60
  backdrop-blur-md`, hover `border-accent/40` + `shadow-accent/20` glow), two shapes:
  large centered podium card (accent-ringed circular portrait → `bg-clip-text` metallic
  accent-gradient name → big count-up metric → muted lines) and a compact row card (sm
  portrait + name + accent chip + lines) · **WHY:** (a) landing = one-off composition in
  the feature, no new blocks (home-landing 2026-07-02 precedent); (b) glass-over-ambient-
  orbs needs a translucent bg — HeroUI `Card` bakes opaque `bg-surface`; (c) podium-center
  elevation uses side-card `sm:mt-6`, NOT translate, so the hover-lift transform never
  fights the layout offset; (d) **first shipped GOLD (`warning`) — user vetoed same day:
  an award card's color follows the THEME accent, honor is conveyed by hierarchy
  (tiering/metric/ring/glow), not by a gold palette** · home-landing HonorBoardSection ·
  2026-07-03
- **Hand-rolled bordered card panels bumped `rounded-large` → `rounded-2xl`** (softer, NOT
  `rounded-3xl`) · **repo-wide pass, 69 sites** — codemod over `src/` with the rule: bump the
  OUTER card container of a hand-rolled panel iff it has `rounded-large` + `border
  border-separator|default` AND is NOT `bg-transparent` (flat input), `size-*` (icon tile),
  `font-mono` (code chip), `border-dashed` (dropzone/empty strip), `flex-wrap`, or a horizontal
  row (`items-center|items-start` without `flex-col`) · **WHY:** teacher review of live
  screenshots — hand-rolled `border border-separator` panels sat at `rounded-large` (~12px) and
  read "thô" (boxy). **First tried `rounded-3xl` to match HeroUI `<Card>` — teacher: "bo quá
  tay" (over-rounded).** Landed on **`rounded-2xl` (~16px)** = gently soft without the pillowy
  24px. So the target radius for a hand-rolled bordered card panel is **`rounded-2xl`, not
  `rounded-3xl`** — the HeroUI `<Card>` 24px is its own thing; don't chase it for hand-rolled
  panels. **Kept** inner icon tiles, flat inputs, compact horizontal list-rows (community
  `Trending/Reputation/Poll`, subject/resource rows), quiz/poll option rows, chat bubbles,
  media/video frames, and small inner boxes (e.g. `TutorSettings` model box) at `rounded-large`.
  Nested radius smaller than the parent is correct. This supersedes the earlier "course family
  hand-rolls `rounded-large`" note below. · 2026-07-03
- **Catalog browse course card (shelf + grid + category page)** · chose a **hand-rolled
  bordered panel that IS a `Link`** (`rounded-large border border-separator overflow-hidden
  hover:bg-default/40`, cover 16:9 + gradient fallback, badge chip overlay, rating row,
  level chip + duration, `PriceTag` sm), named **`CatalogCourseCard`**
  (`features/course/browse/CatalogCourseCard`) · **WHY:** (a) the course feature family
  hand-rolls bordered panels (same idiom as the old catalog cards + the sticky enroll
  card) and this dodges the unverified HeroUI `Card.*` v3 API; (b) whole-card link IS
  correct here despite the "no whole-card-press with price/chips" gotcha — the spec
  requires the card to link to detail (Coursera/Udemy convention) and the only inner
  action (`SaveButton`) already swallows its press; (c) named `CatalogCourseCard` (mock
  `Course`-bound) to never collide with `blocks/cards/CourseCard` (`CourseEntity`-bound)
  · course-catalog browse · 2026-07-02
- **Sticky enroll card on a course sales page** · chose a **plain bordered panel**
  (`rounded-large border border-separator p-4` + `md:sticky md:top-20`), NOT `LabeledCard`
  / HeroUI `Card` · **WHY:** it's the right rail of a two-column sales layout — a
  self-contained "buy box" (cover + price + CTA + includes) the eye returns to while the
  left column scrolls; the course feature family in this repo already hand-rolls bordered
  panels this way, so matching that idiom keeps the domain consistent and avoids the
  unverified HeroUI `Card.Content` v3 API. Price via `PriceTag` (VND) + a muted USD line.
  · course-detail (direction A) · 2026-07-02
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
