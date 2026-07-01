# StatusChip

A tier-3 presentational block — a small, pill-shaped semantic status indicator built on HeroUI `Chip` that maps a named tone to a chip color and optionally renders a leading icon.

## When to use

- Use when you need to surface a status, state, or category tag (e.g. "Active", "Pending", "Error") in a compact inline format.
- Use when the status meaning maps cleanly to one of the five semantic tones (`neutral`, `success`, `warning`, `danger`, `accent`).
- **Do not use** when the chip must be interactive (clickable/dismissible) — reach for HeroUI `Chip` directly with `onClose` or `onPress`.
- **Do not use** when you need a full badge with counters or avatars; consider `AvatarChip` or a raw HeroUI `Badge` instead.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tone` | `"neutral" \| "success" \| "warning" \| "danger" \| "accent"` | `"neutral"` | Semantic tone that drives the chip color. `neutral` maps to HeroUI `default`. |
| `icon` | `ReactNode` | `undefined` | Optional leading icon rendered before the label (e.g. a `@gravity-ui/icons` icon). |
| `children` | `ReactNode` | — (required) | Label content rendered inside `Chip.Label`. |
| `className` | `string` | `undefined` | Extra Tailwind classes merged onto the root `Chip` (via `cn`). Inherited from `WithClassNames`. |

## Usage

```tsx
import React from "react"
import { ArrowRotateLeft } from "@gravity-ui/icons"
import { StatusChip } from "@/components/blocks"

export const LessonStatus = () => (
    <div className="flex gap-3">
        <StatusChip tone="success">Completed</StatusChip>
        <StatusChip tone="warning" icon={<ArrowRotateLeft width={12} height={12} />}>
            In Review
        </StatusChip>
        <StatusChip tone="danger">Failed</StatusChip>
        <StatusChip tone="accent">New</StatusChip>
        <StatusChip>Draft</StatusChip>
    </div>
)
```

## Composes

- **HeroUI `Chip`** — root element; always rendered with `variant="soft"` and `size="sm"`.
- **`WithClassNames`** — base type that injects the `className` prop.

No other blocks or reuseable modules are composed.

## Notes

- The chip is always `size="sm"` and `variant="soft"` — these are hard-coded and not overridable via props. Use `className` only for layout adjustments (e.g. margin, flex-shrink).
- `rounded-full` is applied unconditionally; do not counteract it with a conflicting border-radius class.
- The `icon` node is rendered **before** `Chip.Label` inside the chip. Size it to match `sm` chip height — `width={12} height={12}` (12 px) is a safe default for `@gravity-ui/icons`.
- Do not pass phosphor icons — phosphor is not installed. Use `@gravity-ui/icons` for generic icons and `@icons-pack/react-simple-icons` for brand logos.
- This block holds no internal state, performs no data fetching, and fires no callbacks — it is purely presentational.
- Accessibility: the chip renders as a `<span>` by default (HeroUI). If the status must be announced to screen readers in context, wrap it with an `aria-label` on a parent or add a visually-hidden description alongside it.
