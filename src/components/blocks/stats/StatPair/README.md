# StatPair

A single count + label statistic stacked vertically; a tier-3 presentational block that renders one metric inside a stat strip.

## When to use

- Use when you need to display one headline number (follower count, XP, lesson count, etc.) alongside its short descriptive label.
- Use inside a ribbon or row of sibling `StatPair` elements — the block has no card frame of its own and expects the parent (`StatRibbon` or equivalent) to supply the surface and dividers.
- Do **not** use when you need a badge, chip, or icon alongside the value — reach for a richer stat component instead.
- Do **not** use as a standalone card; without a surrounding container it will appear frameless and unstyled.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `React.ReactNode` | — | The headline statistic (e.g. `"1,204"` or `12`). Rendered large (`text-xl font-semibold`). |
| `label` | `React.ReactNode` | — | Caption describing the metric (e.g. `"Followers"`). Rendered small and muted beneath the value. |
| `align` | `"start" \| "center"` | `"start"` | Horizontal alignment of the stacked value + label. `"start"` = left-aligned; `"center"` = centered. |
| `className` | `string` | `undefined` | Extra Tailwind classes merged onto the root `<div>` via `cn()`. |

> `StatPairProps` extends `WithClassNames<undefined>`, so only the root `className` is available — there are no slot class overrides.

## Usage

```tsx
import React from "react"
import { StatPair } from "@/components/blocks"

export const ProfileStats = () => (
    <div className="flex gap-6 px-4 py-3 bg-content1 rounded-xl">
        <StatPair value="1,204" label="Followers" />
        <StatPair value="87" label="Following" />
        <StatPair value="42" label="Lessons done" />
        <StatPair value="3,800" label="XP" align="center" />
    </div>
)
```

## Composes

None — leaf block. Uses only `cn` from `@heroui/react` and native `<div>` / `<span>` elements.

## Notes

- **No frame**: the block intentionally has no background, border, or padding. The parent container must supply the card surface and any dividers between pairs.
- **Spacing**: the value–label gap is `gap-0` (0 spacing scale = tightly coupled pair per project spacing rules). Do not add vertical gap between the two spans.
- **Token rules**: `text-foreground` for the value, `text-muted` for the label — both follow the design-token semantic palette; do not override with raw colors.
- **`value` and `label` accept `ReactNode`**: you can pass a `<Chip>` or formatted element, but keep it short — the block is sized for a compact one-liner metric.
- **Accessibility**: the block has no ARIA role. If the stat strip is semantically meaningful (e.g. a `<dl>` list), wrap `value` in `<dd>` and `label` in `<dt>` at the call site, or add `aria-label` on the parent container.
