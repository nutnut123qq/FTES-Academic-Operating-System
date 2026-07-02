# Decision — chip

When & WHY we choose/shape the **chip** block. A decision log: for a given scenario, which component we
picked and the reasoning — so next time we design a chip, we reuse the house's logic instead of guessing.
Status/difficulty/language chips.

**StarCi blocks in this family:** `StatusChip`, `DifficultyChip`, `LanguageChip`

> Grows automatically: at the END of each `/starci-fe-ux-apply`, the decision for this block (scenario →
> choice → why) is appended below. No manual command.

## Design baseline (from rules + design — 2026-06-21)

- **Core principle: a chip is ONE SOFT COLOR BLOCK, no border.** Soft tint background of one color, text + dot/icon in the same color but darker. NEVER use `border` to draw a chip (that reads as "outline", noisy). Separate by tint + text color, not by lines.
  - Formula: `bg = color @ 10%` · `text = color @ 100%` · `dot = color @ 100%` · `border = none`.
- **Chip "NỔI" (semantic emphasis: status / read / recommended) = explicit `bg-<token>/10 text-<token>`.** A chip
  that must stand out gets the EXPLICIT tint classes — e.g. success → `className="bg-success/10 text-success"`.
  Do NOT rely on HeroUI's default chip chrome (`variant="secondary"`/soft renders **too dark** in this theme)
  and do NOT use `variant="primary"` (a SOLID token fill = too heavy/loud for a chip). The bright-but-soft pop =
  `variant="secondary" color="<token>"` + override `className="bg-<token>/10 text-<token>"`. Canonical example:
  `ReadBadge` (`<Chip variant="secondary" color="success" className="bg-success/10 text-success">`). Same rule,
  any token (`bg-danger/10 text-danger`, `bg-warning/10 text-warning`, …). This is the FE twin of the backend
  draft "chip semantic muốn nổi = bg-<token>/10 text-<token>".
- **Token colors (success/danger/warning/accent/default) → HeroUI `Chip variant="soft"`** via existing blocks, don't hand-roll:
  - `StatusChip tone="success|danger|warning|accent|neutral"` — wraps `Chip color={token} variant="soft"` + `Chip.Label` (soft = tint bg + matching text, auto no border).
  - `DifficultyChip` — beginner/intermediate/advanced/**insane** (insane → `accent` because Chip `color` is an enum; the data-driven difficulty BAR uses purple `--difficulty-insane` instead — accepted divergence).
  - Need a new token chip → add a tone to those blocks, never `<span className="border …">` in a feature.
- **Programming language → `LanguageChip`** (`blocks/chips/LanguageChip`), GitHub-style: **brand dot + name, NO bg/box**. NOT `StatusChip`/pill. Color/name from `src/modules/utils/language.ts` (`getLanguageColor`/`getLanguageLabel`; `csharp→C#`, `cpp→C++`). Brand color = valid "no hex" exception (external brand identity), kept in `language.ts`, not globals tokens.
- **Runtime hex color (rank tier — gray/bronze/silver/gold, dynamic outside tokens)** → can't force into `Chip color`; build a span in a reuseable (pattern `RankBadge`) mimicking soft: `backgroundColor: color-mix(in srgb, ${color} 10%, transparent)`, `color`, dot `bg = color`. `color-mix` works for ANY color string (hex 3/6/8, rgb…) where Tailwind `bg-[..]/10` only builds with literals. Still no border.
- **Default look (design inventory):** `Chip` + `Chip.Label`, usually `size="sm" variant="soft" color="accent"` (or `color="danger"` for disabled). Accent chip = `color="accent" variant="soft"`.
- **Accent is for ACTION:** metadata chips (topic/tag/skill) = neutral/`--default`, NOT accent (accent on data is noise).

## Decisions (newest first)
- **Category quick-nav on the browse catalog** · chose a **hand-rolled ARIA tablist of
  pill buttons** (`CategoryChipBar`: "All" + icon+name per category, active =
  `border-accent bg-accent/10 text-accent`, `overflow-x-auto` no-wrap on mobile), NOT
  HeroUI `Tabs`/`Chip` · **WHY:** chips must be `role="tab"`+`aria-selected` per the
  spec while acting as a FILTER over shelves (not routed tabs), need horizontal
  scroll without wrapping, and HeroUI Chip isn't pressable — a pill button row with
  tablist semantics is the smallest correct shape (mirrors SegmentedControl's button
  styling language) · course-catalog browse (`features/course/browse/CategoryChipBar`)
  · 2026-07-02

### 2026-06-21 — Chip "nổi" = explicit `bg-success/10 text-success` (not `variant="primary"`)
- **Scenario:** the "Nên xem" recommended chip used `<Chip variant="primary" color="success">` → a SOLID green
  fill, too heavy/loud. Thầy: "để text-success và bg-success/10 … là chip nổi thì áp rules này."
- **Chose:** `<Chip size="sm" variant="secondary" color="success" className="bg-success/10 text-success">` —
  light green tint bg + green text (bright but soft), matching `ReadBadge`. Applied to both
  `FoundationCard` + shared `FoundationMeta`.
- **WHY:** a chip that must POP gets the EXPLICIT `bg-<token>/10 text-<token>` override. `variant="primary"`
  (solid fill) is too loud for a chip; HeroUI's default `secondary`/soft renders too dark in this theme. The
  tint-10 + token-text form is the house's bright-but-soft chip. Now a STRICT baseline rule (see above), reused
  for any semantic emphasis chip (success/danger/warning/…).

### 2026-06-21 — "Nên xem" / recommended chip = success GREEN, not warning yellow
- **Scenario:** the foundations "Nên xem" (recommended) chip rendered `color="warning"` (yellow). Thầy: "nên xem
  thì để màu xanh."
- **Chose:** `color="success"` (green) for the recommended badge, everywhere it appears (`FoundationCard` meta
  + shared `FoundationMeta`). (Class form later refined to `variant="secondary"` + `bg-success/10 text-success`
  — see the newer "chip nổi" decision above.)
- **WHY (semantic colour mapping):** a **positive endorsement / "good, do this"** signal maps to **success
  (green)**, not warning (yellow = caution/attention). Yellow on a *recommendation* reads as a mild alarm. Match
  the chip colour to the MEANING, not just "make it pop". (Same family as the read-badge = `success` rule.)

## Gotchas
_(empty)_
