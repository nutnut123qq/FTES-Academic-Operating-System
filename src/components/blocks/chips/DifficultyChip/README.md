# DifficultyChip

A small pill-shaped badge that communicates content difficulty through color-coded semantics; a tier-3 presentational block.

## When to use

- **Display a difficulty tag** on a lesson card, challenge card, or list row where the user needs to gauge effort at a glance.
- **Render a static label** alongside a challenge or course title in any layout that needs a compact, colored indicator.
- **Do NOT use** when you need an interactive filter control — reach for a `<Chip>` wrapped in a toggle or a `FilterBar` block instead.
- **Do NOT use** for generic category labels or status badges unrelated to difficulty — use a plain `<Chip>` with an explicit color.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `difficulty` | `"beginner" \| "intermediate" \| "advanced" \| "insane"` | — **(required)** | Difficulty level to display. Drives the chip color automatically. |
| `label` | `ReactNode` | capitalized `difficulty` string | Override the visible text or node inside the chip. |
| `className` | `string` | `undefined` | Extra Tailwind classes merged onto the `<Chip>` root via `cn`. |

## Usage

```tsx
import { DifficultyChip } from "@/components/blocks"

// Default label ("Intermediate")
<DifficultyChip difficulty="intermediate" />

// Custom label
<DifficultyChip difficulty="advanced" label="Hard" />

// Inside a card header, extra margin
<DifficultyChip difficulty="insane" className="mt-1" />
```

## Composes

- **HeroUI `<Chip>`** — `variant="soft"` `size="sm"` with `<Chip.Label>` for the inner text.
- **HeroUI `cn`** — merges the `rounded-full` base class with any caller-supplied `className`.

No other reuseable or block-level components are used — this is a leaf block.

## Notes

- **Color mapping** is hard-coded and intentional: `beginner → success (green)`, `intermediate → warning (yellow)`, `advanced → danger (red)`, `insane → accent (purple/brand)`. Do not override via `color` — pass the correct `difficulty` instead.
- **`className` goes on the outer `<Chip>`**, not the label. If you need to style the text, pass a `<span>` as the `label` prop.
- **`WithClassNames<undefined>`** is the props base — there are no named sub-element class slots; only the root `className` is exposed.
- **Accessibility**: the chip renders as a `<span>` (HeroUI default). If the difficulty label is the only contextual cue in a given UI, add a visually-hidden `aria-label` on the surrounding container to give screen-reader users the same information.
- **No internal state** — purely driven by props; safe to render in SSR and inside `React.memo` wrappers.
