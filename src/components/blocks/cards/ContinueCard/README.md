# ContinueCard

A presentational "pick up where you left off" card for surfacing a single
in-progress course, module, or lesson with a progress bar and an optional
call-to-action label. Built on `SectionCard` and `ProgressMeter`.

## When to use

- Use on dashboard / home pages to highlight the learner's most recent item.
- Use in course detail pages to surface the next unfinished lesson.
- Use whenever you need a compact, progress-aware card that links to one item.
- Do NOT use for items that have not been started (progress = 0 reads oddly as a ContinueCard — prefer a `MediaCard` without a progress footer).
- Do NOT use for grids of many items — `MediaCard` is the right shape for that.

## Props table

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` | — (required) | Primary label of the item (course / lesson title). Truncated to one line. |
| `value` | `number` | — (required) | Current progress value forwarded to `ProgressMeter`. Should be in `[0, max]`. |
| `cover` | `React.ReactNode` | `undefined` | Optional media node (thumbnail, course icon) rendered flush-left, shrink-0. |
| `subtitle` | `React.ReactNode` | `undefined` | Secondary label under the title (module name, lesson number). Truncated to one line. |
| `max` | `number` | `100` | Maximum value representing 100 % completion. Forwarded to `ProgressMeter`. |
| `ctaLabel` | `React.ReactNode` | `undefined` | Call-to-action label pinned to the far right (e.g. "Continue"). Rendered accent-coloured. |
| `onPress` | `() => void` | `undefined` | When set, the whole card is wrapped in a `<button>`. Prefer `href` for navigation. |
| `href` | `string` | `undefined` | When set, the whole card is wrapped in an `<a>`. Takes priority over `onPress`. |
| `className` | `string` | `undefined` | Applied to the outermost element for caller placement (width, margin, grid area). |

## Usage

```tsx
import React from "react"
import { ContinueCard } from "@/components/blocks/cards"

export const DashboardContinue = () => (
    <ContinueCard
        href="/courses/fullstack-mastery/modules/3/lessons/2"
        cover={
            <img
                src="/thumbnails/fullstack.webp"
                alt=""
                className="h-12 w-12 rounded-lg object-cover"
            />
        }
        title="Module 3 — API Design"
        subtitle="Lesson 2: REST vs GraphQL"
        value={40}
        max={100}
        ctaLabel="Continue"
    />
)
```

## Composes

- **`SectionCard`** (`@/components/reuseable`) — supplies the bordered, flat-no-shadow card frame with 3xl radius and padded body. `ContinueCard` never hand-writes `rounded`, `border`, or `bg-*`.
- **`ProgressMeter`** (`@/components/blocks/stats`) — renders the labelled accessible progress bar beneath the info row.
- **`Typography`** (`@heroui/react`) — all text nodes use `Typography` props (weight, type, color, truncate) — no raw `<div>`/`<span>` with text utility classes.
- **`WithClassNames`** (`@/modules/types/base/class-name`) — base interface that supplies `className`.

## Notes

- **Interactivity wrapper pattern.** HeroUI v3 `Card` / `SectionCard` has no `isPressable`, `onPress`, or `href` prop. `ContinueCard` wraps the `<SectionCard>` in a real `<a>` (for `href`) or `<button>` (for `onPress`) so the entire card surface is one accessible tap/click target. When neither prop is provided the card is a static surface.
- **`className` placement.** When the card is interactive, `className` is placed on the outer `<a>` / `<button>` wrapper — not on `SectionCard` — so layout constraints (width, margin, grid area) apply to the true outermost element.
- **Truncation via prop.** Both `title` and `subtitle` use the `truncate` prop on `Typography` (not `className="truncate"`), as required by LAW 2.
- **`ctaLabel` colour.** The `text-accent` class on the CTA `Typography` is the one allowed `className` colour exception per LAW 1 — the HeroUI `color` prop lacks an "accent" token for body text.
- **Spacing.** The card body uses `gap-3` (same-function items, per the project spacing-scale convention). The info row uses `gap-3` between cover, text column, and CTA.
- **`cover` sizing.** Size and shape of the cover node (rounded corners, aspect ratio) are the caller's responsibility — pass fully styled nodes.
- **Accessibility.** When `href` is set, the outer `<a>` has no extra `aria-label`; ensure `title` is descriptive enough to serve as the link label. When `onPress` is used, the `<button>` gets `type="button"` and `text-left`.
