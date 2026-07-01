# ListRow

A generic GitHub-style list row — tier-3 presentational block that renders a leading icon/avatar, a title + optional subtitle text column, and a right-aligned meta + trailing cluster inside any list container.

## When to use

- **Use it** when you need a uniform row layout inside a `SectionCard` or any vertical list: notification items, course entries, member rows, activity feeds.
- **Use it** when a row may or may not be interactive — it adapts automatically based on whether `onPress` or `href` is provided.
- **Avoid it** for flat label-value pairs with no leading graphic; a plain `<div>` grid or a description-list is clearer there.
- **Avoid it** when each row needs a fully custom internal layout; in that case compose your own row rather than stretching this block.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `React.ReactNode` | — | **Required.** Primary line; rendered as medium-weight foreground text, truncated to one line. |
| `subtitle` | `React.ReactNode` | `undefined` | Secondary line below the title; muted, smaller text, truncated to one line. |
| `leading` | `React.ReactNode` | `undefined` | Node rendered before the text column (icon, avatar). Does not shrink. |
| `meta` | `React.ReactNode` | `undefined` | Right-aligned metadata cluster (chips, counts, timestamps) placed before `trailing`. |
| `trailing` | `React.ReactNode` | `undefined` | Far-right node, typically a chevron or an inline action button. |
| `divider` | `boolean` | `false` | When `true`, adds a bottom border (`border-separator`) so consecutive rows read as a separated list. Omit on the last row of a group. |
| `onPress` | `() => void` | `undefined` | Click/keyboard handler. Providing it makes the row interactive (hover surface, keyboard accessible). |
| `href` | `string` | `undefined` | When set, the entire row renders as an `<a>` element so navigation happens on click. If both `href` and `onPress` are supplied, `onPress` fires via `onClick` on the anchor. |
| `className` | `string` | `undefined` | Extra Tailwind classes merged onto the root element via `cn`. |

## Usage

```tsx
import React from "react"
import { ListRow } from "@/components/blocks"
import { ChevronRight } from "@gravity-ui/icons"
import { Chip } from "@heroui/react"

export const CourseList = () => (
    <div>
        <ListRow
            leading={<img src="/icons/react.svg" className="size-8 rounded" alt="" />}
            title="React 19 Fundamentals"
            subtitle="Module 4 · Server State"
            meta={
                <Chip color="success" variant="soft" size="sm">
                    <Chip.Label>In progress</Chip.Label>
                </Chip>
            }
            trailing={<ChevronRight className="size-4 text-muted" />}
            href="/courses/react-19"
            divider
        />
        <ListRow
            leading={<img src="/icons/nextjs.svg" className="size-8 rounded" alt="" />}
            title="Next.js App Router"
            subtitle="Module 13 · RSC"
            meta={
                <Chip color="default" variant="soft" size="sm">
                    <Chip.Label>Not started</Chip.Label>
                </Chip>
            }
            trailing={<ChevronRight className="size-4 text-muted" />}
            href="/courses/nextjs-app-router"
        />
    </div>
)
```

## Composes

- `cn` from `@heroui/react` — class merging
- `WithClassNames` base type from `@/modules/types/base/class-name`
- No other HeroUI components or blocks are used internally — leaf block

## Notes

- **Interactive mode** — the row becomes interactive when either `onPress` or `href` is provided. It gains `hover:bg-surface-secondary`, a `rounded-2xl` shape, and keyboard focus handling (`focus-visible:bg-surface-secondary` + `outline-none`).
- **Keyboard accessibility** — when only `onPress` is set the row renders as `role="button"` with `tabIndex={0}` and responds to both `Enter` and `Space` via `onKeyDown`.
- **Anchor + handler** — when `href` is set, the row is an `<a>` element. Any `onPress` supplied alongside `href` is attached as `onClick` on that anchor, so both navigation and side effects fire together.
- **Truncation** — `title` and `subtitle` are always single-line truncated (`truncate`). If you need multi-line text, pass a custom node and manage overflow yourself in the wrapper.
- **Divider on last row** — do not set `divider` on the final item in a group to avoid a trailing border at the bottom of the list.
- **Leading slot is shrink-free** — the leading container has `shrink-0`, so icons and avatars never compress on narrow viewports.
- **Token rule** — subtitle uses `text-muted` (semantic token); do not override it with a hardcoded gray to stay aligned with the design-system dark/light themes.
