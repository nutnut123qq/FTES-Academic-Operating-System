# EmptyState

A tier-3 presentational block that renders a centered, vertical stack for empty-state placeholders in lists, panels, or sections that have no content to show.

## When to use

- **Use** when a list, feed, table, or panel returns zero items and you need to communicate that clearly to the user.
- **Use** when the empty state requires a call-to-action (e.g. "Create your first course").
- **Do not use** when the data is still loading — show a skeleton or spinner instead.
- **Do not use** when you need a framed card appearance — wrap this block inside a `SectionCard` or HeroUI `Card` yourself; `EmptyState` deliberately omits any card wrapper.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `title` | `ReactNode` | — *(required)* | Primary message describing why the area is empty (e.g. "No results found"). |
| `icon` | `ReactNode` | `undefined` | Optional decorative icon rendered above the title at `size-8` with a muted tone. Use `@gravity-ui/icons` icons. |
| `description` | `ReactNode` | `undefined` | Optional supporting text giving more detail or guidance, rendered below the title in a smaller muted style. |
| `action` | `ReactNode` | `undefined` | Optional call-to-action rendered below the description, typically a HeroUI `Button`. |
| `className` | `string` | `undefined` | Additional Tailwind classes merged onto the root `div` via `cn`. Inherited from `WithClassNames`. |

## Usage

```tsx
import React from "react"
import { Button } from "@heroui/react"
import { EmptyState } from "@/components/blocks"
import { ListUl } from "@gravity-ui/icons"

export const NoCourses = () => (
    <EmptyState
        icon={<ListUl />}
        title="No courses yet"
        description="You have not enrolled in any course. Browse the catalog to get started."
        action={
            <Button size="sm" color="primary" onPress={() => {}}>
                Explore courses
            </Button>
        }
    />
)
```

## Composes

- `cn` from `@heroui/react` — class merging utility.
- No other HeroUI components, reuseable blocks, or sub-blocks. This is a leaf block.

## Notes

- **No translation logic** — all copy (`title`, `description`) is passed as `ReactNode` so the caller controls i18n.
- **Icon sizing** — the icon slot wraps its child in `<span className="text-muted [&>svg]:size-8">`, so the `size-8` class is applied automatically to the SVG. Do not add a `size` prop directly to the icon.
- **Card wrapper** — the block has no background or border by design. Wrap in `SectionCard` or `Card` when a visual frame is needed.
- **Spacing** — root padding is `py-6` with `gap-3` between slots, following the project's semantic spacing scale (gap-3 = same-function items). Override via `className` only when the surrounding context demands it.
- **Accessibility** — the block renders plain `<p>` tags with no ARIA roles. If the empty state replaces a live list region, add `role="status"` or `aria-live="polite"` on the wrapper at the call site.
