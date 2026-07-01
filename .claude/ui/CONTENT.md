# journals/ui/ — the visual system (how StarCi looks)

The house's **UI/visual foundations** — tokens, color, spacing, radius, typography, and the visual
conventions for forms/tooltips. Grounded in real `globals.css` values (mined from the now-deleted
design-system docs + `rules/main.md`). Siblings: `../ux/` (page layout/flow + web UX lessons),
`../decision/<block>.md` (per-block decision logs), `../../cannon/CONTENT.md` (code rules).

## North-star / mindset
- **Content-first, clean, lots of whitespace.** Big-radius cards, soft `default/40` surfaces, secondary text `text-muted`.
- **Accent teal-green** (logo StarCi `#00a898` ≈ token `--accent`) for every emphasis: active link, chip, primary button, "Save %".
- **Light + Dark first-class** (`next-themes`, default **dark** + `enableSystem`). Every component must look right in both → use semantic tokens (`bg-default`, `text-foreground`), never hardcode color. No route forces a theme.
- **HeroUI v3 first** (`@heroui/react` + `@heroui/styles`) — don't hand-roll primitives. Icons: Phosphor `*Icon` (`weight="duotone"`); brand logos `react-icons/fa6`.
- **Constraints liberate:** lock the choices (fixed variants, 5-step spacing, 3 radii) → less dithering, faster + prettier. **Design in GRAY first** (layout + hierarchy before color); one primary action per screen.
- **Each decision lives in exactly ONE layer; style flows one way — features only COMPOSE, never paint.** 4 layers: Tokens (`globals.css`) → HeroUI + globals → Blocks (own all style, props-only) → Features (read store/SWR, placement classes only).
- **Empty/Loading/Error are real states**, designed from the start (every fetch → `AsyncContent`). **Text IS the interface** — clear labels beat pretty icons. **Consistency > cleverness; a11y is #1** (contrast ≥4.5:1, focus ring, touch ≥44px).

## Design tokens (oklch, from `globals.css`)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--accent` | `oklch(62.04% 0.1950 185.90)` | (same) | Brand teal-green ≈ logo `#00a898`; links/chips/primary/"Save %" |
| `--accent-foreground` | `oklch(99.11% 0 0)` | | Text on accent |
| `--background` | `oklch(97.02% 0.0033 185.90)` (off-white, teal-tinted) | `oklch(12% …)` | Page background |
| `--foreground` | `oklch(21.03% …)` | `oklch(99.11% …)` | Primary text → `text-foreground` |
| `--muted` | `oklch(55.17% …)` | | Secondary text → `text-muted` (⚠️ NOT `text-foreground-500`) |
| `--default` | `oklch(94% …)` | `oklch(27.40% …)` | Soft card/chip surface (`bg-default`, `bg-default/40`) |
| `--success` | `oklch(73.29% 0.1948 142.66)` | | Green state |
| `--danger` | `oklch(65.32% 0.2343 17.59)` | | Error/disabled |
| `--warning` | `oklch(78.19% 0.1595 64.18)` | | Callout / input-required |

- Neutrals share hue **185.90** (teal) → the whole app reads subtly teal. Logo `#00a898` (StarC teal) + `#6c8aa3` (slate "academy").
- **Difficulty palette:** Easy = cyan-500 · Medium = yellow-500 · Hard = red-500 · Insane = purple-500 (`--difficulty-insane`, light+dark).
- **Color rule:** chips/badges = soft color blocks, NO border (`variant="soft"` / `bg-[c]/10` + same-color text). Categorical colors map to success/warning/danger/accent. Language brand colors are the one valid "no-hex" exception (`modules/utils/language.ts`).

## Radius & spacing
- **Radius:** form/modal container `rounded-3xl`; content card `rounded-xl`; code block `rounded-xl`; chip/pill `rounded-full`. Concentric `rounded-2xl` (frame) → `rounded-xl` (field) → `rounded-full`; child < parent; components don't hand-roll frame radius. Tokens: `--radius: 0.5rem`, `--field-radius: 0.75rem`. Shadow is flat (overlay only).
- **Spacing scale `0 / 2 / 3 / 4 / 6`** (4px grid, by **semantic relationship** not size feel). Each property
  has its own grounded file — these are the source of truth (`/starci-fe-layout-apply` reads them):
  - **[`gap.md`](gap.md)** — `gap-0` title↔desc · `gap-2` label↔input/coupled · `gap-3` same function (inside a card) · `gap-6` different function (section↔section, card↔card). Snap `gap-1.5` (194 uses) → `gap-2`.
  - **[`padding.md`](padding.md)** — page shell `p-3` · card `px-4 py-3` (fixed) · rail/panel `p-6` · block owns padding.
  - **[`margin.md`](margin.md)** — gap-first, margin-last; only `mx-auto` + tiny optical nudges.
- Container caps: page `max-w-[1280px] mx-auto`; reading column `max-w-3xl mx-auto`. Vertical scroll → HeroUI `ScrollShadow`, not raw `overflow-y-auto`.

## Typography (Open Sans; type scale)
Font is **Open Sans** (`next/font`). ⚠️ Known drift: `globals.css` sets `--font-sans: var(--font-inter)` but `--font-inter` is undefined → empty font var. Per-role canonical classes (map to HeroUI `Typography type`):

| Role | Class | Notes |
|---|---|---|
| Display / page hero | `text-4xl font-bold` | `text-3xl md:text-4xl` on mobile |
| Subpage / modal title | `text-2xl font-bold` | |
| Section heading | `text-lg font-semibold` | ONE spec |
| Card / sub heading | `text-base font-semibold text-foreground` | → HeroUI `Label` for sub-section labels |
| Body | `text-sm` | default text |
| Description / muted | `text-sm text-muted` | canonical muted = `text-muted` (⚠️ `text-foreground-500/400/600` don't exist) |
| Label / eyebrow / meta / chip | `text-xs text-muted` | **normal case**, not all-caps (uppercase only for a deliberate accent badge) |

Weights: title `bold`, heading/card `semibold`, sub-label/price `medium`. No thin/light/extrabold. Prefer HeroUI `Typography` (`type` ∈ `body|body-sm|body-xs|code|h1..h6`, `color` only `default|muted`) over `<div>`+text classes; `PageHeader` title = `Heading level={3} weight="bold"`.

## Form & tooltip visual conventions
- **Input variant by SURFACE (2026-06-21):** the `TextField` `variant` is chosen by what the input sits ON,
  not by emphasis. **On the page background → `variant="primary"`.** **On a raised surface — card, modal,
  drawer, popover → `variant="secondary"`** (the lighter field reads correctly against the surface; primary's
  accent border fights it). E.g. the content-AI chat composer lives in a popover/drawer → `variant="secondary"`;
  `SearchBar` on a panel is already secondary. The send/submit `Button` keeps its own emphasis (`primary`) —
  this rule is the FIELD only.
- **Forms:** `TextField` children must be valid slots — descriptions/counters/hints use `slot="description"` (never a bare `<Typography>`/`<div>`, React Aria throws). Checkbox = HeroUI `Checkbox` compound. Small 1-of-few selectors = `Select` dropdown (`w-fit min-w-48`) or `Tabs variant="primary"` — NEVER a row of pill buttons. Single-cluster form sections stay flat (no extra `Card`). Save button = `self-start` (hugs text), not `fullWidth`. Avatar upload = block `ImageDropzone` in a modal via a zustand overlay store.
- **Secrets** (API key/token): encrypted at rest in BE, plaintext never returned; input write-only (`type="password"`, no prefill); stored value shown masked `••••{last4}` with "Replace"/"Remove" — no "reveal" button.
- **Tooltips:** any hard term (rank, tier, KPI, streak, league, p99…) → block `InfoTooltip` (never raw HeroUI `Tooltip` in a feature). Plain-language, 1–3 sentences, **personalized when data allows** ("why YOU are at this level" + "what's needed to level up"); text via i18n. `Tooltip.Content` already pads — no extra `p-*` wrapper.
