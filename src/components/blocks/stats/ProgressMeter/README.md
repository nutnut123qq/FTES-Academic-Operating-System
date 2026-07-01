# ProgressMeter

A tier-3 presentational block that renders an optional label/value row above a HeroUI `ProgressBar` — no data fetching, no store reads.

## When to use

- When you need to display a single numeric progress value (e.g. course completion %, XP toward next milestone, challenge score).
- When you want an optional human-readable label and/or a percentage readout alongside the bar.
- **Not** when you need stacked multi-metric progress — compose multiple `ProgressMeter` instances side-by-side instead.
- **Not** when you need interactive input; this block is display-only.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | — | Current progress value. Should be within `[0, max]`. |
| `max` | `number` | `100` | Maximum value representing 100 % completion. Guarded against zero. |
| `label` | `ReactNode` | `undefined` | Descriptive label rendered on the left of the top row. Pass a translated string — this block never calls `useTranslations`. |
| `showValue` | `boolean` | `false` | When `true`, renders the rounded completion percentage on the right of the top row. |
| `className` | `string` | `undefined` | Extra Tailwind classes applied to the outer `div` wrapper (from `WithClassNames`). |

## Usage

```tsx
import { ProgressMeter } from "@/components/blocks"

// Minimal — bar only
<ProgressMeter value={42} />

// With label and percentage readout
<ProgressMeter
    value={34}
    max={50}
    label="Lessons completed"
    showValue
    className="w-full"
/>
```

## Composes

- **HeroUI** `ProgressBar` (with `ProgressBar.Track` / `ProgressBar.Fill` children), color `"accent"`, size `"sm"`.
- `cn` from `@heroui/react` for class merging.
- `WithClassNames<undefined>` base type from `@/modules/types/base/class-name`.

## Notes

- The top row (label + percentage) is only rendered when at least one of `label` or `showValue` is truthy — no empty row is inserted.
- The displayed percentage is **rounded** (`Math.round`), so `value=1 max=3` shows `33 %`.
- `max` is guarded: if `0` or negative is passed, the denominator falls back to `1` to avoid `NaN` / `Infinity`.
- `aria-label` is set to the `label` string when `label` is a plain `string`; otherwise it falls back to `"Progress"` — pass a descriptive string `label` for best screen-reader output.
- Label and percentage text use the `text-muted` token (small, low-contrast) — do not rely on this bar alone to convey pass/fail state; pair with a `Chip` or icon when semantic feedback is needed.
- The bar is always `accent` colored. If a different color is needed, file a variant request rather than overriding via `className`.
