# MetricCard

A standalone, framed single-metric display built on `SectionCard` — a tier-3 presentational block that receives all content via props and performs no data fetching or store access.

## When to use

- Use when you need a **self-contained card** showing one key metric (value + label) in a grid or sidebar — e.g. dashboard KPI tiles, profile stats overview.
- Use when the metric card needs its **own visual frame** (border + background from `SectionCard`) and stands alone rather than beside dividers.
- **Do NOT use** for inline stat strips or ribbons — prefer [`StatPair`](../StatPair/index.tsx) there, which is frameless and designed to sit inside a `StatRibbon`.
- **Do NOT use** when you need progress visualization — prefer [`ProgressMeter`](../ProgressMeter/index.tsx) for that.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `React.ReactNode` | — | Optional leading icon rendered above the value. Size to 20–24 px externally. |
| `value` | `React.ReactNode` | **required** | The primary metric value (e.g. `"1,204"`, `"98%"`). Styled `text-2xl font-medium text-foreground`. |
| `label` | `React.ReactNode` | **required** | Short description of what the value measures. Styled `text-xs text-muted`. |
| `hint` | `React.ReactNode` | — | Optional supplementary note (e.g. `"Updated daily"`). Styled `text-xs text-muted` beneath the label. |
| `className` | `string` | — | Extra classes merged onto the `SectionCard` wrapper. |

## Usage

```tsx
import React from "react"
import { MetricCard } from "@/components/blocks"

export const EnrollmentKpi = () => (
    <MetricCard
        value="1,204"
        label="Total Enrollments"
        hint="Updated daily"
    />
)
```

With an icon (using `@gravity-ui/icons`):

```tsx
import React from "react"
import { Person } from "@gravity-ui/icons"
import { MetricCard } from "@/components/blocks"

export const ActiveLearnersKpi = () => (
    <MetricCard
        icon={<Person width={20} height={20} />}
        value="342"
        label="Active Learners"
        hint="Last 30 days"
    />
)
```

## Composes

- `SectionCard` from `@/components/reuseable` — supplies the card frame (border, background, radius, padding).
- `cn` from `@heroui/react` — class name merging.

## Notes

- **No frame duplication**: `SectionCard` already provides `Card` + `CardContent`. Do not wrap `MetricCard` in another `Card`.
- **Icon sizing**: the block does not constrain icon dimensions — size the icon at the call site (20–24 px is typical). The icon is tinted `text-muted`; override via `className` on the icon element if a different tone is needed.
- **Token rules**: value uses `text-foreground`, label and hint use `text-muted`. Do not use `text-[Npx]` — stick to the scale (`text-xs`, `text-2xl`).
- **Accessibility**: `value` and `label` are plain `<span>` elements. If the card needs a semantic heading, pass one as `value` or wrap the card in a landmark at the call site.
- **`hint` vs `label`**: `label` describes *what* the metric is; `hint` adds *context* (source, freshness, comparison). Keep both short — a single line each.
