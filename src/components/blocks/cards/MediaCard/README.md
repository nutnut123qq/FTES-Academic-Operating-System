# MediaCard

A consolidated, presentational content card for course / lesson / challenge / blog grids — a tier-3 presentational block.

## When to use

- Use when you need a uniform card shape across any content-grid page (courses, lessons, challenges, blog posts).
- Use when the card may or may not be interactive — `href` and `onPress` are both optional, so the same block works for static displays and clickable grids.
- Prefer `href` over `onPress` for pure navigation so the browser renders a real anchor (right-click, open in tab, SEO).
- Do NOT use for profile/user cards — reach for `ProfileCard` or a similar identity-focused block instead.
- Do NOT use when you need a pressable card with HeroUI's built-in press animation — this block intentionally wraps `<a>` / `<button>` around a static `<Card>` (HeroUI v3 `Card` is not pressable).

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `React.ReactNode` | — (required) | Primary heading rendered as `text-base font-medium text-foreground`. |
| `cover` | `React.ReactNode` | `undefined` | Optional media node (e.g. `<img>`, gradient banner) rendered flush at the top of the card, outside the padded body. |
| `meta` | `React.ReactNode` | `undefined` | Optional metadata row under the title — typically HeroUI `Chip`s or muted text (category, difficulty, duration). |
| `description` | `React.ReactNode` | `undefined` | Optional excerpt clamped to two lines (`line-clamp-2 text-sm text-muted`) to keep grid rows uniform. |
| `footer` | `React.ReactNode` | `undefined` | Optional footer pinned at the bottom of the body — CTA button, price, or progress indicator. |
| `href` | `string` | `undefined` | When set, the whole card becomes a native `<a>` anchor. Takes priority over `onPress`. |
| `onPress` | `() => void` | `undefined` | When set (and `href` is absent), the whole card becomes a `<button>`. |
| `className` | `string` | `undefined` | Applied to the outermost element (`<a>`, `<button>`, or `<Card>`). Inherited from `WithClassNames`. |

## Usage

```tsx
import React from "react"
import { Chip } from "@heroui/react"
import { MediaCard } from "@/components/blocks"

export const CourseCardExample = () => (
    <MediaCard
        href="/courses/fullstack-mastery"
        cover={
            <img
                src="/thumbnails/fullstack.webp"
                alt=""
                className="aspect-video w-full object-cover"
            />
        }
        title="Fullstack Mastery"
        meta={
            <>
                <Chip variant="soft" size="sm">
                    <Chip.Label>20 modules</Chip.Label>
                </Chip>
                <Chip color="success" variant="soft" size="sm">
                    <Chip.Label>Intermediate</Chip.Label>
                </Chip>
            </>
        }
        description="Build production-grade fullstack apps with TypeScript, React, and NestJS — from zero to deployed."
        footer={
            <span className="text-sm font-medium text-foreground">Free</span>
        }
    />
)
```

## Composes

- **HeroUI `Card` / `CardContent`** — supplies the `3xl` radius, border, flat no-shadow surface, and body padding via global token defaults. `MediaCard` never hand-writes `rounded`, `border`, or `bg-*`.
- **`WithClassNames`** — base interface from `@/modules/types/base/class-name` that supplies the `className` prop.

## Notes

- **Interactivity wrapper pattern.** HeroUI v3 `Card` has no `isPressable` / `onPress` / `href` prop. `MediaCard` wraps the card in a real `<a>` (for `href`) or `<button>` (for `onPress`) so the entire surface is one accessible tap/click target. When neither prop is provided the card is a static `<div>`.
- **`className` placement.** When the card is interactive, `className` is placed on the outer `<a>` / `<button>` wrapper (not on `Card`) so layout concerns (grid sizing, margin, etc.) apply to the true outermost element.
- **`cover` is unpadded.** The cover node renders in a plain `<div className="w-full">` directly inside `<Card>`, before `<CardContent>`, so an `<img>` or gradient fills edge-to-edge. Do not add padding inside your cover node.
- **`description` line clamp.** The description is always clamped to two lines via Tailwind `line-clamp-2`. Avoid passing rich node trees here — plain strings or a single `<span>` work best.
- **Spacing.** The body uses `gap-3` between all slots (title / meta / description / footer) — consistent with the project's spacing-scale semantic convention (same-function items).
- **Accessibility.** When `href` is set, the outer `<a>` has no `aria-label`; ensure the `title` prop is descriptive enough to serve as the link label. When `onPress` is used, the `<button>` gets `type="button"` and `text-left` so it does not accidentally submit forms and aligns text correctly.
